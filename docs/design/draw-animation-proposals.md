# 추첨 애니메이션 — 독립 설계안 비교 (proposals)

- 작성일: 2026-07-03
- 기준 spec: docs/specs/draw-animation.md (Draft)
- research: 없음 (외부 사실 불필요 — 기존 스택 내 UI 연출)
- 규칙: 두 안은 같은 spec만 보고 독립 작성됐다. Claude 안 A는 Codex 실행 전까지 파일에 기록하지 않았다.

## Claude Code 설계안 (A)

**구조**

- `src/components/drawReveal.ts` (새 순수 모듈, UI 계층): `revealSequence(numbers: number[], rng: Rng): number[]`
  — 확정된 본번호 6개(오름차순)를 받아 **연출용 공개 순서**(피셔-예이츠 셔플)를 만든다.
  기존 `Rng` 주입 계약을 재사용해 결정적 테스트. 도메인(`src/domain/`)은 파일·타입 모두 무변경.
- `src/components/DrawOverlay.tsx` (새 컴포넌트): 풀스크린 오버레이. phase 상태 머신
  `mixing → revealing(공개 수 0→6) → result`를 `useState` + `setTimeout` 체인으로 진행,
  effect cleanup에서 타이머 전부 해제. props: 게임 A의 공개 순서·오름차순 번호, `onConfirm`.
  건너뛰기는 타이머를 정리하고 즉시 `result` phase로 점프.
- `App`: `onDraw`에서 기존 도메인 함수로 전 게임 확정 → **즉시 `setResult`(용지 반영)** 하고
  오버레이를 연다(풀스크린이라 뒤가 가려짐). reduced-motion이면(`matchMedia`를 JS에서 읽어 분기)
  오버레이를 아예 열지 않고 지금과 동일 동작. 확인/건너뛰기 후 확인 시 오버레이만 닫는다.
- 비주얼: 기존 `LottoMachine`을 오버레이 variant(prop 또는 CSS modifier)로 재사용 — 확대 +
  섞임 가속(`spinning` 클래스). 뽑힌 공은 출구 캡에서 pop-in으로 트레이에 순차 정렬.
  `Ball`·`zoneOf` 그대로 사용(구간색 일관). 배경은 기존 무대 토큰(어두운 딤 + 글로우) 재사용.
- 입력 차단: 오버레이 fixed 풀스크린 + 최상위 z-index, 열려 있는 동안 body 스크롤 잠금,
  배경 루트에 `inert`(또는 `aria-hidden`) 적용. `role="dialog"` `aria-modal="true"`,
  공개 번호는 `aria-live="polite"`.

**핵심 결정**

1. 공개 순서는 **UI 연출용 셔플** — 도메인은 오름차순 결과만 주고, 셔플은 표시 계층 책임.
   결과 집합은 동일하고 순서만 연출이다. 도메인 타입(`GeneratedNumbers`)·함수 시그니처 무변경.
2. 셔플이라 **행운수 고정 번호도 자동으로 균등 취급**된다(고정이 먼저 나오는 문제가 구조적으로 없음).
3. 용지는 클릭 즉시 반영하고 오버레이가 가린다 — pending 상태 없이 상태 흐름 단순화.
4. 라이브러리 0 (CSS keyframes + setTimeout. 물리 엔진·rAF 루프 불필요 수준의 연출).

**장점**

- 도메인 완전 무변경(spec 완료 조건 "기존 테스트 그대로 통과"가 자동 충족).
- `revealSequence`는 순수 함수라 순열 불변식(같은 집합·길이 6)·결정적 RNG 테스트가 쉬움.
- 고정 모드 별도 처리 코드가 없음(셔플이 균등 취급을 보장).
- 상태 개수 최소(pending 결과 상태 없음).

**위험**

- 공개 순서가 생성 알고리즘의 "실제 뽑힌 순서"가 아니라 연출용 셔플(결과는 동일 — 재미 요소
  관점에서 허용 범위라고 판단하나 관점 차이 있을 수 있음).
- setTimeout 체인은 cleanup 누락 시 StrictMode 재실행·건너뛰기에서 유령 전이 위험 — cleanup
  테스트 필요.
- 클릭 즉시 용지 반영은 스크린리더가 오버레이 뒤 내용을 읽을 여지 — `inert` 처리로 막아야 함.
- 오버레이 안 추첨기 확대의 모바일 폭 대응(공·버튼 겹침) 확인 필요.

**구현 및 검증 순서**

1. `revealSequence` 순수 함수 + 테스트(순열 불변·결정적 RNG·길이 6).
2. `DrawOverlay` 상태 머신(mixing→revealing→result) + 건너뛰기·확인 + 타이머 cleanup.
   vitest fake timers로 phase 전이·건너뛰기·cleanup 테스트.
3. `App` 연결: reduced-motion JS 분기, 즉시 반영 + 오버레이, `inert`·스크롤 잠금.
4. 비주얼 폴리시: 머신 확대·섞임 가속·pop-in 트레이·결과 컷. 모바일 폭 점검.
5. 금지 표현 grep + 로컬 게이트(lint·typecheck·test·build) → verify.

## Codex 설계안 (B)

(Codex stdout 원문 — 요약하지 않고 핵심 그대로)

**구조**

- `App`에서 번호 생성 시점에 전체 게임 결과를 먼저 확정하고, 첫 게임 A에 대한 `revealOrder`와
  오름차순 `numbers`를 함께 가진 animation plan을 만든다.
- 기존 `result`는 사용자가 결과 컷에서 `확인`을 누른 뒤에만 용지에 반영한다.
  `prefers-reduced-motion: reduce`이면 overlay 없이 즉시 `result`에 반영한다.
- 새 `DrawOverlay` 컴포넌트를 추가해 풀스크린 dialog, 추첨기 무대, 순차 공개 영역, 결과 컷,
  `건너뛰기`와 `확인` 버튼을 담당하게 한다.
- 기존 `Ball`과 `zoneOf`를 그대로 사용해 overlay와 결과 컷의 공 색상이 기존 z1~z5 규칙을 따르게 한다.
- 기존 `LottoMachine`은 가능하면 시각 자산으로 재사용하고, overlay 전용 크기·배치는 CSS modifier
  또는 wrapper로 처리한다.

**핵심 결정**

- 가장 중요한 결정은 "정렬된 결과만으로 애니메이션하지 않는다". 현재 도메인 생성 함수는
  `numbers`를 오름차순 정렬해 반환하므로, 그대로 쓰면 "공개 순서는 뽑힌 순서" 조건을 만족할 수 없다.
- 도메인 생성 로직의 확률·고정번호 동작은 바꾸지 말고, **생성 과정에서 얻은 공개 순서를 별도
  메타데이터로 보존**한다. 예: `{ numbers: [오름차순], revealOrder: [공개순] }`.
- 행운수 고정 모드는 고정 번호가 먼저 튀어나오는 식으로 보이면 "별도 취급 없음"에 어긋난다.
  고정 번호도 최종 6개 안에서 동일한 공으로 취급되도록 공개 순서를 만들고 테스트해야 한다.
- overlay는 단순 CSS 애니메이션만으로 상태를 추론하지 않고, React state와 timer로
  `revealedCount`, `drawing/result` phase를 명시한다. `건너뛰기`는 timer를 정리하고 즉시
  result phase로 이동한다.
- reduced-motion은 CSS에서 animation만 끄는 것으로 부족하다. spec상 overlay 자체를 생략해야
  하므로 클릭 처리 시 media query 값을 읽어 분기한다.

**장점**

- 번호 생성 결과와 연출 표시를 분리해 "건너뛰기 여부와 무관하게 같은 번호" 조건을 지키기 쉽다.
- 기존 `Ticket`, `Ball`, `zoneOf`, 생성 모드 로직을 재사용하므로 새 의존성이나 물리 엔진 없이
  구현 가능하다.
- ×2~×5는 첫 게임만 animation plan에 넣고 전체 `DrawResult`는 이미 확정해 두면, 연출 시간은
  ×1과 동일하게 유지된다.
- 순수 함수로 `revealOrder -> sorted result`를 테스트할 수 있어 완료 조건의 "번호 불변" 검증이 명확하다.

**위험**

- 공개 순서를 보존하지 않고 기존 정렬 결과를 그대로 순차 공개하면 spec 위반이다. 구현 초기에
  먼저 해결해야 한다.
- React StrictMode에서 effect가 재실행될 수 있으므로 overlay timer cleanup이 부실하면 공이 두 번
  공개되거나 result phase가 중복 진입할 수 있다.
- overlay가 화면만 덮고 focus를 잡지 않으면 키보드로 뒤 화면 버튼을 조작할 수 있다.
  `aria-modal`, focus 이동, 배경 조작 차단이 필요하다.
- reduced-motion 사용자를 CSS media query만으로 처리하면 overlay가 잠깐 뜨는 회귀가 생길 수 있다.
- 문구는 "확률 상승", "당첨 보장" 계열을 쓰지 말고 "뽑힌 번호", "결과 확인"처럼 중립적으로
  유지해야 한다.

**구현 및 검증 순서**

1. 생성 결과 준비 계층: 기존 `generateRandom`·`generateWeighted`·`generateWithFixed`의 결과
   불변식은 유지하면서 animation용 `revealOrder`를 확보한다.
2. `createDrawAnimationPlan` 같은 순수 함수를 추가해 첫 게임의 공개 순서, 결과 컷용 정렬 번호,
   전체 게임 결과를 분리한다.
3. `App`에 `pendingAnimationPlan` 상태와 reduced-motion 분기를 추가한다. overlay 종료 전에는
   용지를 갱신하지 않고, `확인`에서만 `setResult`한다.
4. `DrawOverlay` 구현: 연출 중에는 `건너뛰기`만, 결과 컷에서는 `확인`만 가능하게 하고
   timer cleanup과 focus 처리를 포함한다.
5. CSS로 fixed fullscreen overlay, 큰 추첨기, 공개 공 tray, 결과 컷. 모바일에서 버튼·공·텍스트가
   겹치지 않도록 responsive constraint를 둔다.
6. 테스트: 순수 함수 테스트, skip 테스트, reduced-motion 즉시 반영 테스트, ×1/×5 경계 테스트,
   기존 도메인 테스트 유지 확인.
7. 완료 전 `npm run lint`·`npm run typecheck`·`npm test`·`npm run build` 통과.

## 핵심 차이

| 항목                    | Claude Code (A)                                                                                                                                                               | Codex (B)                                                                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 공개 순서의 출처        | UI 계층 연출용 셔플(`revealSequence` 순수 함수) — 도메인 파일·타입 완전 무변경                                                                                                | 생성 과정의 실제 뽑힌 순서를 메타데이터(`revealOrder`)로 보존 — 도메인 동작은 유지하되 반환 구조 확장                                          |
| 행운수 고정의 균등 취급 | 셔플이라 자동 충족(별도 코드 없음)                                                                                                                                            | `generateWithFixed`는 고정 번호를 앞에 쌓으므로 실제 순서를 그대로 쓰면 고정이 먼저 나옴 → 별도 순서 보정·테스트 필요 (B 스스로 위험으로 지적) |
| 용지 반영 시점          | 클릭 즉시 반영, 오버레이가 가림(+배경 `inert`)                                                                                                                                | `확인` 후에만 반영(pending plan 상태)                                                                                                          |
| 접근성 강조점           | `inert`·`aria-live`·스크롤 잠금                                                                                                                                               | focus 이동·`aria-modal`·키보드 배경 조작 차단                                                                                                  |
| 공통                    | `DrawOverlay` + React state/timer phase 머신, `Ball`·`zoneOf`·`LottoMachine` 재사용, 라이브러리 0, reduced-motion은 JS `matchMedia` 분기, 건너뛰기=타이머 정리 후 result 점프 | 동일                                                                                                                                           |

## 각 도구의 추천

- **Claude Code 추천**: A의 "연출용 셔플 + 도메인 무변경"을 뼈대로 하되, B의 **"확인 후 용지
  반영(pending)"과 focus 처리**를 채택하는 절충. 근거: ① spec 완료 조건이 "도메인 로직
  무변경"이라 B의 반환 구조 확장(`revealOrder`)은 도메인 타입·전 함수 시그니처를 건드려 변경
  범위가 커지고, ② B 스스로 지적했듯 실제 순서를 쓰면 행운수 고정이 먼저 나와 결국 셔플 보정이
  필요해져 "실제 순서 보존"의 이점이 퇴색된다. 반면 ③ 용지 반영 시점은 B(확인 후 반영)가
  "닫히면 채워져 있다"는 spec 문구와 스크린리더 관점에서 더 깔끔하다. 비용·위험: 절충이라
  구현 기준이 이 문서에만 존재 — 확정 design에 정확히 옮겨 적어야 하고, pending 상태가 하나 늘어
  A 원안보다 상태 흐름이 약간 복잡해진다.
- **Codex 추천**: B 원안 — 실제 뽑힌 순서 보존이 "공개 순서는 뽑힌 순서" 조건에 충실하고,
  확인 후 반영·focus 처리로 접근성 회귀를 막는다.

## 사용자 결정

- 선택: **절충안** (2026-07-03, chmg7626-blip)
- 선택 이유 / 추가 지시: A의 "연출용 셔플 + 도메인 무변경"을 뼈대로, B의 "확인 후 용지 반영
  (pending)"과 focus 처리를 채택. 도메인 타입을 건드리지 않아 변경 범위가 작고 행운수 고정
  균등 취급이 자동 충족되며, 용지 반영 시점·접근성은 B 쪽이 spec 문구에 더 맞다는 근거.
  확정 설계는 docs/design/draw-animation.md 에 절충 내용을 명시적으로 옮겨 기록한다.
