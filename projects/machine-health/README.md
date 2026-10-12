# 팬 소리로 시작하는 설비 이상탐지

2026-10-13 이후 제조업 대표 프로젝트는 [로봇 공정 이상탐지](../robot-process-health/README.md)로 시작한다. 이 폴더는 소리·신호 처리 입문 자료로 보존한다.

제조업을 처음 접한다면 [데이터·도메인 입문 설명](DATA-GUIDE.md)부터 읽는다.

관련 논문과 차별화할 실험은 [문헌 분석](LITERATURE.md)에 정리했다. 초기 질문은 같은 모델에서 정상 자료 수·환경 변화가 고정 임곗값의 오탐과 경보 안정성에 미치는 영향이다.

장기 질문: 운전 환경이나 소음이 달라져도 정상 설비에 과도한 경보를 내지 않고 이상을 찾을 수 있는가?

첫 단계는 신호와 데이터 분할을 이해하는 것이다. [DCASE 2025 Task 2](https://dcase.community/challenge2025/task-first-shot-unsupervised-anomalous-sound-detection-for-machine-condition-monitoring)의 fan 데이터를 사용한다. 원본은 [Zenodo 15097779](https://zenodo.org/records/15097779), CC BY-NC-SA 4.0이다. 공식 정상 학습 소리는 source 990개, target 10개이며 테스트는 두 환경 각각 정상 50개·이상 50개다.

## 실행

저장소 루트에서 기존 Python 환경의 numpy/scipy/matplotlib/pandas/pyarrow/requests를 사용한다. 검증 환경의 버전은 `scripts/starter-requirements.txt`에 기록했다.

```powershell
python scripts/prepare-starter-data.py
python projects/machine-health/inspect_audio.py
```

첫 명령은 PushT 상태 표와 팬의 여섯 split/domain/label 그룹에서 파일명 순 앞 2개씩, 총 12개만 가져온다. 팬 ZIP은 HTTP 범위 요청으로 필요한 압축 항목만 읽으며 서버가 지원하지 않으면 전체 다운로드 대신 오류를 낸다. 선택 음원은 항목 CRC와 SHA-256으로 확인한다. 전체 ZIP의 MD5는 원격 레코드 값만 보관하고 검증했다고 주장하지 않는다.

두 번째 명령은 신호 검사와 RMS·peak·주요 주파수 CSV, source/target의 정상/이상 네 스펙트로그램을 만든다. 색상 축은 동일하다. 파일명·라벨은 해석용 메타데이터이며 향후 모델 입력에서 제외해야 한다.

## 첫 공부

1. `data/`에서 source 테스트의 정상/이상 음원을 각각 하나 들어본다.
2. `reports/sample-spectrograms.png`의 시간 축·주파수 축·밝기가 무엇을 뜻하는지 설명한다.
3. `reports/sample-features.csv`에서 두 음원의 RMS를 비교한다. 음량 차이가 곧 고장 원인이라는 결론은 내리지 않는다.
4. source와 target 사이의 차이를 찾아보고 실제 운전·소음 속성을 원본 메타데이터에서 확인할 다음 질문을 적는다.

## 다음 기준 실험

전체 데이터를 저장할 공간 확보 → 공식 train의 정상 데이터 안에서 fit/calibration 분리 → 신호 특징 + Isolation Forest 기준 모델 → 정상 검증 점수로 임곗값 고정 → source/target 테스트 AUC·낮은 오탐 구간 성능·오탐률·탐지율·경보 수 기록 → 공식 Autoencoder 비교.

테스트는 라벨 비율이 균형인 공개 벤치마크다. 그 precision을 실제 공장의 precision이나 경보/시간으로 옮기지 않는다. 같은 파일에서 만든 여러 시간 창은 같은 분할에 넣는다. 이 음원 데이터만으로 고장까지 남은 수명·조기 경보 시간을 주장하지 않는다.

현재 12개는 표본 추출 실습이다. 대표 표본이 아니며 모델 학습·공식 점수 평가를 수행하지 않았다. 전체 파일을 합성하거나 모델 성능을 만들어 쓰지 않는다.

## 데이터 권리

Hitachi/NTT 및 DCASE 데이터 작성자에게 출처를 명시한다. 로컬 음원과 파생 스펙트로그램·특징 표는 원본의 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) 조건을 따른다. 학습 포트폴리오 용도이며 상업적 제품 적용은 별도 권리 검토가 필요하다. 원본 음원은 Git에 올리지 않는다.
