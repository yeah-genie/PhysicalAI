"""Inspect a tiny real audio sample; do not report benchmark/model scores."""
import csv
import hashlib
import json
from pathlib import Path

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from scipy.io import wavfile
from scipy.signal import spectrogram

HERE=Path(__file__).resolve().parent


def load_wav(path):
    rate,audio=wavfile.read(path)
    assert audio.ndim==1 and rate>0 and len(audio)>0
    if np.issubdtype(audio.dtype,np.integer):
        audio=audio.astype(np.float64)/max(abs(np.iinfo(audio.dtype).min),np.iinfo(audio.dtype).max)
    else:
        audio=audio.astype(np.float64)
    assert np.isfinite(audio).all()
    return rate,audio


def main():
    source=json.loads((HERE/'data/provenance.json').read_text())
    attribute=source['attributeTable']
    assert hashlib.sha256((HERE/'data'/attribute['file']).read_bytes()).hexdigest()==attribute['sha256']
    records=[];spectra=[]
    for item in source['samples']:
        assert hashlib.sha256((HERE/'data'/item['file']).read_bytes()).hexdigest()==item['sha256']
        rate,audio=load_wav(HERE/'data'/item['file'])
        rms=float(np.sqrt(np.mean(audio**2)))
        centered=audio-audio.mean()
        spectrum=np.abs(np.fft.rfft(centered*np.hanning(len(centered))))**2
        frequencies=np.fft.rfftfreq(len(centered),1/rate)
        records.append(dict(file=item['file'],split=item['split'],domain=item['domain'],label=item['label'],
                            sample_rate=rate,seconds=len(audio)/rate,rms=rms,
                            peak=float(np.max(np.abs(audio))),dominant_hz=float(frequencies[np.argmax(spectrum)])))
        if item['split']=='test' and not any(x[0]==(item['domain'],item['label']) for x in spectra):
            f,t,p=spectrogram(audio,rate,nperseg=512,noverlap=256)
            spectra.append(((item['domain'],item['label']),f,t,10*np.log10(np.maximum(p,1e-12))))
    assert len(records)==12 and len(spectra)==4
    output=HERE/'reports';output.mkdir(exist_ok=True)
    with (output/'sample-features.csv').open('w',newline='',encoding='utf-8') as handle:
        writer=csv.DictWriter(handle,fieldnames=records[0].keys());writer.writeheader();writer.writerows(records)
    fig,axes=plt.subplots(2,2,figsize=(10,6),constrained_layout=True)
    lo=min(x[3].min() for x in spectra);hi=max(x[3].max() for x in spectra)
    for ax,(key,f,t,p) in zip(axes.flat,spectra):
        image=ax.pcolormesh(t,f,p,vmin=lo,vmax=hi,cmap='magma',shading='auto')
        ax.set(title=f'{key[0]} / {"anomaly" if key[1] else "normal"} (dataset label)',xlabel='Time (seconds)',ylabel='Frequency (Hz)')
    fig.colorbar(image,ax=axes.ravel().tolist(),label='Power spectral density (dB, same scale)')
    fig.savefig(output/'sample-spectrograms.png',dpi=140);plt.close(fig)
    result=dict(source='https://zenodo.org/records/15097779',license='CC-BY-NC-SA-4.0',
                selectedClips=len(records),officialGroupCounts=source['fullCounts'],
                note='First two filenames per group; teaching sample only. No model trained, no benchmark evaluation, no time-to-failure inference.',
                checks=['archive entry CRC verified during download','all WAVs finite mono signals','four domain/label combinations visualized using the same color scale'])
    (output/'data-check.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False,indent=2))


if __name__=='__main__':
    main()
