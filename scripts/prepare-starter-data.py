"""Fetch small, traceable teaching samples; never download the 356 MB fan ZIP."""
import hashlib
import io
import json
import re
import zipfile
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[1]
FAN_URL = 'https://zenodo.org/records/15097779/files/dev_fan.zip'
FAN_BYTES = 355989145


class RemoteZip(io.RawIOBase):
    def __init__(self):
        self.pos = 0

    def seek(self, offset, whence=0):
        self.pos = offset if whence == 0 else self.pos + offset if whence == 1 else FAN_BYTES + offset
        if not 0 <= self.pos <= FAN_BYTES:
            raise ValueError('Invalid archive offset')
        return self.pos

    def tell(self):
        return self.pos

    def read(self, size=-1):
        size = FAN_BYTES-self.pos if size < 0 else min(size, FAN_BYTES-self.pos)
        if not size:
            return b''
        if size > 2_000_000:
            raise ValueError('Refusing an unexpectedly large archive read')
        with requests.get(FAN_URL, headers={'Range': f'bytes={self.pos}-{self.pos+size-1}', 'Accept-Encoding': 'identity'}, stream=True, timeout=40) as response:
            if response.status_code != 206 or not response.headers.get('Content-Range', '').startswith(f'bytes {self.pos}-'):
                raise RuntimeError('Server does not support bounded range requests; no full ZIP was downloaded')
            content = response.raw.read(size+1)
        if len(content) != size:
            raise RuntimeError('Archive range length mismatch')
        self.pos += size
        return content


def fan_samples():
    output = ROOT / 'projects/machine-health/data'
    output.mkdir(parents=True, exist_ok=True)
    pattern = re.compile(r'(?P<domain>source|target)_(?P<split>train|test)_(?P<label>normal|anomaly)_')
    with zipfile.ZipFile(RemoteZip()) as archive:
        metadata=archive.getinfo('fan/attributes_00.csv')
        if metadata.file_size>100_000:
            raise ValueError('Unexpected attribute table size')
        attribute_content=archive.read(metadata)
        (output/'attributes_00.csv').write_bytes(attribute_content)
        groups = {}
        for item in archive.infolist():
            match = pattern.search(item.filename)
            if item.filename.endswith('.wav') and match:
                key = (match['split'], match['domain'], match['label'])
                groups.setdefault(key, []).append(item)
        expected = {('train','source','normal'), ('train','target','normal'),
                    ('test','source','normal'), ('test','source','anomaly'),
                    ('test','target','normal'), ('test','target','anomaly')}
        if set(groups) != expected:
            raise ValueError('Unexpected official fan split schema')
        samples = []
        for key, items in sorted(groups.items()):
            for item in sorted(items, key=lambda x:x.filename)[:2]:
                if item.file_size > 500_000:
                    raise ValueError('Unexpected WAV size')
                content = archive.read(item)  # zipfile verifies each entry's CRC.
                if content[:4] != b'RIFF' or content[8:12] != b'WAVE':
                    raise ValueError('Invalid WAV header')
                name = Path(item.filename).name
                (output / name).write_bytes(content)
                samples.append(dict(file=name, archivePath=item.filename, split=key[0], domain=key[1],
                                    label=int(key[2]=='anomaly'), sha256=hashlib.sha256(content).hexdigest()))
        provenance = dict(source=FAN_URL, archiveBytes=FAN_BYTES, upstreamArchiveMd5='61b6aae6d5ebb8cb937faa86741fbf47',
                          verification='Selected entries CRC verified; sample SHA256 stored. Whole-archive MD5 not checked because the whole ZIP is not downloaded.',
                          attributeTable=dict(file='attributes_00.csv',sha256=hashlib.sha256(attribute_content).hexdigest()),
                          license='CC-BY-NC-SA-4.0', selection='First two filenames in each of six split/domain/label groups; teaching sample, not a benchmark',
                          fullCounts={'/'.join(k):len(v) for k,v in sorted(groups.items())}, samples=samples)
        (output/'provenance.json').write_text(json.dumps(provenance,ensure_ascii=False,indent=2),encoding='utf-8')
        print(f'Fan: {len(samples)} WAVs, {sum(p.stat().st_size for p in output.glob("*.wav"))} bytes; CRC verified',flush=True)


def pusht_sample():
    output = ROOT / 'exercises/lerobot-pusht/data'
    output.mkdir(parents=True,exist_ok=True)
    response = requests.get('https://huggingface.co/api/datasets/lerobot/pusht',timeout=30)
    response.raise_for_status()
    revision = response.json()['sha']
    if not re.fullmatch(r'[0-9a-f]{40}',revision):
        raise ValueError('Invalid dataset revision')
    paths = ['meta/info.json','data/chunk-000/file-000.parquet']
    files=[]
    for path in paths:
        url=f'https://huggingface.co/datasets/lerobot/pusht/resolve/{revision}/{path}'
        with requests.get(url,stream=True,timeout=40) as r:
            r.raise_for_status()
            if int(r.headers.get('Content-Length','0')) > 12_000_000:
                raise ValueError('Dataset file exceeds starter budget')
            chunks=[]; size=0
            for chunk in r.iter_content(65536):
                size+=len(chunk)
                if size>12_000_000:
                    raise ValueError('Dataset file exceeds starter budget')
                chunks.append(chunk)
        content=b''.join(chunks)
        name=Path(path).name
        if path.endswith('.json'):
            info=json.loads(content)
            if info.get('codebase_version')!='v3.0':
                raise ValueError('Expected a v3.0 dataset; do not mix with the stale v2 dataset card')
        (output/name).write_bytes(content)
        files.append(dict(path=path,bytes=len(content),sha256=hashlib.sha256(content).hexdigest()))
    (output/'provenance.json').write_text(json.dumps(dict(dataset='lerobot/pusht',revision=revision,license='MIT (dataset card)',files=files),indent=2),encoding='utf-8')
    print(f'PushT: pinned {revision}; metadata and state/action table only, no videos or model weights',flush=True)


if __name__=='__main__':
    # Keep the small PushT exercise available even if Zenodo range requests fail.
    pusht_sample()
    fan_samples()
