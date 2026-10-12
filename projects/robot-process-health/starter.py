"""Read a bounded real voraus-AD sample and plot two signals; no model training."""
import csv
import hashlib
import io
import json
from pathlib import Path

import numpy as np
import requests

HERE = Path(__file__).resolve().parent
URL = 'https://media.vorausrobotik.com/voraus-ad-dataset-100hz.parquet'
SOURCE_BYTES = 1115942833
SOURCE_ETAG = '"69d8ea42-4283efb1"'
COLUMNS = ['time', 'sample', 'anomaly', 'category', 'setting',
           'joint_position_1', 'motor_torque_1']


class RangeFile(io.RawIOBase):
    def __init__(self):
        self.pos = 0
        self.transferred = 0
        self.ranges = []

    def readable(self):
        return True

    def seekable(self):
        return True

    def tell(self):
        return self.pos

    def seek(self, offset, whence=0):
        if whence not in (0, 1, 2):
            raise ValueError('Invalid seek mode')
        target = offset if whence == 0 else self.pos + offset if whence == 1 else SOURCE_BYTES + offset
        if not 0 <= target <= SOURCE_BYTES:
            raise ValueError('Invalid source offset')
        self.pos = target
        return target

    def read(self, size=-1):
        size = SOURCE_BYTES - self.pos if size < 0 else min(size, SOURCE_BYTES - self.pos)
        if not size:
            return b''
        if size > 16_000_000 or self.transferred + size > 50_000_000:
            raise ValueError('Teaching download budget exceeded; no full-file fallback')
        start, end = self.pos, self.pos + size - 1
        headers = {'Range': f'bytes={start}-{end}', 'Accept-Encoding': 'identity', 'If-Match': SOURCE_ETAG}
        with requests.get(URL, headers=headers, stream=True, timeout=40) as response:
            if response.status_code != 206 or response.headers.get('Content-Range') != f'bytes {start}-{end}/{SOURCE_BYTES}':
                raise RuntimeError('Server refused exact range; no full-file fallback')
            if response.headers.get('ETag') != SOURCE_ETAG:
                raise RuntimeError('Source version changed; verify provenance before updating')
            content = response.raw.read(size + 1)
        if len(content) != size:
            raise RuntimeError('Truncated or oversized range')
        self.ranges.append(dict(start=start, end=end, sha256=hashlib.sha256(content).hexdigest()))
        self.transferred += size
        self.pos += size
        return content


def check_sample(frame):
    assert frame and list(frame[0]) == COLUMNS
    identifiers = sorted({row['sample'] for row in frame})
    assert len(identifiers) == 4 and {row['anomaly'] for row in frame} == {False, True}
    for identifier in identifiers:
        cycle = [row for row in frame if row['sample'] == identifier]
        assert len(cycle) > 2
        assert all(len({row[name] for row in cycle}) == 1 for name in ['anomaly', 'category', 'setting'])
        signals = np.array([[row[name] for name in ['time', 'joint_position_1', 'motor_torque_1']] for row in cycle])
        assert np.isfinite(signals).all() and (np.diff(signals[:, 0]) > 0).all()


def prepare_sample():
    data = HERE / 'data';data.mkdir(exist_ok=True)
    csv_path, manifest_path = data / 'sample.csv', data / 'provenance.json'
    if csv_path.exists() or manifest_path.exists():
        if not (csv_path.exists() and manifest_path.exists()):
            raise RuntimeError('Incomplete local sample; preserve and inspect it before retrying')
        info = json.loads(manifest_path.read_text(encoding='utf-8'))
        assert info['source'] == URL and info['etag'] == SOURCE_ETAG
        assert hashlib.sha256(csv_path.read_bytes()).hexdigest() == info['sampleSha256']
        with csv_path.open(encoding='utf-8', newline='') as handle:
            frame = list(csv.DictReader(handle))
        for row in frame:
            for name in ['sample', 'category', 'setting']: row[name] = int(row[name])
            for name in ['time', 'joint_position_1', 'motor_torque_1']: row[name] = float(row[name])
            assert row['anomaly'] in ['True', 'False']
            row['anomaly'] = row['anomaly'] == 'True'
        check_sample(frame)
        return frame, info
    import pyarrow.parquet as pq
    source = RangeFile()
    parquet = pq.ParquetFile(source, pre_buffer=False)
    assert parquet.metadata.num_rows == 2321690 and parquet.num_row_groups == 1
    cycles = {}
    for batch in parquet.iter_batches(batch_size=2048, columns=['sample', 'anomaly', 'category', 'setting'], use_threads=False):
        for row in batch.to_pylist():
            identifier = row['sample']
            attributes = (row['anomaly'], row['category'], row['setting'])
            if identifier not in cycles: cycles[identifier] = [attributes, 0]
            assert cycles[identifier][0] == attributes
            cycles[identifier][1] += 1
    assert len(cycles) == 2122 and sum(value[1] for value in cycles.values()) == 2321690
    assert sum(value[0][0] for value in cycles.values()) == 755
    # shortcut: first two cycles per label are teaching examples; use declared full splits for evaluation.
    selected = []
    for label in [False, True]:
        selected.extend([identifier for identifier in sorted(cycles) if cycles[identifier][0][0] == label][:2])
    frame = []
    for batch in parquet.iter_batches(batch_size=2048, columns=COLUMNS, use_threads=False):
        rows = batch.to_pylist()
        frame.extend(row for row in rows if row['sample'] in selected)
    assert len(frame) == sum(cycles[identifier][1] for identifier in selected)
    parquet.close()
    check_sample(frame)
    buffer = io.StringIO(newline='')
    writer = csv.DictWriter(buffer, fieldnames=COLUMNS, lineterminator='\n')
    writer.writeheader();writer.writerows(frame)
    content = buffer.getvalue().encode('utf-8')
    info = dict(source=URL, sourceBytes=SOURCE_BYTES, etag=SOURCE_ETAG,
                license='CC-BY-NC-SA-4.0', sourceRows=2321690, sourceCycles=2122,
                sourceNormalCycles=1367, sourceAnomalyCycles=755,
                selection='First two sample IDs per cycle label; teaching only, no benchmark split.',
                selectedCycles=selected, columns=COLUMNS, transferredBytes=source.transferred,
                ranges=source.ranges, sampleSha256=hashlib.sha256(content).hexdigest(),
                verification='Exact HTTP ranges, pinned ETag and local SHA256. No whole-file checksum verification.')
    csv_path.write_bytes(content)
    manifest_path.write_text(json.dumps(info, indent=2), encoding='utf-8')
    return frame, info


def main():
    frame, info = prepare_sample()
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    reports = HERE / 'reports';reports.mkdir(exist_ok=True)
    with (reports / 'first-10-rows.csv').open('w', encoding='utf-8', newline='') as handle:
        writer = csv.DictWriter(handle, fieldnames=COLUMNS);writer.writeheader();writer.writerows(frame[:10])
    summaries = []
    for identifier in sorted({row['sample'] for row in frame}):
        cycle = [row for row in frame if row['sample'] == identifier]
        dt = float(np.median(np.diff([row['time'] for row in cycle])))
        summaries.append(dict(sample=int(identifier), anomaly=bool(cycle[0]['anomaly']),
                              category=int(cycle[0]['category']), setting=int(cycle[0]['setting']),
                              rows=len(cycle), durationSeconds=float(cycle[-1]['time']-cycle[0]['time']),
                              medianIntervalSeconds=dt))
    fig, axes = plt.subplots(2, 1, figsize=(10, 6), sharex=True, constrained_layout=True)
    for label, color in [(False, '#007f8b'), (True, '#d46a1c')]:
        identifier = min(row['sample'] for row in frame if row['anomaly'] == label)
        cycle = [row for row in frame if row['sample'] == identifier]
        elapsed = np.array([row['time'] for row in cycle]) - cycle[0]['time']
        for ax, column in zip(axes, ['joint_position_1', 'motor_torque_1']):
            ax.plot(elapsed, [row[column] for row in cycle], color=color, label=f'{"Anomaly" if label else "Normal"} / cycle {identifier}', linewidth=1.4)
            ax.set_ylabel(column + '\n(source units)');ax.grid(alpha=0.2);ax.legend()
    axes[0].set_title('Real voraus-AD teaching sample: first cycle per label')
    axes[-1].set_xlabel('Elapsed time from cycle start (seconds)')
    fig.savefig(reports / 'sample-signals.png', dpi=140);plt.close(fig)
    result = dict(source=URL, license=info['license'], sourceCycles=info['sourceCycles'],
                  transferredBytes=info['transferredBytes'], selectedCycles=summaries,
                  note='Source units not converted. Cycle labels are not failure-onset labels. No model trained or benchmark evaluated.')
    (reports / 'data-check.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
    print(json.dumps(result, ensure_ascii=True))


if __name__ == '__main__':
    main()
