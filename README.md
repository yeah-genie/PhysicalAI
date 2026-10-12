# Physical AI · 금융과 제조업 이상탐지

학습과 재현 가능한 실험을 쌓는 개인 저장소. 현재 목표는 금융·제조업의 데이터/ML 분야 신입 취업 준비다. 장기 계획은 [ROADMAP.md](ROADMAP.md), 현재 학기 계획은 [CAREER-PLAN.md](CAREER-PLAN.md)를 기준으로 한다.

| 트랙 | 현재 자료 | 실제 완료한 작업 | 다음 작업 |
|---|---|---|---|
| 금융·AML | [연구 발표](https://yejin-signals-systems.vercel.app/aml.html) | 기존 연구 원고의 결과 정리, 실제 합성 거래 집계와 시각화 | 원본 학습 코드·모델 점수 확보, 실행 재현과 SQL 분석 |
| 제조 설비 이상탐지 | [팬 소리 프로젝트](projects/machine-health/README.md) | 공식 데이터의 소량 음원 확보, 출처·분할·신호 특징 확인 | 전체 데이터 공간 확보 후 정상 학습/검증 분리와 기준 모델 |
| LeRobot 입문 | [PushT 데이터 실습](exercises/lerobot-pusht/README.md) | 실제 상태·행동 표의 에피소드/시간 검사와 한 에피소드 시각화 | 사용자 데이터 이해 확인, 별도 환경에서 정책 실행 |
| 로봇 기본기 | [기존 학습 글](notes/2026-10-07-modern-robotics.md) | 대화에서 배운 자유도·C-space 정리 | Modern Robotics 공부 계속 |

사용자가 직접 이해하거나 수행한 공부와, Codex가 준비·검증한 코드를 구분한다. 모델을 새로 실행하지 않았으면 연구 원고의 성능을 재현했다고 쓰지 않는다. 입문 실습 준비를 사용자의 학습 완료로 처리하지 않는다.

원본 음원·상태 표·모델 가중치는 Git에 올리지 않는다. 웹사이트는 `web/`에 있으며, 기존 로봇/AML 발표는 이번 입문 실습 준비에서 변경하지 않았다.

현재 Codex 작업은 [worklogs/](worklogs/)에 실제 작업 날짜별로 보관한다. 기존 ChatGPT 학습 로그·큰 단원 Velog 발행과 구분하며, 사용자 결정과 Codex의 실행 결과를 따로 적는다. 팬 프로젝트의 다음 연구 방향은 [문헌 분석](projects/machine-health/LITERATURE.md)을 참고한다.
