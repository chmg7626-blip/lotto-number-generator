# Plan: C안 Weekend Pick Studio

- 상태: Active — mobile responsive corrective polish
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

- [ ] WP-004: 실기기 제보 기반 모바일 폭·정렬 보정
  - 목적: 320~640px에서 section 배경은 화면 폭을 채우고 실제 콘텐츠는 공통 16px 기준선에 맞춘다. 번호판은 가용 폭을 고르게 사용하고, 게임 수 5개는 한 줄·CTA는 다음 줄 전체 폭으로 배치하며, 1등 당첨금은 단위가 분리되지 않게 표시한다.
  - 예상 파일: `src/styles.css`, `docs/plans/lotto-ui-c-weekend-studio.md`, `PROJECT.md`
  - 연결 AC: AC-001, AC-005, AC-006, AC-007, AC-008
  - 선행/차단: WP-001~003, 사용자 실기기 스크린샷 3장. 구현 blocker 없음.
  - 검증: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check`; 320·360·390·412·640px의 고정 번호판·게임 수·당첨금·section 기준선 render 확인
  - 위험/rollback: full-bleed 변경이 통계 section에 수평 overflow를 만들거나 긴 미래 당첨금이 잘릴 수 있다. C안 mobile media query 변경만 되돌리고 기존 desktop 규칙은 유지한다.
- 상태: in_progress — mobile scoped CSS와 상태 문서를 수정했고 lint·typecheck·119개 테스트·production build·diff check가 통과했다. production preview에서 320·360·390·412·640px의 실제 render와 고정 번호판·게임 수 제어를 확인했고 수평 overflow는 없었다. 실제 키보드, 같은 head CI, 독립 리뷰와 final gate는 아직 남아 있다.

## 검증 기록

- local: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` 모두 exit 0
- responsive: 320·390·768·1280 CSS px에서 `scrollWidth === clientWidth`
- interaction: 390px에서 행운수 고정 3개 선택, 45개 번호 44×44px, overlay 확인 뒤 결과 표시
- screenshots: Codex visualization artifact의 A/B/C web 및 C mobile 기본·고정·결과 PNG
- WP-004 local: bundled Node로 ESLint, 두 TypeScript typecheck, 15 files / 119 Vitest, Vite production build, `git diff --check` 모두 exit 0
- WP-004 static responsive: 320·360·390·412·640px에서 번호판 track 57.6~121.6px, 게임 수 track 52.4~116.4px로 최소 44px 계약 충족
- WP-004 actual browser: Vite production preview에서 320·360·390·412·640px 모두 `scrollWidth === clientWidth`; hero는 화면 폭, generator 콘텐츠는 좌우 16px 기준선을 유지했다. 고정 번호판은 45개·최소 44×44px, 게임 수는 5개 한 줄·최소 44px, CTA는 다음 줄 전체 폭으로 확인했다.
- WP-004 interaction: 320·390px에서 행운수 5개 선택(6번째 비활성) → ×5 → overlay 확인 → 5게임(각 6개 공) 결과 표시를 실제로 확인했다. 390px 결과 용지 폭은 343px / client 375px, 320px 결과 용지 폭은 273px / client 305px이었다.
- WP-004 browser console: error·warn 0건
- UNVERIFIED: 실제 keyboard Tab/Enter/Space 수동 점검, 같은 head SHA의 CI, Codex Reviewer·Grok Build·final gate. 현재 CI에는 reviewer gate가 요구하는 독립 evidence 산출이 없으므로, CI/harness 범위 추가 승인 없이는 독립 리뷰를 실행할 수 없다.
- 운영: commit·push·merge·deploy 실행 안 함

## 선택 기록

- 2026-07-15: 사용자가 A/B/C 비교 후 C안을 모바일·웹 최종 UI로 확정했다.
- 로컬 확인용 C안 web 1280px와 mobile 390×844px 화면을 별도 탭으로 유지한다.
- 2026-07-16: 실기기 제보에서 모바일 좌우 여백·번호판 간격·게임 수 3+2 줄바꿈·1등 금액 단위 줄바꿈이 확인되어 WP-004를 시작했다.
- 2026-07-16: full-bleed section·공통 16px 기준선·가변 5열 번호판/게임 수·full-width CTA·당첨금 한 줄 규칙을 반영하고 로컬 자동 검증을 통과했다. 새 렌더 증거 전에는 WP-004를 완료 처리하지 않는다.
