# Signals & Systems

나예진의 금융·AML 및 제조·로봇 포트폴리오. HTML/CSS/JavaScript 정적 사이트이며 추가 패키지와 빌드 과정이 없다.

공개 사이트: https://yejin-signals-systems.vercel.app/

- `index.html`: 프로젝트 발표 자료로 들어가는 공통 입구와 학습 링크
- `aml.html`: 연구 질문 → 문제 → 데이터 → 모델 → 결과 → 한계 → 다음 실험, 총 7장
- `robotics.html`: 현재 학습 → 2R 자세 데모 → C-space → 계획 → 학습 근거, 총 5장

데스크톱 발표는 1600×900 설계 화면을 창에 맞게 통째로 축소한다. 모바일 700px 이하에서는 세로로 읽는 문서로 전환한다. 스크롤, 목차, 이전·다음 버튼, 방향키·PageUp/Down·Home/End로 장을 이동할 수 있다. 시스템의 움직임 줄이기 설정과 화면의 별도 버튼을 지원한다.

AML 수치는 기존 AML README와 공개 학습 기록에 기록된 단일 실행 결과다. 864칸의 결과 그림은 한 칸이 선택된 거래 한 건인 집계 그림이며 실제 순위나 개별 예측을 표시하지 않는다. 연결망과 주변 관계 버튼은 설명용이다. 원시 CSV가 없어 실시간 추론·임계값 시뮬레이션은 제공하지 않는다.

로봇 데모는 이 사이트에서 새로 구현한 이상적 평면 2R 기구학이다. 두 링크의 길이는 1이며 두 번째 각도는 첫 번째 링크에 대한 상대각이다. 관절 제한·충돌·동역학·실물 제어는 구현하지 않았다. C-space 설명은 Modern Robotics 2.3.1 공식 자료를 참고했다. 이 데모를 과거에 완료했던 학습 실습으로 서술하지 않는다.

실행: 이 폴더에서 `python -m http.server 8000` 후 http://localhost:8000 접속.
검증: `node test.js`. 저장소 루트에서 `node site-check.cjs`로 실제 화면을 검사한다(로컬 Chrome과 설치된 Playwright 사용). `SITE_URL`을 지정하면 배포된 사이트도 같은 방식으로 검사한다.

Vercel: 저장소 `yeah-genie/PhysicalAI`, Root Directory `web`, Framework Preset `Other`, Build Command 없음, Output Directory `.`. 저장소 루트에서 연결된 프로젝트에 `vercel --prod`로 배포한다. `.vercel`과 환경 파일은 커밋하지 않는다.
