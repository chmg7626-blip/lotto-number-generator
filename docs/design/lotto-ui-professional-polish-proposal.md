# Lucky Desk — 전문형 UI polish 제안

- 작성일: 2026-07-15
- 상태: Proposal — 사용자 방향 확인 전 구현하지 않음
- 기준 spec: `docs/specs/mobile-draw-stage-ui.md` (Approved)
- 기준 구현: A안 `951d629`, B안 `a793c2f`
- 조사 근거: `docs/research/lotto-ui-trust-patterns.md`

## Creative Direction

- 감정: 차분한 신뢰 70% + 추첨을 누르는 기대감 30%
- 정보 밀도: 중간 — 첫 화면에서 최신 번호와 생성 CTA를 모두 보되 설명은 한 번만 노출
- 움직임: 낮음 — 일반 화면은 정적, 기존 추첨 오버레이만 표현적
- 레이아웃: 익숙한 단일 흐름 — 모바일과 데스크톱 모두 `브리핑 → 생성 → 결과 → 정보`
- 언어 톤: 기능적·친근함 — 당첨 암시, 예측 암시, 과도한 행운 문구 금지

## 구조

```text
Disclaimer strip
Header: logo · sound
Hero summary
  ├─ draw schedule · Lotto 6/45 · one-line description
  └─ latest result strip · source cue
Generator desk
  ├─ mode segmented control
  ├─ fixed-number pad (conditional)
  ├─ game count
  └─ single gold CTA
Result ticket (conditional, adjacent)
Supporting data
  ├─ prize summary
  └─ frequency lab
Source / unofficial notice
```

## 핵심 결정

1. **B안을 기반으로 한다.** 밝은 종이 표면과 남색 잉크는 도구 신뢰감이 높고 모바일에서 생성 행동을 빠르게 찾을 수 있다. A안의 남색 무대감은 hero와 결과 strip에만 약 20% 되살린다.
2. **Jua 사용 범위를 줄인다.** 본문·헤더·섹션 제목·버튼은 Pretendard 700~800로 통일하고, `6/45`, 번호 공, 추첨 결과처럼 기억성을 만드는 요소에만 Jua를 남긴다.
3. **표면은 세 종류만 사용한다.** page canvas `#F4F1E8`, paper `#FFFCF5`, ink/navy `#112E57`로 제한한다. 금색 `#E6AD2E`은 CTA·선택 ring·작은 section marker에만 쓴다.
4. **Generator desk를 고유한 티켓 도구로 만든다.** 현재 금색 상단선은 유지하되 과한 shadow를 줄이고, 좌우의 작은 registration notch와 얇은 perforation rule을 CSS pseudo-element로 표현한다. 새 이미지나 아이콘 dependency는 추가하지 않는다.
5. **선택 상태를 더 전문적으로 만든다.** mode와 game count는 남색 fill + 2px inner border + 굵은 텍스트를 함께 사용한다. 고정번호 공은 색상 ring 외에 `aria-pressed`, 2px ink outline, 작은 check marker 중 하나를 함께 사용한다.
6. **결과는 가장 감정적인 표면으로 둔다.** 결과 티켓의 paper texture·구간색 공은 유지하고, `이번에 뽑은 번호` heading과 `행운수 고정 · 3게임` metadata 사이의 대비를 높인다. 각 `복사` 버튼은 최소 44px tap target을 확보한다.
7. **보조 데이터는 생성과 시각적으로 분리한다.** 당첨금액은 warm paper, 출현 통계는 옅은 blue-gray 또는 navy-tint surface로 구분해 긴 페이지에서 section 전환이 보이게 한다. 정보 의미와 순서는 바꾸지 않는다.
8. **흥미는 장식 수가 아니라 대비 순간으로 만든다.** 첫 화면의 강한 대비는 최신 결과 strip, gold CTA, 실제 결과 공 세 곳으로 제한한다. 별·neon·glass card 중첩·새 장식 motion은 추가하지 않는다.

## 실제 렌더에서 확인한 근거

- 390×844에서 A/B 모두 수평 overflow가 없었다.
- A안은 CTA가 309×52px이고 generator card 하단이 약 799px에 위치했다. 브랜드 기억성은 강하지만 어두운 surface가 hero·최신 결과·생성 card에서 반복된다.
- B안은 CTA가 293×54px이고 generator card 하단이 약 764px에 위치했다. 생성 흐름은 더 압축됐지만 현재 밝은 회색·cream surface가 길게 이어져 고유한 기억점이 약하다.
- B안 고정번호 버튼은 44×44px이며 7·21·44 선택, ×3 생성, 3게임 결과 ticket까지 390px에서 overflow 없이 렌더됐다.
- 기존 추첨 overlay는 결과 공과 gold confirm CTA만 강하게 보여 일반 화면보다 충분히 표현적이다. 새 일반 화면 motion은 필요하지 않다.

## 파일별 최소 변경 경계

- `src/App.tsx`
  - `intro`와 `WinningBar`를 묶는 `hero-summary` wrapper를 추가한다.
  - 두 정보 section에 `wrap--prize`, `wrap--stats` modifier만 추가한다.
  - 생성·sound·overlay state와 handler는 변경하지 않는다.
- `src/styles.css`
  - 기존 `.app-content--desk` override를 위 token과 typography 기준으로 정리한다. 세 번째 variant override를 누적하지 않는다.
  - 320/390px은 단일 열, 768/1280px은 최대 1024px 폭을 유지한다.
  - `prefers-reduced-motion`, focus-visible, 44px target 계약을 보존한다.
- `src/components/WinningBar.tsx`
  - 기존 회차·본번호·보너스 DOM은 유지하고 짧은 source cue를 추가할지 검토한다. 추가한다면 `동행복권 공개 데이터 기준`처럼 사실 범위만 표현한다.
- `src/components/GeneratorPanel.tsx`
  - 동작은 바꾸지 않고 선택 요약과 CTA 주변의 hierarchy용 class만 추가한다.
- `src/components/Ticket.tsx`
  - 결과 metadata와 copy control의 class/배치만 보완한다. 번호와 copy 값은 바꾸지 않는다.
- 관련 테스트
  - 기존 accessible name, `aria-pressed`, disabled, overlay-before-result, ×5, fixed 0~5 계약을 약화하지 않는다.

## 장점

- B안의 즉시 사용성과 전문성을 유지하면서 A안의 기억성을 제한된 영역에 회수한다.
- 새 asset·dependency·API 없이 기존 CSS와 component boundary로 구현할 수 있다.
- 어두운 도박/방송 화면이나 지나치게 무난한 금융 양식 어느 쪽에도 치우치지 않는다.
- 결과·출처·비공식 고지를 약화하지 않아 신뢰와 안전 경계를 유지한다.

## 위험

- typography 변경이 Jua 기반의 기존 브랜드 인상을 지나치게 약화할 수 있다. `6/45`와 번호 공에는 Jua를 남겨 회귀를 줄인다.
- hero wrapper 추가가 desktop spacing과 mobile source order에 영향을 줄 수 있다. DOM 읽기 순서는 `intro → WinningBar`로 유지한다.
- 티켓 pseudo-element가 320px에서 content width를 침범할 수 있다. 장식은 `pointer-events:none`과 card 내부 8px 이내로 제한한다.
- 보조 데이터 section의 색 분리가 새 카드 중첩처럼 보일 수 있다. section background는 하나만 사용하고 내부 shadow는 제거한다.

## 구현 및 검증 순서

1. typography·color·surface token만 적용해 390px/1280px 첫 화면을 비교한다.
2. hero summary와 generator desk의 spacing을 조정하고 CTA가 첫 viewport 안에 남는지 확인한다.
3. fixed-number pad와 ×3 결과 ticket을 같은 데이터로 다시 렌더한다.
4. prize/stat section 분리를 적용하고 전체 페이지의 section rhythm을 확인한다.
5. 320·390·768·1280px overflow, 44px target, focus-visible, long Korean text를 확인한다.
6. 기존 lint·typecheck·test·build와 sound/overlay/reduced-motion 회귀 검증을 실행한다.
7. 같은 head SHA에서 Standard 독립 리뷰와 CI를 통과한 뒤에만 공개 반영을 별도 승인받는다.
