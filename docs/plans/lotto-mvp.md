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
- 커밋 단위: **의미 단위로 묶는다** — ① 스캐폴딩(WP-001) ② 도메인 로직+저장(WP-002~005) ③ 데이터+App 연결(WP-006) ④ UI(WP-007~009) ⑤ 마무리(WP-010). WP마다 잘게 쪼개지 않는다. 구현 커밋은 설계 확정 커밋과 분리(이미 분리됨). 저장 모듈은 2026-06-29 삭제(복사로 대체).

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

> UI(WP-007~010)는 확정 홈페이지 목업(docs/mockups/mockup-a-bright.html, 메모리 lotto-ui-redesign)을
> React로 이식하는 작업이다. 기준은 갱신된 design 문서(docs/design/lotto-mvp.md "시각 디자인"·"모션" 절).
> frontend-design 2안 worktree 비교는 종료(2026-06-25 완료·폐기). 실화면 점검은 claude-in-chrome.
> design 확정 범위 안에서만 작업하고, 새 UI 결정이 나오면 코드보다 design/spec을 먼저 갱신한다.
> 추첨 연출 애니메이션은 이번 범위 밖(별도 spec — lotto-draw-animation).

- [x] WP-007: 공통 Ball + 면책 띠 + 회차 당첨번호 띠
  - 목적: 번호 공 컴포넌트(구간색 z1~z5 + 광택, 크기 변형)와 상단 두 띠(면책 상시 + 회차 당첨번호 샘플).
  - 변경 파일: src/components/Ball.tsx, src/components/zones.ts(+테스트), src/components/DisclaimerBanner.tsx, src/components/WinningBar.tsx, src/App.tsx, src/main.tsx, src/styles.css, index.html(웹폰트)
  - 완료 조건: 공이 번호 구간에 맞는 색으로 표시되고 숫자가 광택에 묻히지 않는다(z-index 규칙). 면책 띠 상시 노출. 회차 당첨번호 띠가 본번호 6+보너스로 표시되고 "샘플" 명시.
  - 검증: dev 서버 + claude-in-chrome 육안. 구간색·가독성·면책/샘플 표시 확인.
  - 위험: 공 광택이 숫자를 가리는 회귀 → 광택을 z-index:-1로 두는 목업 방식을 지킨다.
  - 상태: done (2026-06-29). zoneOf 순수함수 분리(테스트 2개: 경계값·전수 매핑) + Ball/DisclaimerBanner/WinningBar 컴포넌트, styles.css(토큰·무대배경·띠·공), 웹폰트 CDN. App에 최신 샘플 회차(제30회) 전달. lint·typecheck·test(11)·build 통과. claude-in-chrome 육안: 구간색·가독성·면책/샘플 표시 정상.

- [x] WP-011: 도메인 생성 모드 재구성 (선행 — WP-008보다 먼저)
  - 목적: 모드 재구성(2026-06-30 spec 재승인)을 도메인에 반영. `generateWithFixed(fixed[], rng)` 신규 + `generateWeighted`에서 'rare' 경로 제거 + `GenerateMode` 타입 변경('random'|'frequent'|'fixed').
  - 변경 파일: src/domain/lotto.ts, src/domain/lotto.test.ts, src/domain/types.ts, src/components/GeneratorPanel.tsx(모드칩 라벨만 — 타입 변경 강제. NumberPad·고정 배선은 WP-008)
  - 완료 조건: spec "생성 모드" 완료 조건 중 도메인 부분 — 행운수 고정(고정 0~5개 포함·나머지 비복원 랜덤·정렬·0개=순수랜덤·6개 불변식), 단골 가중 유지, rare 제거. 도메인은 경계(개수>5·범위 밖 고정)에서도 안전(시스템 경계 방어).
  - 검증: `npm test` — generateWithFixed(고정 0/3/5개 결정적 RNG·불변식·고정 포함·중복 없음), generateWeighted(단골 방향 유지), rare 테스트 제거 확인. typecheck.
  - 위험: 기존 호출부(App/GeneratorPanel)가 옛 시그니처를 참조하면 typecheck 실패 → WP-008에서 함께 정리. rare 제거로 깨지는 테스트는 spec 변경 반영이므로 약화가 아님(완료조건 근거 명시).
  - 상태: done (2026-06-30). generateWithFixed(시스템 경계 방어: 범위 밖·중복 거르고 최대 5개) + generateWeighted 단순화(mode 인자·rare·maxCount 제거) + drawFromPool을 count 받게 일반화 + 타입 'rare'→'fixed'. GeneratorPanel 모드칩 라벨 교체(순수/역대 단골/행운수 고정). lint·typecheck·test(16)·build 통과. App.handleDraw는 여전히 stub(WP-008에서 배선).

- [x] WP-008: 생성 패널 + 추첨기 + 5게임 용지(복사)
  - 선행: WP-011(도메인 모드 재구성)
  - 목적: 모드칩(순수/역대 단골/행운수 고정) + **행운수 고정 시 1~45 번호판(NumberPad, 0~5개)** + 뽑기 버튼 + ×1~5 연속뽑기 + 추첨기 비주얼 + 선택 모드·게임수로 생성한 A~E 5게임 용지 + 게임별/전체 복사.
  - 변경 파일: src/components/GeneratorPanel.tsx, src/components/NumberPad.tsx, src/components/LottoMachine.tsx, src/components/Ticket.tsx, src/App.tsx, 스타일(CSS)
  - 완료 조건: spec "번호 생성·연속뽑기"·"생성 모드"·"복사". ×1/×5 경계 동작, 각 게임 본번호 6개(보너스 없음), 역대 단골/행운수 고정 옵션 근처 "재미 요소" 안내, 빈 데이터 시 "데이터 없음, 랜덤 동작" 표시(단골 모드), 행운수 고정 시 번호판 0~5개 토글(6개째 차단)·고정수 전 게임 공통, 개별·전체 복사 동작+피드백.
  - 검증: dev 서버 + claude-in-chrome에서 각 모드·게임수 생성, 행운수 고정 번호판·×N 공통 동작, 복사 클립보드 확인, 면책/안내 노출.
  - 위험: clipboard API는 보안 컨텍스트 한정 → 실패 피드백, 필요 시 폴백(design 위험 절). 번호판 5개 차단 누락 시 6개째 고정으로 랜덤 자리 0 → 경계 테스트/육안 확인.
  - 상태: done (2026-07-01). NumberPad(0~5개 토글·6개째 차단·전체해제) + LottoMachine(장식 공 12개·wander) + Ticket(A~E·게임별/전체 복사·clipboard→execCommand 폴백) 신규, GeneratorPanel에 fixed 상태·모드별 조립, App.handleDraw 배선(random/frequent/fixed×count) + useMemo 빈도·hasData. styles.css 이식. lint·typecheck·test(16)·build 통과. claude-in-chrome 육안: 3모드 전환·순수랜덤 ×3·행운수고정 5개+6개째 차단+전 게임 공통·역대단골 가중·면책/샘플/재미요소 안내 정상. **복사는 자동화 클립보드 활성화 제약으로 제가 검증 못 함 → 사용자가 실클릭으로 동작 확인**. 추첨기 공 6→12개(design 갱신·2026-07-01).

- [x] WP-009: 1~45 출현 통계 그리드 + 당첨금액(샘플) + 조립
  - 목적: 1~45 공 그리드(9열) + 출현 횟수, 당첨금액(1등 강조 + 2~5등, 샘플), App 전체 레이아웃 조립.
  - 변경 파일: src/components/FrequencyGrid.tsx, src/components/PrizeTable.tsx, src/data/prize.sample.ts, src/App.tsx, 스타일(CSS)
  - 완료 조건: spec "빈도 통계"·"회차 당첨번호·당첨금액(샘플)". 그리드가 빈도 높낮이를 보여주고, 빈 데이터(0건) 안전, 당첨금액에 "샘플" 명시.
  - 검증: dev 서버 + claude-in-chrome에서 그리드·당첨금액 표시, 빈 데이터 경로 확인.
  - 위험: 당첨금액 샘플이 실데이터로 오해되지 않게 "샘플" 표시 필수.
  - 상태: done (2026-07-01). FrequencyGrid(9열 공 그리드·출현 횟수) + PrizeTable(1등 강조+2~5등) + prize.sample.ts + App 두 섹션 조립(당첨금액·통계, 각 "샘플" 명시). 빈 데이터 시 통계 sub를 "데이터 없음 · 통계 없음"으로(그리드는 45개 0 안전). lint·typecheck·test(16)·build 통과. claude-in-chrome 육안: 당첨금액 1~5등·통계 그리드(41번 0회 포함) 정상.

- [x] WP-010: 표현 검토 + 반응형 + 최종 로컬 검사
  - 🔔 실화면·모바일 점검: 이미 보유한 `claude-in-chrome` MCP(화면 리사이즈 포함)로. responsive-mobile-check·Playwright 스킬은 부재/미확인이라 도입 안 함 (메모리 lotto-frontend-skill-trial).
  - 목적: 금지 표현 부재 확인, 모바일 폭 점검, 전체 완료 조건 점검, 로컬 게이트 통과.
  - 변경 파일: src/styles.css (모바일 당첨금액 1열 @media 추가)
  - 완료 조건: spec 완료 조건 전체 충족, 표현 금지 확인, 모바일 폭에서 레이아웃 깨짐 없음.
  - 검증: 코드·UI에서 "당첨 확률을 높인다/당첨 보장/예측" 표현 grep 부재. claude-in-chrome 모바일 폭 확인. `npm run lint && npm run typecheck && npm test && npm run build` 통과.
  - 위험: 낮음.
  - 상태: done (2026-07-02). 금지 표현 부재(매칭은 면책 문구만: "예측 아님/당첨 보장 아님") 확인. claude-in-chrome으로 390px 폭 전 구간 점검 — 면책·회차 띠·모드칩·×N 칩·행운수 번호판(9열)·5게임 용지·통계 그리드(9열) 모두 넘침 없음. **당첨금액 2~5등 카드가 좁은 폭에서 금액이 글자 단위로 세로 분해되는 문제 발견**(예: "5천원"→3줄) → styles.css에 `@media (max-width:480px) .prize-list{grid-template-columns:1fr}` 추가로 해결. 검증: 1열 강제 시 금액 .pa 높이 88→29px(한 줄)·육안 한 줄 확인. lint·typecheck·test(16)·build 통과. **도구 한계: 이 환경에서 resize_window가 렌더 뷰포트를 안 줄여(innerWidth 1561 고정), body max-width로 시뮬레이션함. 뷰포트 MQ·vw/vh 부재라 내부 grid/flex 折り返し는 유효 재현되나, `@media(max-width:480px)` 자체의 실기기 발동은 미검증(CSS 표준이라 자명).**

## 실패 루프

- 검증 실패: 원인 격리 → debug 스킬.
- Codex 리뷰 지적: 로직·계약·보안 변경이면 수정 후 재검토, 설정·포맷이면 CI 재실행.
- CI 실패: 별도 수정 커밋으로 처리.
- spec 변경 필요: spec부터 고치고 사람이 재승인 → 필요하면 재설계.

## 롤백 계획 (High-Risk 필수, 그 외 선택)

- Standard 등급이라 필수 아님. 되돌림은 feature 브랜치 커밋 단위 revert로 충분. 배포(GitHub Pages)는 1차 코드 범위 밖.

## 최종 검증

모든 WP가 done이면 전체가 목표를 달성했는지 따로 확인한다:

- [x] spec 완료 조건 충족 (빈도 통계 그리드에 빈도 비례 막대 추가로 "시각적 구분" 조건까지 충족)
- [x] 테스트 (정상·오류·경계값) — 18개 통과
- [x] lint/typecheck — 통과
- [x] Codex 독립 검토 (Standard) — 특이사항 없음(2026-07-02, [치명] 1건 수정 후 재검토 통과)
- [x] CI 통과 — GitHub Actions 성공(2026-07-02, PR #1). ※ 초기 미실행은 계정 이메일 미인증 탓, 인증 후 재push로 해결.
- [ ] 사람 최종 확인 → main 병합

## 변경 기록

- 2026-06-24: 확정 설계(docs/design/lotto-mvp.md) 기준으로 WP-001~009 작성.
- 2026-06-24: plan 검토 후 보강 — 커밋 단위(의미 단위) 명시, WP-001에 jsdom 환경 설정 추가, WP-006 샘플 데이터의 "실데이터 아님·배포 전 교체" 강화.
- 2026-06-29: 확정 목업 반영(spec 재승인·design 갱신)으로 UI WP 재작성. WP-007~009를 새 범위로 재정의
  (Ball·면책/회차 띠 / 생성패널·추첨기·5게임 용지·복사 / 통계 그리드·당첨금액 샘플·조립), 표현검토를 WP-010으로.
  저장(savedResults) 삭제·보너스 제거 반영. WP-001~006(도메인·데이터)은 done 유지.
- 2026-06-30: 생성 모드 재구성(spec 재승인·design 직접 갱신)으로 WP-011(도메인 모드 재구성 — generateWithFixed
  추가·rare 제거) 신설(WP-008 선행), WP-008에 NumberPad·새 모드칩(순수/역대 단골/행운수 고정) 반영.
  WP-007 done으로 정정(1단위는 87e00a8 커밋됨).
