# Plan: B안 티켓 우선 UI 비교 후보

- 상태: Active
- 변경 등급: Standard
- 기준 spec: `docs/specs/mobile-draw-stage-ui.md` (Approved)
- 확정 design: `docs/design/lotto-ui-b-ticket-first.md`
- 비교 대상(A안): `codex/mobile-web-ui` / `951d629`
- 작업 브랜치: `codex/lotto-ui-b`

## 범위와 안전 경계

- B안은 사용자가 A안과 비교해 선택할 **가역적인 UI 후보**다.
- 생성 알고리즘, 데이터 파일, 사운드 자산·저장, 오버레이 동작, 배포/CI 설정은 변경하지 않는다.
- A안은 별도 브랜치에 보존한다. B안은 선택 전에는 main에 병합·공개 배포·push하지 않는다.

## Work Packages

- [ ] WP-001: B안의 티켓 우선 정보 구조와 스타일 구현
  - 목적: 모바일 단일 열·컴팩트한 첫 화면, 밝은 생성 데스크, 명확한 CTA를 구현한다.
  - 예상 파일: `src/App.tsx`, `src/components/NumberPad.tsx`, `src/styles.css`
  - 연결 AC: AC-001, AC-004, AC-005, AC-006, AC-007
  - 검증: 320·390·768·1280px 렌더에서 overflow·위계·제어 폭 확인
  - 위험/rollback: CSS override가 결과/정보 흐름을 손상할 수 있다. B안 브랜치의 UI 변경만 되돌리면 A안으로 복귀한다.
  - 상태: done — root modifier의 scoped CSS로 밝은 생성 데스크를 구현했다. 320·390·768·1280px 실제 렌더에서 수평 넘침 없이 기본/고정 번호 화면을 확인했다.

- [ ] WP-002: 사용자 계약 및 접근성 회귀 확인
  - 목적: 모드·게임 수·고정 번호·결과 확정·소리 제어의 DOM/ARIA 계약을 B안에서도 유지하고, 추첨 dialog의 Tab 순환을 보강한다.
  - 예상 파일: `src/components/DrawOverlay.tsx`, `src/App.test.tsx`, `src/components/DrawOverlay.test.tsx`
  - 연결 AC: AC-002, AC-003, AC-006
  - 검증: 기존 Vitest와 실제 기본/고정 번호/결과 flow 렌더
  - 위험/rollback: 시각 변경을 이유로 기존 테스트를 약화하지 않는다.
  - 상태: in_progress — 고정 번호판 group label, 320px 44px 탭 영역, dialog Tab 순환과 관련 자동 테스트를 추가했다. 실제 Tab/Enter/Space 수동 조작은 현재 브라우저 제어 한계로 UNVERIFIED다.

- [ ] WP-003: 비교 렌더와 로컬 검증 기록
  - 목적: A/B를 같은 route·viewport 기준으로 비교하고 B안의 기술 검증 상태를 기록한다.
  - 예상 파일: 이 plan 및 필요 시 temp 검증 기록
  - 연결 AC: AC-001~AC-008
  - 검증: lint, typecheck, test, build, diff/status, 320·390·768·1280px 렌더
  - 위험/rollback: 원격 CI·독립 리뷰·실키보드 증거가 없으면 PASS로 표현하지 않는다.
  - 상태: in_progress — lint·두 TypeScript typecheck·114개 Vitest·별도 임시 outDir의 production build를 통과했고, A/B production preview를 각각 유지했다. 같은 head의 원격 CI와 Standard 독립 리뷰는 아직 실행하지 않았다.

## 변경 기록

- 2026-07-15: A안 보존 브랜치 `codex/mobile-web-ui`에서 B안 브랜치 `codex/lotto-ui-b`를 만들었다. A안 production preview는 `4174`, B안 production preview는 `4176` 포트에서 독립적으로 확인한다.
- 2026-07-15: B안은 `app-content--desk` modifier 아래에만 밝은 생성 데스크 스타일을 추가했다. 생성 도메인·사운드·데이터·배포 설정은 변경하지 않았다.
- 2026-07-15: 모바일 고정 번호 공은 38px 외형을 유지하면서 44px 버튼 영역으로 확대했고, 320px에서 45개 번호와 가로 넘침 없음이 확인됐다. 추첨 dialog에는 Tab/Shift+Tab 순환을 추가하고 단위 테스트로 확인했다.
