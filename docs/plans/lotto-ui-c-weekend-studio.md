# Plan: C안 Weekend Pick Studio

- 상태: Design selected — Pre-Review pending
- 변경 등급: Standard
- 기준 spec: `docs/specs/mobile-draw-stage-ui.md` (Approved)
- 확정 design: `docs/design/lotto-ui-c-weekend-studio.md`

## 범위와 안전 경계

- 생성 알고리즘, 데이터 파일, sound asset·저장, draw overlay 동작, 배포·CI는 변경하지 않는다.
- A/B는 기존 commit에 보존하고 로컬 비교 탭은 C안 확정 뒤 정리한다.
- C안은 `App.tsx`, scoped CSS와 C안 문서만 변경한다. 현재 별도 진행 중인 Harness 파일을 수정하지 않는다.

## Work Packages

- [x] WP-001: C안 desktop split·mobile single-column 구현
  - 목적: 브랜드 story와 번호 생성 작업을 전문적인 studio layout으로 재구성한다.
  - 예상 파일: `src/App.tsx`, `src/styles.css`
  - 연결 AC: AC-001, AC-004, AC-005, AC-006, AC-007
  - 검증: 390·768·1280px render, horizontal overflow, CTA·고정 번호판 폭 확인
  - 위험/rollback: scoped modifier와 C안 markup 변경만 되돌리면 B안 구조로 복구 가능
  - 상태: done — 820px 이하 한 열, 그 이상 split layout을 구현했다. 320·390·768·1280px에서 수평 overflow가 없었고 mobile control은 44px 이상을 유지했다.

- [x] WP-002: 사용자 계약·자동 검증
  - 목적: 모드·게임 수·고정 번호·결과·sound·source 계약이 유지되는지 확인한다.
  - 예상 파일: 변경 없음, 실패 시 관련 source/test 최소 수정
  - 연결 AC: AC-002, AC-003, AC-006, AC-008
  - 검증: lint, 두 TypeScript typecheck, Vitest, production build
  - 위험/rollback: 시각 변경 때문에 기존 assertion을 약화하지 않음
  - 상태: done(local) — lint·두 TypeScript typecheck·114개 Vitest·production build가 모두 exit 0이다. 같은 head CI와 reviewer evidence는 UNVERIFIED다.

- [x] WP-003: A/B/C 비교 render와 polish
  - 목적: A/B desktop, C desktop/mobile을 같은 route 기준으로 비교하고 visual defect를 수정한다.
  - 예상 파일: `src/styles.css`, 이 plan
  - 연결 AC: AC-001~AC-008
  - 검증: 실제 production preview screenshot과 기본/고정/결과 상태 점검
  - 위험/rollback: 실제 browser에서 확인하지 못한 keyboard·remote CI는 UNVERIFIED로 공개
  - 상태: done — A/B/C 1280×720, C 390×844 기본·고정 번호·결과 상태를 production preview로 확인했다. 모바일 중복 hero 고지를 제거하고 게임 수·CTA를 같은 행으로 조정했다.

## 검증 기록

- local: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` 모두 exit 0
- responsive: 320·390·768·1280 CSS px에서 `scrollWidth === clientWidth`
- interaction: 390px에서 행운수 고정 3개 선택, 45개 번호 44×44px, overlay 확인 뒤 결과 표시
- screenshots: Codex visualization artifact의 A/B/C web 및 C mobile 기본·고정·결과 PNG
- UNVERIFIED: 실제 keyboard Tab/Enter/Space 수동 점검, 같은 uncommitted head의 CI, Codex Reviewer·Grok Build·final gate
- 운영: commit·push·merge·deploy 실행 안 함

## 선택 기록

- 2026-07-15: 사용자가 A/B/C 비교 후 C안을 모바일·웹 최종 UI로 확정했다.
- 로컬 확인용 C안 web 1280px와 mobile 390×844px 화면을 별도 탭으로 유지한다.
