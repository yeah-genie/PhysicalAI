# 웹디자인 검사 도구 선택 및 설치

확인일: 2026-10-09 (한국 시간)

## Microsoft Playwright MCP

- 출처: [Microsoft 공식 저장소](https://github.com/microsoft/playwright-mcp), [공식 npm 패키지](https://www.npmjs.com/package/@playwright/mcp)
- 설치 버전: `@playwright/mcp@0.0.83` — 자동 최신 버전 대신 고정했다.
- 선택 이유: 디자인 시안을 만드는 도구와 별개로, 완성한 웹페이지를 실제 브라우저에서 열고 화면 크기별 배치·스크롤·버튼·접근성 구조를 확인할 수 있다. 현재 기본 브라우저 연결이 실패하는 환경에서 독립된 검증 경로로 사용할 수 있다.
- 설치: 사용자 Codex 도구 디렉터리에 패키지와 잠금 파일을 저장했다. 웹사이트 배포 패키지에는 포함하지 않았다.
- 등록: 기존 Codex 설정을 유지한 채 공식 `codex mcp add`로 `playwright` 항목만 추가했다.
- 실행 설정: `--isolated --headless --browser chrome --no-webmcp`. 독립적인 메모리 프로필을 사용하며, 기존 로그인 브라우저·쿠키·사용자 프로필에 연결하지 않는다. 권한 확대나 브라우저 보안 해제 옵션은 추가하지 않았다.

검증 결과:

1. npm에서 Microsoft 저장소와 배포 무결성 정보를 확인했다.
2. 패키지를 실제 내려받고 `--help`, `--version` 실행을 확인했다.
3. 등록한 실행 파일과 MCP 파일 경로가 존재함을 확인했다.
4. MCP 표준 입출력 연결·초기화·도구 목록(25개) 요청에 성공했다.
5. MCP의 `browser_navigate`로 공개 AML 페이지를 열고 페이지 스냅샷을 받은 뒤 브라우저를 닫았다.

현재 대화의 도구 목록에 새 서버가 즉시 나타나는지는 별도이며, 새 대화 또는 앱의 MCP 재연결 후 도구로 표시될 수 있다. 이번 설치에서는 서버 자체의 실행과 브라우저 탐색까지 직접 확인했다.

디자인을 자동으로 예쁘게 만들어 주는 도구는 아니다. 참고 사이트 관찰 → 장면 설계 → 구현 → 실제 화면 확인 과정을 반복하는 데 사용한다.

## Frontend Design 스킬

- 출처: [Anthropic 공식 skills 저장소](https://github.com/anthropics/skills/tree/main/skills/frontend-design)
- 사용자 요청에 따라 공식 skill-installer로 `frontend-design`을 사용자 스킬 디렉터리에 설치했다. 스킬 본문과 LICENSE.txt를 함께 내려받았고 설치된 지침을 읽어 이번 수정에 적용했다.
- 적용: 주제 자체에서 시각 대상을 선택, 색·서체·배치 기준을 먼저 기록, 구현 뒤 캡처 검토. 사용자의 검정·청록 방향은 유지하면서 범용 카드 배열 대신 거래 관계를 중심으로 설계했다.

## 기존 도구와 페이지 라이브러리

- Figma 플러그인은 이미 설치되어 있어 중복 설치하지 않았다. 이번 작업은 기존 정적 사이트 수정이므로 새 디자인 파일을 만들지 않았다.
- Context7 MCP로 Three.js 공식 문서를 확인했다. 화면에 필요한 3D 기능만 사용한다.
- `web/vendor/three`: 공식 npm `three@0.186.1`에서 module/core 파일과 MIT 라이선스를 보관. 다운로드의 SHA-512를 npm 배포 메타데이터와 대조했다.
- `web/vendor/suit`: [SUIT 공식 저장소](https://github.com/sun-typeface/SUIT)의 Variable WOFF2와 OFL 라이선스를 보관. 한글 제목과 숫자에 같은 서체를 사용한다.
- 런타임 라이브러리와 글꼴은 사이트에서 직접 제공한다. 모바일·읽기 모드에서는 Three.js 파일을 요청하지 않는다.
