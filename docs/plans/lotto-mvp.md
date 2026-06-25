# Plan: 로또번호생성기 1차 MVP

확정 spec/design 이후 구현 작업을 추적하는 계획 문서다.
**진행 상태의 단일 기준은 이 파일의 체크박스다** — 채팅이 아니라 여기서 상태를 읽는다.
각 작업은 독립적으로 완료·검증할 수 있는 Work Package(WP)로 쪼갠다.

## 상태

- 상태: Active
- 변경 등급: Standard
- 작성일: 2026-06-24
- 작성자: chmg7626-blip

## 기준 문서

- PROJECT.md: PROJECT.md
- spec: docs/specs/lotto-mvp.md (Approved 2026-06-24)
- design: docs/design/lotto-mvp.md (확정)
- research/proposals: docs/design/lotto-mvp-proposals.md (Codex/TS 채택). research 없음(데이터 출처는 배포 전 확인)

## 실행 전 확인

- 현재 브랜치: feature/lotto-mvp (main 아님)
- main 직접 작업 아님: 예
- 작업트리 상태: clean (설계 확정 커밋 cc90867 완료)
- 사용자 승인: spec Approved 확인됨
- CI 상태: 아직 없음 (WP-001에서 스캐폴딩·lock 생성 후 동작)
- 미결정 사항: 없음
- 커밋 단위: **의미 단위로 묶는다** — ① 스캐폴딩(WP-001) ② 도메인 로직+저장(WP-002~005) ③ 데이터+App 연결(WP-006) ④ UI(WP-007~008) ⑤ 마무리(WP-009). WP마다 잘게 쪼개지 않는다. 구현 커밋은 설계 확정 커밋과 분리(이미 분리됨).

## Work Packages

WP 하나는 따로 완료·검증할 수 있는 크기로 잡는다. 끝나면 체크박스와 상태를 함께 갱신한다.
순서: 먼저 동작하는 최소 버전(스캐폴딩 → 순수 로직 → UI) → 살을 붙이는 순.

- [x] WP-001: React + Vite + TypeScript + Vitest 스캐폴딩
  - 목적: 빌드·테스트·lint·typecheck가 도는 빈 프로젝트 골격을 만든다. CI가 동작하게 한다.
  - 변경 파일: package.json, package-lock.json, tsconfig\*.json, vite.config.ts, eslint 설정, .prettierrc, src/main.tsx, src/App.tsx(자리만), index.html
  - 완료 조건: `npm install` 후 dev/build/test/lint/typecheck 스크립트가 정의되고 실행된다. CI에서 쓰는 스크립트명(lint·typecheck·test·build)이 package.json과 일치한다. **Vitest 환경을 jsdom으로 설정**해 이후 localStorage(WP-005)·컴포넌트 테스트가 환경 재설정 없이 돈다.
  - 검증: `npm run lint && npm run typecheck && npm test && npm run build` 모두 성공(빈 테스트라도 통과). dev 서버 기동 확인.
  - 위험: Vitest watch 기본값 → `test` 스크립트를 `vitest run`으로 둬 CI에서 멈추지 않게. typecheck는 `tsc --noEmit`. jsdom 미설정 시 WP-005에서 환경을 다시 건드리게 됨 → WP-001에서 미리 설정.
  - 상태: done (2026-06-25). lint·typecheck·test(스모크 1개)·build 통과, dev 서버 HTTP 200. 임시 src/smoke.test.ts는 WP-002에서 대체. 취약점 해결: vitest 2→4.1.9로 올려 esbuild advisory 제거(npm audit 0건).

- [x] WP-002: 도메인 순수 로직 — 순수 랜덤 생성 + 불변식
  - 목적: 1~45 본번호 6개(중복 없음) + 보너스 1개 생성 함수와 불변식 검증.
  - 변경 파일: src/domain/lotto.ts, src/domain/lotto.test.ts, src/domain/types.ts(Draw·SavedResult·GenerateMode 타입)
  - 완료 조건: spec "번호 생성" 완료 조건 3개. RNG 주입 시그니처(`rng = Math.random`).
  - 검증: `npm test` — 본번호 6개/1~45 범위/중복 없음, 보너스 1개·본번호와 중복 없음 (반복 실행 테스트).
  - 위험: 비복원 추출 구현 버그(중복) → 불변식 테스트로 방어.
  - 상태: done (2026-06-25). generateRandom(rng=Math.random), 비복원 추출. 테스트 3개(1000회 불변식·정렬·결정적 RNG) 통과. 임시 smoke.test.ts 제거.

- [x] WP-003: 도메인 순수 로직 — 빈도 계산
  - 목적: 당첨 데이터에서 1~45 각 번호의 누적 출현 횟수 계산.
  - 변경 파일: src/domain/lotto.ts(calculateFrequencies), src/domain/lotto.test.ts
  - 완료 조건: spec "빈도 통계" 완료 조건 중 계산 정확성 + 빈 데이터(0건)에서 1~45 count 0.
  - 검증: `npm test` — 알려진 데이터로 횟수 정확, 빈 배열에서 모든 count 0.
  - 위험: 낮음.
  - 상태: done (2026-06-25). calculateFrequencies — 본번호만 집계(보너스 제외, 코드 주석 명시), 항상 1~45 길이 45, 범위 밖 값 무시. 테스트 3개(전체 렌더·빈 데이터 0·정확성) 통과.

- [x] WP-004: 도메인 순수 로직 — 빈도가중 생성
  - 목적: 자주(count+1)·드물게(maxCount-count+1) 가중, 비복원 가중 추출. 빈 데이터 시 랜덤 폴백.
  - 변경 파일: src/domain/lotto.ts(generateWeighted), src/domain/lotto.test.ts
  - 완료 조건: spec "빈도가중 생성" 완료 조건 전체(불변식 동일 만족, 폴백, 가중 방향).
  - 검증: `npm test` — 고정 RNG 주입 시 자주/드물게 방향이 의도대로, 가중 결과도 6개 불변식 만족, 빈 데이터면 랜덤 폴백.
  - 위험: 가중 테스트 무작위성 불안정 → RNG 주입으로 결정적 검증.
  - 상태: done (2026-06-25). generateWeighted(mode, freq, rng), 비복원 가중 추출(weight≥1로 불변식 보장), 빈 데이터 랜덤 폴백. 테스트 3개(불변식 각 500회·폴백 결정적·가중 방향 통계) 통과.

- [x] WP-005: localStorage 저장 모듈
  - 목적: 저장/목록조회/개별삭제/전체삭제 캡슐화, 파싱 실패 시 빈 목록 복구.
  - 변경 파일: src/storage/savedResults.ts, src/storage/savedResults.test.ts
  - 완료 조건: spec "저장" 완료 조건 전체. id는 crypto.randomUUID() + timestamp fallback.
  - 검증: `npm test` — 저장 후 조회, 개별 삭제, 전체 비우기, 손상 데이터에서 빈 목록 복구(localStorage mock).
  - 위험: 테스트 환경 localStorage → WP-001에서 jsdom 설정 완료 전제(추가 mock 최소화).
  - 상태: done (2026-06-25). list/save/delete/clear, crypto.randomUUID+fallback, 파싱 실패 시 빈 목록 복구. 테스트 5개(빈 목록·저장 유지·개별삭제·전체비우기·손상 복구) jsdom에서 통과.

- [x] WP-006: 샘플 데이터 + App 데이터 연결
  - 목적: 고정 스키마 샘플 JSON 추가(UI 확인용 수십 회차 규모), App에서 로드해 빈도 계산 결과를 상태로.
  - 변경 파일: src/data/draws.sample.json, src/App.tsx
  - 완료 조건: 앱이 샘플 데이터를 로드해 빈도를 계산하고, 빈 데이터 경로도 안전.
  - 검증: dev 서버에서 데이터 로드 확인. typecheck 통과.
  - 위험: **샘플 데이터는 실데이터가 아니다 — 코드 로직 검증용이며 공개 배포 전 외부 조사로 확인한 실데이터(docs/research)로 교체해야 한다.** 파일 상단 주석(또는 \_README)과 UI에 "샘플 데이터" 표시를 둔다.
  - 상태: done (2026-06-25). draws.sample.json 30회차(가짜, 불변식 만족) + src/data/README.md 경고. App에서 JSON 로드→calculateFrequencies 연결, "샘플 데이터 N회차(실제 아님)" 표시. typecheck·lint·build 통과, dev 200. 본격 UI/육안 확인은 WP-007/008.

- [ ] WP-007: UI 컴포넌트 — 면책 배너 + 생성 패널
  - 🔔 스킬 시도: 이 지점에서 `frontend-design` 또는 `baseline-ui` 중 1개를 설치해 실사용 → X 후기 (메모리 lotto-frontend-skill-trial). design 확정 범위 안에서만, 새 UI 결정이 나오면 design/spec 먼저 갱신.
  - 목적: 상단 상시 면책 배너, 모드 선택(순수/자주/드물게) + 뽑기 + 결과 카드. 가중 옵션 근처 재미 요소 안내.
  - 변경 파일: src/components/DisclaimerBanner.tsx, src/components/GeneratorPanel.tsx, src/App.tsx
  - 완료 조건: spec "면책·표현" + 생성 UI. 빈 데이터 시 "데이터 없음, 랜덤 동작" 표시.
  - 검증: dev 서버에서 각 모드 생성 동작, 면책 배너 상시 노출, 금지 표현 부재 육안 확인.
  - 위험: 사행성 표현 혼입 → 문구 검토(WP-009)에서 재확인.
  - 상태: pending

- [ ] WP-008: UI 컴포넌트 — 빈도 표 + 저장 목록
  - 목적: 번호별 출현 횟수 + CSS 막대, 저장 목록 + 개별삭제 + 전체비우기 UI.
  - 변경 파일: src/components/FrequencyTable.tsx, src/components/SavedResults.tsx, src/App.tsx, 스타일(CSS)
  - 완료 조건: spec "빈도 통계" 표시 + "저장" UI 완료 조건. 빈 데이터/빈 목록 상태 표시.
  - 검증: dev 서버에서 막대 표시, 저장→목록→개별삭제→전체비우기, 새로고침 후 유지.
  - 위험: 낮음.
  - 상태: pending

- [ ] WP-009: 표현 검토 + 최종 로컬 검사
  - 🔔 스킬 시도: 마무리 단계에서 `responsive-mobile-check`(모바일 점검) + 실화면 확인(`Playwright` 스킬 vs `claude-in-chrome` MCP 비교)을 실사용 → X 후기 (메모리 lotto-frontend-skill-trial).
  - 목적: 금지 표현 부재 확인, 전체 완료 조건 점검, 로컬 게이트 통과.
  - 변경 파일: (수정 발생 시 해당 파일)
  - 완료 조건: spec 완료 조건 전체 충족, 표현 금지 확인.
  - 검증: 코드·UI에서 "당첨 확률을 높인다/당첨 보장/예측" 표현 grep 부재. `npm run lint && npm run typecheck && npm test && npm run build` 통과.
  - 위험: 낮음.
  - 상태: pending

## 실패 루프

- 검증 실패: 원인 격리 → debug 스킬.
- Codex 리뷰 지적: 로직·계약·보안 변경이면 수정 후 재검토, 설정·포맷이면 CI 재실행.
- CI 실패: 별도 수정 커밋으로 처리.
- spec 변경 필요: spec부터 고치고 사람이 재승인 → 필요하면 재설계.

## 롤백 계획 (High-Risk 필수, 그 외 선택)

- Standard 등급이라 필수 아님. 되돌림은 feature 브랜치 커밋 단위 revert로 충분. 배포(GitHub Pages)는 1차 코드 범위 밖.

## 최종 검증

모든 WP가 done이면 전체가 목표를 달성했는지 따로 확인한다:

- [ ] spec 완료 조건 충족
- [ ] 테스트 (정상·오류·경계값)
- [ ] lint/typecheck
- [ ] Codex 독립 검토 (Standard)
- [ ] CI 통과
- [ ] 사람 최종 확인 → main 병합

## 변경 기록

- 2026-06-24: 확정 설계(docs/design/lotto-mvp.md) 기준으로 WP-001~009 작성.
- 2026-06-24: plan 검토 후 보강 — 커밋 단위(의미 단위) 명시, WP-001에 jsdom 환경 설정 추가, WP-006 샘플 데이터의 "실데이터 아님·배포 전 교체" 강화.
