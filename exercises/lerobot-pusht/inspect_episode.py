"""First exercise: inspect real LeRobot-format demonstrations without training a policy."""
import json
import hashlib
from pathlib import Path

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

HERE=Path(__file__).resolve().parent


def main():
    info=json.loads((HERE/'data/info.json').read_text())
    provenance=json.loads((HERE/'data/provenance.json').read_text())
    for item in provenance['files']:
        assert hashlib.sha256((HERE/'data'/Path(item['path']).name).read_bytes()).hexdigest()==item['sha256']
    table=pd.read_parquet(HERE/'data/file-000.parquet')
    assert info['codebase_version']=='v3.0'
    assert len(table)==info['total_frames'] and table.episode_index.nunique()==info['total_episodes']
    for _,episode in table.groupby('episode_index'):
        assert np.array_equal(episode.frame_index.to_numpy(),np.arange(len(episode)))
        assert np.all(np.diff(episode.timestamp.to_numpy())>0)
        assert np.allclose(np.diff(episode.timestamp.to_numpy()),1/info['fps'],atol=1e-4)
        assert np.isfinite(np.stack(episode.action)).all()
    episode=table[table.episode_index==0]
    state=np.stack(episode['observation.state'])
    action=np.stack(episode.action)
    assert state.shape==action.shape==(len(episode),2)
    assert np.all((action>=0)&(action<=512))
    output=HERE/'reports';output.mkdir(exist_ok=True)
    summary=dict(dataset='lerobot/pusht',revision=provenance['revision'],format=info['codebase_version'],
                 frames=len(table),episodes=int(table.episode_index.nunique()),fps=info['fps'],
                 selectedEpisode=0,selectedFrames=len(episode),
                 firstObservation=state[0].tolist(),firstAction=action[0].tolist(),
                 finalRecordedSuccess=bool(episode['next.success'].iloc[-1]),
                 note='Recorded demonstration, not a newly trained/evaluated policy. next.success=False on an intermediate frame is not a failure label.',
                 checks=['all episode frame indices contiguous','timestamps match fps','finite actions','selected episode has 2D state/action'])
    (output/'dataset-check.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
    preview=pd.DataFrame(dict(time=episode.timestamp.to_numpy(),state_x=state[:,0],state_y=state[:,1],
                              action_x=action[:,0],action_y=action[:,1],reward=episode['next.reward'].to_numpy()))
    preview.head(10).to_csv(output/'episode-000-preview.csv',index=False)
    fig,axes=plt.subplots(1,2,figsize=(10,4),constrained_layout=True)
    axes[0].plot(state[:,0],state[:,1],label='Observed agent position')
    axes[0].plot(action[:,0],action[:,1],alpha=.55,label='Target position (action)')
    axes[0].scatter(*state[0],label='Start',color='black');axes[0].set(xlim=(0,512),ylim=(512,0),xlabel='x (environment coordinates)',ylabel='y',title='Episode 0: observation vs action');axes[0].set_aspect('equal');axes[0].legend(fontsize=8)
    axes[1].plot(episode.timestamp,episode['next.reward']);axes[1].set(xlabel='Episode time (seconds)',ylabel='Recorded reward',title='Demonstration reward, not model performance',ylim=(0,1.05));axes[1].grid(alpha=.2)
    fig.savefig(output/'episode-000.png',dpi=140);plt.close(fig)
    print(json.dumps(summary,ensure_ascii=False,indent=2))


if __name__=='__main__':
    main()
