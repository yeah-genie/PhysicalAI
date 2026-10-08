# Signals & Systems

나예진의 금융·AML 및 제조·로봇 포트폴리오 첫 버전. HTML/CSS/JavaScript 정적 사이트이며 프레임워크와 빌드 단계가 없다.

공개 사이트: https://yejin-signals-systems.vercel.app/

- `index.html`: 공통 포트폴리오, 설명용 연결망, 프로젝트·학습 기록 링크
- `aml.html`: 문서에 기록된 단일 실행 결과와 모델 선택 인터랙션
- `robotics.html`: 현재 학습 단계, 향후 로드맵

AML 수치는 원본 연구를 다시 실행한 결과가 아니라 기존 AML README와 공개 학습 기록의 값이다. 연결망은 설명용이며 실제 거래 데이터나 모델 설명이 아니다. 원시 CSV가 없어 임계값 슬라이더나 추론 API는 만들지 않았다.

실행: 이 폴더에서 `python -m http.server 8000` 후 http://localhost:8000 접속.
검증: `node test.js`.
Vercel: 저장소 `yeah-genie/PhysicalAI`, Root Directory `web`, Framework Preset `Other`, Build Command 없음, Output Directory `.`. 로컬 배포 설정은 `.vercel`에 생성하며 커밋하지 않는다.

현재 목표는 한 허브 아래 각 도메인의 독립 페이지를 유지하는 것이다. 프로젝트가 커지면 상세 페이지에서 별도 데모 배포를 연결할 수 있다.
