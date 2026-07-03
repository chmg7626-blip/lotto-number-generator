# 추첨 애니메이션 — 확정 설계

- 확정일: 2026-07-03
- 기준 spec: docs/specs/draw-animation.md
- 결정 경위: docs/design/draw-animation-proposals.md — 독립 설계 A(Claude)/B(Codex) 비교 후
  사용자가 **절충안** 선택. A의 "연출용 셔플 + 도메인 무변경" 뼈대 + B의 "확인 후 용지 반영
  (pending)"과 focus 처리.

## 구조

```
src/components/
  drawReveal.ts        revealSequence(numbers, rng) — 연출용 공개 순서(순수 함수) + 테스트
  DrawOverlay.tsx      풀스크린 오버레이: 추첨 무대 + 순차 공개 + 결과 컷 + 건너뛰기/확인
  (기존 재사용)        Ball(zoneOf 구간색), LottoMachine(오버레이 variant), Ticket
src/App.tsx            pending 상태·reduced-motion 분기·확인 시 용지 반영
src/styles.css         오버레이·무대·트레이·결과 컷 스타일 (기존 토큰 재사용)
```

도메인(`src/domain/`)은 **파일·타입·함수 시그니처 모두 무변경**. 연출은 표시 계층 책임이다.

## 핵심 결정

1. **공개 순서 = 연출용 셔플 (A)**: `revealSequence(numbers: number[], rng: Rng): number[]` —
   확정된 본번호 6개(오름차순)를 피셔-예이츠로 섞어 공개 순서를 만든다. 기존 `Rng` 주입 계약을
   재사용해 결정적 테스트. 생성 알고리즘의 실제 추출 순서를 쓰지 않는 이유: 도메인 반환 구조
   확장이 필요해지고, `generateWithFixed`는 고정 번호를 앞에 쌓아 결국 별도 보정(셔플)이
   필요하다(proposals의 B 위험 항목). 셔플이면 **행운수 고정 번호의 균등 취급이 자동 충족**된다.
2. **용지 반영은 확인 후 (B)**: `번호 뽑기` 클릭 시 전 게임을 도메인으로 즉시 확정하되
   `pendingDraw`(전 게임 + 게임 A 공개 순서)로 보관하고, 오버레이 결과 컷에서 `확인`을 눌렀을
   때만 `result`로 옮겨 용지에 반영한다. 건너뛰기는 연출만 건너뛰고 반영 경로는 동일하다.
   번호는 클릭 시점에 확정되므로 건너뛰기 여부와 무관하게 결과가 같다(spec 요구 3).
3. **reduced-motion은 JS 분기**: 클릭 처리에서 `window.matchMedia('(prefers-reduced-motion: reduce)')`를
   읽어, reduce면 오버레이를 아예 열지 않고 즉시 `result` 반영(현재와 동일 동작). CSS만으로
   처리하면 오버레이가 잠깐 뜨는 회귀가 생긴다(proposals B 지적).
4. **오버레이 상태 머신**: `DrawOverlay`는 phase를 React state로 명시한다 —
   `mixing`(공 섞임 가속) → `revealing`(revealedCount 0→6, setTimeout 체인) → `result`(결과 컷).
   effect cleanup에서 타이머를 전부 해제한다(StrictMode 재실행·건너뛰기에서 유령 전이 방지).
   `건너뛰기`는 타이머 정리 후 즉시 `result`로 점프. 연출 중에는 `건너뛰기`만, 결과 컷에서는
   `확인`만 조작 가능하다.
5. **연속뽑기 ×2~×5**: 게임 A만 연출(공개 순서도 A만 생성). `확인` 시 A~E 전 게임이 용지에
   반영된다. 연출 시간은 ×1과 동일.
6. **라이브러리 0**: CSS keyframes + setTimeout으로 충분. 물리 엔진·rAF 루프·차트류 미도입(YAGNI).

## 접근성·입력 차단

- 오버레이는 `role="dialog"` `aria-modal="true"`, 열릴 때 오버레이 안(건너뛰기 버튼)으로 focus
  이동, 닫힐 때 뽑기 버튼으로 focus 복귀. 키보드로 뒤 화면을 조작할 수 없어야 한다.
- 배경 앱 루트에 `inert` 적용 + body 스크롤 잠금(열림/닫힘에서 해제 보장).
- 공개되는 번호는 `aria-live="polite"`로 읽힌다.
- 뽑기 재클릭은 오버레이가 떠 있는 동안 구조적으로 불가(풀스크린 + inert).

## 비주얼 (기존 토큰 재사용)

- 무대: fixed 풀스크린, 어두운 딤 + 기존 무대 글로우 토큰. 중앙에 `LottoMachine` 확대 variant
  (prop 또는 CSS modifier — 기존 정적 머신 스타일을 건드리지 않는 별도 클래스).
- 섞임: mixing phase에서 기존 orbit 애니메이션 가속 클래스.
- 공개: 출구 캡에서 공이 pop-in으로 트레이에 순차 정렬(뽑힌 순서 그대로, 정렬 안 함).
  공은 기존 `.ball` 구간색(z1~z5) 규칙.
- 결과 컷: 오름차순 정렬된 공 6개 + `확인` 버튼. 문구는 중립("뽑힌 번호", "결과 확인" 등 —
  "확률/보장" 계열 금지 규칙 유지).
- 연출 길이: ×1 기준 시작~결과 컷 약 6초(타이밍 상수로 모아 조정 가능하게 —
  2026-07-03 사용자 피드백으로 8~12초에서 단축, spec 변경 이력 참조).
- 모바일 폭: 머신·트레이·버튼이 겹치지 않게 축소 규칙을 둔다(구현 중 실기기 폭 점검).

## 테스트 전략

- `revealSequence` 순수 함수: 순열 불변식(같은 집합·길이 6·중복 없음), 결정적 RNG(주입) 검증.
- `DrawOverlay`: vitest fake timers로 phase 전이(mixing→revealing→result), 건너뛰기 즉시 전이,
  타이머 cleanup(언마운트 후 전이 없음) 테스트.
- App 흐름: 확인 전 용지 미반영 → 확인 후 반영, 건너뛰기와 완주의 결과 동일,
  reduced-motion 시 오버레이 없이 즉시 반영, ×1/×5 경계.
- 기존 도메인 테스트는 무변경 그대로 통과해야 한다(도메인 무변경의 증거).

## 위험과 완화

- 타이머 cleanup 누락 → 유령 전이: cleanup을 effect 반환으로 강제하고 테스트로 고정.
- pending 상태 추가로 상태 흐름 복잡화: pending→result 이동 경로를 `확인` 한 곳으로 단일화.
- 오버레이 뒤 배경 노출(스크린리더·키보드): `inert` + focus 이동을 완료 조건처럼 취급.
- 모바일 폭에서 확대 머신 겹침: 구현 후 좁은 폭 점검을 plan 체크박스로 명시(WP-010 교훈).

## 구현 및 검증 순서 (plan의 WP 후보)

1. `revealSequence` 순수 함수 + 테스트.
2. `DrawOverlay` 상태 머신 + 건너뛰기/확인 + 타이머 cleanup + 테스트(fake timers).
3. `App` 연결: pendingDraw, reduced-motion 분기, 확인 시 반영, inert·focus·스크롤 잠금.
4. 비주얼: 오버레이 무대·머신 확대·트레이·결과 컷 CSS + 모바일 폭 점검.
5. 금지 표현 grep + 로컬 게이트(lint·typecheck·test·build) → verify → codex-review.
