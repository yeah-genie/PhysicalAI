# LeRobot 입문: PushT 데이터 한 에피소드 읽기

**로봇을 사기 전에, 로봇 학습 데이터가 무엇을 기록하는지 이해한다.** PushT는 원형 에이전트로 T자 블록을 목표 영역으로 미는 2D 환경이다. 이번 실습은 시연 데이터를 읽는 단계이며 로봇팔 제어·정책 학습·시뮬레이터 실행 결과가 아니다.

## 지금 필요한 개념

| 이름 | 의미 | 이번 데이터 |
|---|---|---|
| observation | 현재 관측한 정보 | 이미지와 에이전트 위치; 표에서는 위치만 읽음 |
| action | 다음에 하려는 행동 | 에이전트가 이동할 목표 x,y 좌표 |
| policy | 관측을 보고 행동을 내는 함수/모델 | 이번에는 아직 실행하지 않음 |
| episode | 한 번의 작업 시도에 속한 연속 기록 | 독립된 206개 시연 에피소드 |
| reward / success | 환경이 제공한 진행·성공 정보 | 데이터에 기록된 값; 직접 평가한 정책 성능과 구분 |

첫 프레임: observation.state=(222,97), action=(233,71). 지금 있는 위치와 이동 목표가 다르다. 이 action을 관절각·힘·상대 이동량으로 해석하지 않는다. 표의 관측 위치 2개만으로는 T자 블록의 전체 상태를 알 수 없으며 이미지에 추가 정보가 있다.

## 실행

```powershell
python scripts/prepare-starter-data.py
python exercises/lerobot-pusht/inspect_episode.py
```

전체 영상·모델을 받지 않고 실제 `meta/info.json`과 상태·행동 Parquet 한 파일만 내려받는다. 다운로드 시 데이터 revision과 SHA-256을 `data/provenance.json`에 기록한다. 스크립트가 실제 v3.0 메타데이터를 검사한다. 웹 데이터 카드의 오래된 v2.0 예제와 섞지 않는다.

검증한 자료: 25,650프레임·206에피소드, 10fps. 0번 에피소드는 161프레임이며 `reports/episode-000-preview.csv`, `reports/episode-000.png`, `reports/dataset-check.json`을 만든다. 모든 에피소드의 frame_index, 시간 간격, action의 유한값을 검사했다. 이 검사는 Codex가 실행한 준비 작업이고 사용자의 실습 완료를 뜻하지 않는다.

**중간 프레임에서 next.success=False라고 해서 실패라고 표시하면 안 된다.** 아직 성공 조건을 달성하지 않았을 수 있다. 마지막 기록의 False도 종료 원인·환경 성공 기준을 확인한 뒤 해석해야 한다. 전문가 시연과 정책 rollout을 섞어 실패 탐지기를 평가하지 않는다. reward/success는 향후 성공 예측 모델의 입력에 무심코 넣으면 정답 누수가 될 수 있다.

## 첫 확인 문제

1. 첫 프레임의 두 좌표쌍은 각각 무엇을 뜻할까?
2. 첫 에피소드와 두 번째 에피소드의 행을 섞어 연속 궤적으로 그리면 어떤 문제가 생길까?
3. 중간 프레임의 success=False를 작업 실패 라벨로 쓰면 왜 틀릴까?

## 로봇 지식이 없을 때의 프로젝트 순서

1. 현재 실습: 데이터와 observation/action/episode 구분.
2. 별도 환경: 공식 LeRobot 설치 안내를 따라 Python·PyTorch·영상 디코딩 환경 점검. 현재 기존 Python 3.10에 LeRobot을 설치하거나 변경하지 않았다. 최신 공식 문서의 Python 3.12 이상 요건을 확인했다.
3. PushT 기본 환경 조작, 이후 사전학습 정책으로 소수 에피소드를 실행해 연결 확인. 몇 번의 성공만으로 성능을 확정하지 않는다.
4. 환경 초기값 seed와 정책 seed를 기록하고 평가 에피소드를 늘려 성공률·변동·실패 유형 분석.
5. BC/ACT/Diffusion 중 적합한 정책 하나를 이해하고 재학습. ACT가 모든 환경의 필수 정답이라고 가정하지 않는다.
6. 직접 수집한 평가 rollout에서 작업 실패 감지와 조기 예측을 별도 실험으로 확장. 단순 성공 판정과 미래 실패 예측을 구분한다.
7. 이후 관심과 장비 접근성이 맞으면 SO-101 등 실제 로봇으로 이동하고 캘리브레이션·관절 제한·저속 동작을 먼저 익힌다. 지금 하드웨어 구매는 필요 없다.

Modern Robotics의 좌표·관절·기구학 기본기는 계속 공부한다. 로봇팔 기구학 전체를 끝내야 PushT 데이터를 볼 수 있는 것은 아니지만, 실제 로봇으로 옮길 때는 별도로 배워야 한다.

## 공식 근거와 권리

- [LeRobot](https://huggingface.co/docs/lerobot/index) / [설치](https://huggingface.co/docs/lerobot/installation)
- [실제 데이터](https://huggingface.co/datasets/lerobot/pusht) / [v3.0 메타데이터](https://huggingface.co/datasets/lerobot/pusht/blob/main/meta/info.json)
- [PushT 환경: 행동과 성공 조건](https://github.com/huggingface/gym-pusht)

원본 데이터 카드의 라이선스 표시는 MIT이다. 상태 표의 소량 CSV와 그림은 이 데이터에서 만든 파생 자료이며 출처와 revision을 함께 기록한다. 원본 영상과 상태 표는 Git에서 제외한다.
