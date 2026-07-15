# C안: Weekend Pick Studio

- 작성일: 2026-07-15
- 상태: Confirmed
- 선택 상태: Final — 사용자 확정 (2026-07-15)
- 기준 spec: `docs/specs/mobile-draw-stage-ui.md` (Approved, Standard)
- 선택 기록: A안 `951d629`, B안 `a793c2f`와 비교 후 C안 확정

## 구조

```text
desktop
  notice → compact header
  → [editorial story + latest draw | generator desk + result]
  → prize brief → number archive → source

mobile
  notice → compact header
  → story → latest draw → generator → result
  → prize brief → number archive → source
```

## 핵심 결정

- A/B의 단일 카드 흐름과 구별되도록 desktop 첫 화면을 좌우 studio layout으로 바꾼다.
- 왼쪽 navy editorial panel은 브랜드·최신 회차·신뢰 고지를 맡고, 오른쪽 white panel은 생성 작업만 맡는다.
- mobile DOM 순서는 `소개 → 최신 회차 → 생성`으로 유지해 읽기·키보드 순서를 자연스럽게 보존한다.
- UI font는 Pretendard, 로또 이름·공·결과는 기존 Jua를 재사용한다. 새 asset·dependency·외부 요청은 추가하지 않는다.
- CTA는 gold, 현재 선택은 cobalt로 구분하고 text·`aria-pressed`를 함께 유지한다.
- 과거 빈도는 재미용 참고 정보이며 예측·당첨 보장이 아니라는 문구를 hero 안에도 가깝게 둔다.

## 장점

- desktop에서 브랜드 설명과 실제 작업이 동시에 보여 C안의 차별점이 분명하다.
- mobile에서는 장식이 생성 제어를 밀어내지 않도록 intro와 latest draw를 압축한다.
- 기존 생성·사운드·오버레이·데이터·출처 component를 그대로 재사용해 회귀 범위를 UI로 제한한다.

## 위험

- split layout이 768~980px에서 좁아질 수 있다. 820px 이하에서는 한 열로 전환한다.
- hero 안의 최신 번호가 좁은 폭에서 넘칠 수 있다. mobile ball을 31px로 줄이되 조작 대상이 아니므로 44px target 제약은 적용하지 않는다.
- 결과가 생성 panel의 높이를 늘리므로 좌측 panel도 함께 늘어난다. 정보 소실은 없지만 긴 결과 상태의 균형을 실제 render로 확인한다.

## 구현 및 검증 순서

1. `App.tsx`에 studio hero와 section label을 추가하고 기존 handler/component 계약을 그대로 연결한다.
2. `app-content--studio` 아래에만 C안 token·desktop split·mobile single-column 스타일을 추가한다.
3. lint, typecheck, test, build를 실행한다.
4. A/B/C desktop과 C mobile을 같은 production preview 조건에서 렌더해 overflow·위계·CTA 도달성을 확인한다.
