# Plan: 모바일 기본 웹 UI 재설계

확정 spec/design 이후 구현 작업을 추적하는 계획 문서다.
**진행 상태의 단일 기준은 이 파일의 체크박스다** — 채팅이 아니라 여기서 상태를 읽는다.

## 상태

- 상태: Active
- 변경 등급: Standard
- 작성일: 2026-07-15
- 작성자: Codex Main

## 기준 문서

- PROJECT.md: PROJECT.md
- spec: docs/specs/mobile-draw-stage-ui.md (Approved)
- design: docs/design/mobile-draw-stage-ui.md (확정)
- research/proposals: docs/design/mobile-draw-stage-ui-proposals.md

## 실행 전 확인

- 현재 브랜치: `codex/mobile-web-ui` (base `61d7a8e`)
- main 직접 작업 아님: 예
- 작업트리 상태: UI 소스·테스트·spec/design/plan·PROJECT.md의 의도된 변경이 있으며, 기존 미추적 `.agents/`, `.codex/`는 범위에서 제외한다.
- 사용자 승인: 2026-07-15 spec Approved 및 확정 설계 확인됨
- 로컬 검증 환경: bundled Node와 설치된 `node_modules`를 사용했다. PATH에 `npm`은 없으므로 package script wrapper 대신 동일 도구의 직접 실행 결과를 기록한다.
- CI 상태: 현재 세션에서 같은 head SHA의 원격 CI를 실행하지 않았다.
- 구현 blocker: 없음. 단, 실제 키보드 수동 점검과 Standard 외부 검토·CI는 아직 완료 조건에서 남아 있다.

## Work Packages

- [x] WP-001: 기본 웹 골격과 생성 흐름 재배치
  - 목적: 헤더·소개·최신 당첨정보·생성·결과가 일반 웹 흐름으로 보이게 하고, 사용자가 첫 화면에서 바로 번호를 뽑을 수 있게 한다.
  - 변경 파일: `src/App.tsx`, `src/components/GeneratorPanel.tsx`, 필요 시 `src/App.test.tsx`
  - 완료 조건: `site-header`와 `main`의 의미 있는 순서가 생기며, 모드·고정 번호·게임 수·CTA·결과가 기존 동작으로 연결된다. 정적 `LottoMachine`은 일반 화면에서 제거한다. (AC-002, AC-003, AC-004, AC-005, AC-006)
  - 선행/차단: 없음
  - 검증: `npm test -- src/App.test.tsx`가 기존 추첨·reduced-motion·×5·사운드 흐름을 통과한다.
  - 위험/rollback: 상단 JSX 이동으로 소리 토글의 첫 클릭 흐름이 달라질 수 있다. 해당 WP의 JSX 변경만 되돌리면 기존 구조로 복구된다.
  - 상태: done

- [x] WP-002: 모바일 우선 스타일과 넘침 제거
  - 목적: 320px·390px에서 헤더, 최신 당첨번호, 모드, 번호판, 결과, 통계가 가로 넘침·겹침·잘림 없이 사용되게 한다.
  - 변경 파일: `src/styles.css`, 필요 시 `src/components/WinningBar.tsx`, `src/components/NumberPad.tsx`, `src/components/Ticket.tsx`
  - 완료 조건: 절대 위치 상단을 일반 flex header로 바꾸고, 최신 공/결과 공은 줄바꿈하며, 번호판·통계 그리드는 좁은 화면에서 5열을 사용한다. 넓은 화면의 읽기 폭도 유지한다. (AC-001, AC-005, AC-006, AC-007)
  - 선행/차단: WP-001의 새 마크업 클래스가 확정되어야 한다.
  - 검증: 로컬 브라우저 320px·390px·768px·1280px에서 수평 스크롤 없음, CTA/모드/×1~×5/결과/정보가 모두 도달 가능함을 확인한다.
  - 위험/rollback: CSS 범위가 넓어 기존 결과 용지나 오버레이와 간섭할 수 있다. selector를 일반 화면 클래스에 한정하고, 해당 CSS 덩어리를 되돌릴 수 있게 유지한다.
  - 상태: done — 320·390·601·641·768·1280px에서 수평 넘침 없이 헤더·최신 번호·모드·번호판·결과·통계의 폭을 확인했다. 601px 경계의 기존 그리드 넘침 가능성은 모바일 breakpoint를 640px로 넓혀 해소했다.

- [ ] WP-003: 사용자 계약·접근성 회귀 검증 보강
  - 목적: UI 재배치 뒤에도 기존 생성 계약과 버튼 의미가 유지됨을 자동 테스트와 수동 키보드 점검으로 보장한다.
  - 변경 파일: `src/App.test.tsx`, 필요 시 관련 컴포넌트 테스트
  - 완료 조건: 오버레이 확인 전/후 결과, reduced-motion, ×5, 단골 모드, 소리 토글, 고정 번호 0~5개 제한 및 `aria-pressed`가 검증된다. CSS selector 의존이 바뀌면 안정적인 접근성 라벨 또는 유지된 클래스 계약으로 갱신한다. (AC-002, AC-003, AC-004, AC-006)
  - 선행/차단: WP-001, WP-002
  - 검증: `npm test`가 통과하고, Tab/Enter/Space로 소리·모드·횟수·고정 번호·전체 해제·CTA를 조작한다.
  - 위험/rollback: 레이아웃 검증을 jsdom에 과도하게 맡길 수 있다. 뷰포트 항목은 브라우저 확인으로 분리한다.
  - 상태: in_progress — 버튼의 `aria-pressed`/`disabled` 의미, group label, `:focus-visible` 및 관련 자동 테스트는 반영·통과했다. 다만 인앱 브라우저 제어 표면이 Tab/Enter/Space 이벤트를 앱에 전달하지 않아 실제 키보드 수동 조작 확인은 UNVERIFIED다.

- [ ] WP-004: 전체 검증·리뷰 준비·프로젝트 상태 갱신
  - 목적: 모든 완료 조건을 실제 명령과 브라우저로 확인하고 Standard 검토에 필요한 증거를 남긴다.
  - 변경 파일: `docs/plans/mobile-draw-stage-ui.md`, `PROJECT.md`, 필요 시 검증 기록 문서
  - 완료 조건: AC-001~AC-008, git diff/status, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, 실제 브라우저 확인 결과를 기록한다. 실행 불가 항목은 UNVERIFIED로 표시한다. 독립 리뷰와 CI는 head SHA 기준으로 별도 실행한다.
  - 선행/차단: WP-001~003
  - 검증: 위 명령 모두 exit 0, 또는 불가 사유가 명시됨. main 병합/공개 배포는 사용자 별도 승인 전 실행하지 않는다.
  - 위험/rollback: 검증 없이 UI를 완료로 오인할 수 있다. 명령별 결과와 미확인 사항을 분리해 기록한다.
  - 상태: in_progress — 로컬 lint·typecheck·test·build, 브라우저 폭별 생성/결과 흐름, diff whitespace 검사를 기록했다. 같은 SHA CI와 Standard 독립 리뷰는 아직 실행하지 않았다.

## 실패 루프

- 검증 실패: 재현 신호를 남기고 `debug` 절차로 원인을 하나씩 격리한다.
- 동일한 실패 signature가 3회 또는 전체 수정 루프가 5회가 되면 WP를 중단하고 실패 packet을 남긴다.
- spec 변경 필요: spec부터 갱신하고 사용자 재승인 후 필요하면 design/plan을 갱신한다.
- CI 실패: 원인 확인 후 별도 최소 수정으로 처리하며, 공개 배포는 자동 실행하지 않는다.

## 롤백 계획

- 되돌리는 방법: UI 소스·테스트·문서 변경만 담은 커밋을 `git revert`한다.
- 데이터 백업·복구: 데이터·저장소 포맷을 바꾸지 않으므로 별도 migration/복구는 없다.
- 롤백 후 확인: 기존 `lint`, `typecheck`, `test`, `build`와 배포된 기본 화면을 확인한다.

## 최종 검증

- [x] AC-001~AC-005, AC-007~AC-008의 로컬 증거 기록
- [ ] AC-006 전체 충족 — 의미론·자동 테스트는 통과했으나 실제 Tab/Enter/Space 수동 조작은 UNVERIFIED
- [x] 테스트 (정상·오류·경계값) — 14 files / 113 tests
- [x] lint/typecheck/build — 직접 실행한 eslint, tsc, vite build가 모두 exit 0
- [ ] Standard 독립 검토 준비 및 실행 — 고정 head와 같은 SHA CI, 외부 전송 승인이 필요
- [ ] CI 통과 — 원격 CI 미실행
- [ ] 사람 최종 확인 → main 병합

## 변경 기록

- 2026-07-15: Approved spec과 확정 design에 따라 구현 Work Package를 만들고 WP-001을 시작했다.
- 2026-07-15: WP-001 완료 — `App`의 header/main 구조와 생성 패널 책임을 재배치했고, 정적 추첨기를 일반 화면에서 제거했다. lint·typecheck·113개 테스트·build 및 데스크톱 브라우저 생성 흐름을 확인했다.
- 2026-07-15: WP-002 완료 — 320·390·601·641·768·1280px에서 `documentWidth <= viewport`를 확인했다. 320px에서는 최신 번호 공과 결과 공이 줄바꿈하고, 45개 번호판은 5열·38px 공으로 유지된다. 601px 경계도 모바일 breakpoint를 640px까지 확장해 재확인했다.
- 2026-07-15: WP-003 진행 — `aria-pressed`, `disabled`, 그룹 라벨과 `:focus-visible`을 보강하고 관련 테스트를 추가했다. 인앱 브라우저의 키보드 이벤트 주입 한계로 실제 Tab/Enter/Space 수동 조작은 UNVERIFIED로 남겼다.
- 2026-07-15: WP-004 진행 — 직접 실행한 eslint, 두 tsconfig의 tsc, vitest, vite build와 `git diff --check`는 exit 0이다. skip/only 추가는 확인되지 않았다. 원격 CI와 Codex/Grok Standard 독립 리뷰는 같은 고정 head 및 외부 전송 승인 전까지 UNVERIFIED다.
