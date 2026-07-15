# 모바일 기본 웹 UI 설계 (확정)

- 확정일: 2026-07-15
- 기준 spec: docs/specs/mobile-draw-stage-ui.md
- 출처: docs/design/mobile-draw-stage-ui-proposals.md 의 사용자 결정 (Codex 설계안)

## 구조

```text
app-content
├─ pagebg (저강도 배경 장식)
├─ DisclaimerBanner
├─ header.site-header
│  ├─ logo
│  └─ home-sound-toggle
├─ main
│  ├─ section.intro (짧은 안내)
│  ├─ WinningBar (최신 당첨번호)
│  ├─ GeneratorPanel
│  │  ├─ 생성 모드
│  │  ├─ 행운수 번호판 (fixed일 때만)
│  │  ├─ 게임 수와 번호 뽑기
│  │  └─ Ticket (결과가 있을 때만)
│  ├─ 당첨금액
│  └─ 출현 통계
└─ SourceNotice
```

- `App.tsx`가 사이트 header/main과 소개 영역을 렌더한다. 생성·소리·오버레이 상태는 기존 `App`에 남긴다.
- `GeneratorPanel.tsx`는 번호 생성 제어와 결과만 렌더한다. 모드, 횟수, 고정 번호 상태 및 `chip`, `cnt`, `drawbtn` 계약을 유지한다.
- 정적 장식 `LottoMachine`은 일반 화면에서 제거한다. 실제 추첨 연출은 `DrawOverlay`가 담당하므로 생성·사운드·결과 확정 동작에 영향을 주지 않는다.
- `WinningBar`, `NumberPad`, `Ticket`은 로직을 바꾸지 않고 CSS와 필요한 마크업만 보완한다.

## 핵심 결정

1. **기본 웹 구조 우선:** 헤더·소개·최신 당첨정보·생성·결과·정보 섹션을 순서대로 배치한다. 장식보다 생성 행동과 결과 확인을 우선한다.
2. **로또는 포인트로 유지:** 남색은 배경, 금색은 CTA/선택 상태, 번호 공은 최신 결과와 생성 결과의 강조에만 쓴다. 정적 무대 장식은 제거한다.
3. **작은 화면 기준 반응형:** 320px에서 헤더는 flex로 줄바꿈하고, 최신 당첨번호·결과 공은 줄바꿈 가능하게 한다. 모드칩은 안전한 열 수로, 번호판과 통계는 5열로 줄인다.
4. **동작 계약 불변:** `행운수 고정` 0~5개 제한, `×1~×5`, 빈 데이터 폴백, 오버레이 확인 전 결과 미반영, reduced-motion, 소리 저장과 focus/inert 계약을 그대로 유지한다.
5. **의존성 추가 없음:** React, CSS, 현재 테스트/브라우저만 사용한다. 새 디자인 시스템·이미지·브라우저 자동화 의존성을 추가하지 않는다.

## 위험과 대응

| 위험 | 대응 |
| --- | --- |
| 상단 JSX 이동으로 소리 토글/첫 클릭 BGM 흐름이 달라짐 | `.home-sound-toggle` 이벤트와 `App`의 document capture listener를 보존하고 기존 사운드 테스트를 실행한다. |
| 실제 뷰포트에서 CSS 잘림이 남음 | 320px, 390px, 768px, 1280px에서 수평 스크롤·겹침·잘림을 브라우저로 확인한다. |
| 결과 카드 공 또는 복사 버튼이 좁은 폭에서 넘침 | `Ticket` 관련 기존 CSS에 줄바꿈/폭 제한을 두고 결과 생성 후 확인한다. |
| 공개 배포를 서두르다 되돌리기 비용이 생김 | UI 소스와 테스트만 별도 커밋으로 만들고, 공개 갱신은 검증과 사람의 별도 승인 뒤에만 한다. |

## 구현 및 검증 순서

1. `App.tsx`에 header/main/소개를 배치하고 `GeneratorPanel`을 생성·결과 책임으로 좁힌다. 기존 추첨과 사운드 테스트를 실행한다.
2. `styles.css`를 섹션/카드 기반으로 정리하고 320px·390px 반응형 규칙을 추가한다.
3. 최신 당첨번호, 번호판, 결과 용지, 통계 그리드의 좁은 폭 규칙을 보완한다.
4. 필요한 DOM/접근성 회귀 테스트를 보강하고 lint·typecheck·test·build를 실행한다.
5. 로컬 브라우저에서 네 개 폭, reduced-motion, fixed mode, ×5, 사운드 토글을 확인한다.
6. Standard 검증과 독립 리뷰 준비 상태를 확인한다. 실제 공개 배포는 별도 승인으로 둔다.
