# Signals & Systems

공개 사이트: https://yejin-signals-systems.vercel.app/

나예진의 학습 기록을 읽는 정적 포트폴리오다. 별도 프레임워크·빌드·서버 API 없이 HTML/CSS/JavaScript로 제공한다.

- `index.html`: AML 실험과 로봇 학습으로 들어가는 입구
- `aml.html`: 문제 → 비교 설계 → 결과 → 배운 점, 4장
- `robotics.html`: 공부한 내용 → 각도와 자세 → 다음 공부, 3장

## 내용과 근거

AML은 기존 프로젝트 README, `docs/research_explained_and_qa.md`, 공개 Velog 글의 실험 결과와 선택 이유를 요약한다. 새로 모델을 학습하거나 개인별 기여를 추정하지 않았다. 결과 표는 정적 HTML로 모든 모델의 AP와 상위 864건 내 탐지 수를 동시에 표시한다. 연결망은 비교 설계 장에서만 사용하는 구조 설명용 그림이다.

로봇 내용은 `notes/2026-10-07-modern-robotics.md`의 실제 질문과 수정 과정을 바탕으로 한다. 데모는 이 사이트에서 만든 이상적 평면 2R 기구학이다. 링크 길이는 각각 1, 두 번째 관절각은 첫 링크에 대한 상대각이다. 하나의 각도 입력이 로봇 자세와 C-space 좌표를 함께 갱신한다. 관절 제한·충돌·동역학은 포함하지 않는다. 설명의 공식 근거와 상세 학습 기록은 페이지에서 연결한다.

## 화면과 접근성

1180×660 이상에서는 1280×720 설계 화면을 비례 확대·축소해 발표한다. 그보다 좁거나 낮은 창은 고정 크기 글자를 가진 문서형으로 전환한다. 데모와 그림은 한 번만 생성하며 두 모드가 같은 내용을 사용한다.

스크롤·목차·이전/다음·방향키로 이동한다. 장별 해시 링크도 지원한다. 시스템의 움직임 줄이기 설정과 화면 버튼을 지원한다. AML 본문과 표는 JavaScript가 없어도 읽을 수 있다.

## 실행과 검증

이 폴더에서 `python -m http.server 8000`을 실행한다.

- `node web/test.js` (저장소 루트): 공개 수치, 표의 막대 비율, 2R 길이·주기성, 내부 링크
- `node site-check.cjs` (저장소 루트): 설치된 Chrome/Playwright로 발표 비율, 모든 장의 잘림, 낮은 창의 글자 크기, 320/390px 화면, 각도와 좌표, 키보드·앵커·움직임 설정 확인
- `SITE_URL` 환경 변수를 지정하면 같은 검사를 공개 주소에서 실행한다.

Vercel 프로젝트는 `yejin-signals-systems`, 저장소는 `yeah-genie/PhysicalAI`다. Root Directory는 `web`, Framework는 Other, Build Command는 없음, Output Directory는 `.`이다. 연결된 저장소 루트에서 `vercel --prod`로 배포한다. 환경 파일과 `.vercel`은 커밋하지 않는다.
