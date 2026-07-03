# Plan: 추첨 애니메이션 (화면 전환 + 공 하나씩 공개)

확정 spec/design 이후 구현 작업을 추적하는 계획 문서다.
**진행 상태의 단일 기준은 이 파일의 체크박스다** — 채팅이 아니라 여기서 상태를 읽는다.
각 작업은 독립적으로 완료·검증할 수 있는 Work Package(WP)로 쪼갠다.

## 상태

- 상태: Active
- 변경 등급: Standard
- 작성일: 2026-07-03
- 작성자: chmg7626-blip

## 기준 문서

- PROJECT.md: PROJECT.md
- spec: docs/specs/draw-animation.md (Approved 2026-07-03)
- design: docs/design/draw-animation.md (확정 — 절충안: A 셔플·도메인 무변경 + B 확인 후 반영·focus)
- research/proposals: docs/design/draw-animation-proposals.md. research 없음

## 실행 전 확인

- 현재 브랜치: feature/draw-animation (main 아님)
- main 직접 작업 아님: 예
- 작업트리 상태: 설계 확정 커밋 2e600c1 완료. 미추적 .agents/·.codex/·dgp4d.jpg는 이 작업과 무관(커밋에 넣지 않음)
- 사용자 승인: spec Approved 확인됨 (2026-07-03)
- CI 상태: 직전 통과 (PR #1, main 병합 717011b)
- 미결정 사항: 없음
- 커밋 단위: 의미 단위 — ① 로직(WP-001~003: 셔플·오버레이 상태 머신·App 연결) ② 비주얼(WP-004)
  ③ 검토·수정 루프는 별도 커밋. 구현 커밋은 설계 확정 커밋과 분리(이미 분리됨).

## Work Packages

WP 하나는 따로 완료·검증할 수 있는 크기로 잡는다. 끝나면 체크박스와 상태를 함께 갱신한다.
순서: 순수 함수 → 오버레이 로직 → App 연결 → 비주얼 → 최종 검증.

- [x] WP-001: revealSequence 순수 함수 + 테스트
  - 목적: 확정된 본번호 6개(오름차순)로 연출용 공개 순서를 만드는 순수 함수. 도메인 무변경의 뼈대.
  - 변경 파일: src/components/drawReveal.ts, src/components/drawReveal.test.ts
  - 완료 조건: spec "번호 불변"(공개 순서·정렬 결과가 순수 함수로 검증 가능) — 같은 집합·길이 6·
    중복 없음 순열, 기존 Rng 주입 계약으로 결정적.
  - 검증: `npm test` — 순열 불변식(입력 집합=출력 집합), 결정적 RNG, 기존 도메인 테스트 무변경 통과.
  - 위험: 낮음 (피셔-예이츠 + RNG 주입은 기존 패턴).
  - 상태: done (2026-07-03). revealSequence(피셔-예이츠, 입력 불변) + 테스트 3개(순열 불변식
    500회·입력 무변경·결정적 RNG) 통과.

- [x] WP-002: DrawOverlay 상태 머신 + 건너뛰기/확인 + 타이머 cleanup
  - 목적: phase(mixing→revealing 0→6→result)를 setTimeout 체인으로 진행하는 오버레이 컴포넌트
    (이 WP는 로직·최소 마크업, 비주얼은 WP-004).
  - 변경 파일: src/components/DrawOverlay.tsx, src/components/DrawOverlay.test.tsx
  - 완료 조건: spec "연출 흐름"(순차 공개·결과 컷·확인 닫기) + "건너뛰기"(즉시 결과 컷, 번호 동일).
    연출 중 조작은 건너뛰기만, 결과 컷은 확인만.
  - 검증: `npm test` — vitest fake timers로 phase 전이, 건너뛰기 즉시 전이, 언마운트 후 전이 없음
    (cleanup), 공개 순서가 props대로.
  - 위험: StrictMode effect 재실행·건너뛰기에서 타이머 누수 → cleanup을 테스트로 고정(design 위험 절).
  - 상태: done (2026-07-03). phase 상태 머신 + 상태 변화당 타이머 1개 예약·cleanup 해제,
    focus 이동(열림→건너뛰기, 결과 컷→확인, 닫힘→복귀). 테스트 5개(react act + createRoot,
    fake timers — 초기 상태·순차 공개·결과 컷/확인·건너뛰기·언마운트 타이머 0) 통과.
    새 테스트 라이브러리 미도입(기존 react-dom + React.act로 해결).

- [x] WP-003: App 연결 — pendingDraw·reduced-motion 분기·확인 시 반영·inert/focus
  - 목적: 클릭 시 전 게임 확정 후 pendingDraw 보관, 확인 시에만 용지 반영. reduced-motion이면
    오버레이 없이 즉시 반영. 배경 inert·스크롤 잠금·focus 이동/복귀.
  - 변경 파일: src/App.tsx, src/components/GeneratorPanel.tsx(필요 시 props), App 흐름 테스트
  - 완료 조건: spec "연출 흐름"(닫히면 용지에 결과) + "건너뛰기·연속뽑기"(×2~×5 게임 A만 연출,
    닫힌 뒤 A~E 채움, 재클릭 차단) + "접근성"(reduced-motion 즉시 반영).
  - 검증: `npm test` — 확인 전 용지 미반영/확인 후 반영, 건너뛰기=완주 결과 동일, reduced-motion
    분기(matchMedia mock), ×1/×5 경계. dev 서버에서 실제 흐름 확인.
  - 위험: 오버레이 뒤 배경 노출(키보드·스크린리더) → inert+focus를 완료 조건으로 취급.
    matchMedia는 jsdom에 없음 → mock 필요.
  - 상태: done (2026-07-03). pendingDraw→확인 시 setResult, prefersReducedMotion() JS 분기,
    app-content inert+body 스크롤 잠금(effect cleanup 복원). GeneratorPanel 변경 불필요.
    테스트 3개(오버레이 중 용지 미반영·차단 → 확인 후 동일 번호 반영 / reduced-motion 즉시 반영 /
    ×5 게임 A만 연출 후 5게임 반영) 통과. dev 서버 실흐름 확인(브라우저).

- [x] WP-004: 비주얼 — 오버레이 무대·머신 확대·트레이·결과 컷 CSS + 모바일 폭
  - 목적: 어두운 딤+글로우 무대, LottoMachine 오버레이 variant(확대·섞임 가속, 기존 정적 머신
    스타일 무변경), 출구 pop-in 트레이, 결과 컷. ×1 기준 연출 8~12초(타이밍 상수로 모음).
  - 변경 파일: src/styles.css, src/components/LottoMachine.tsx(variant prop), DrawOverlay.tsx(마크업 보강)
  - 완료 조건: spec "연출 흐름"(구간색 z1~z5 규칙) + 요구사항 10(연출 길이). 히어로의 기존 정적
    추첨기 모습이 변하지 않는다(회귀 없음).
  - 검증: dev 서버 육안 확인(공 색·순차 공개·결과 컷), 좁은 폭(≤480px)에서 머신·트레이·버튼
    겹침 없음(WP-010 교훈 — body max-width 주입 방식 참고), `npm run build` 통과.
  - 위험: 머신 확대 시 공 궤도가 구 밖으로 잘림 → 기존 안전 반경 규칙 유지. 모바일 폭 겹침.
  - 상태: done (2026-07-03). LottoMachine은 코드 무변경(CSS `.draw-stage` 하위 선택자만 —
    scale(1.15) origin bottom·mball 가속 !important). 육안 확인: 딤 무대·가속 섞임·pop-in
    트레이(뽑힌 순서)·결과 컷(오름차순·구간색)·확인 후 용지 일치. 발견·수정: 확대가 레이아웃
    박스를 넘어 트레이와 겹침 → transform-origin: center bottom으로 위로만 확대.
    **미확인**: ≤480px 뷰포트 MQ 실검증(브라우저 resize가 뷰포트를 못 줄임 — 기존 교훈)과
    reduced-motion 실브라우저 동작(jsdom 테스트로만 검증). build 통과.

- [x] WP-005: 최종 검증 — 금지 표현 grep + 로컬 게이트 + spec 완료 조건 전수
  - 목적: 전체가 spec을 달성했는지 검증하고 완료 보고 준비.
  - 변경 파일: (없음 — 검증. 발견 시 수정 커밋)
  - 완료 조건: spec 완료 조건 전 항목(연출 흐름·번호 불변·건너뛰기·연속뽑기·접근성·표현·품질 게이트).
  - 검증: 금지 표현 grep(당첨 확률/보장 류), `npm run lint && npm run typecheck && npm test &&
npm run build`, verify 스킬 체크리스트, dev 서버 최종 흐름 확인.
  - 위험: 낮음.
  - 상태: done (2026-07-03). 금지 표현 grep 매칭은 면책 문구뿐(정상). lint·typecheck·
    test 29개·build 전부 통과. dev 서버 최종 흐름 확인. 남은 최종 검증 항목은
    Codex 독립 검토·CI·사람 확인(아래 "최종 검증").

## 실패 루프

막히면 어디서 다시 시작할지 (development-workflow.md "실패·수정 루프" 참조):

- 검증 실패: 원인 격리 → debug 스킬
- Codex 리뷰 지적: 로직·계약·보안 변경이면 수정 후 재검토, 설정·포맷이면 CI 재실행
- CI 실패: 별도 수정 커밋으로 처리
- spec 변경 필요: spec부터 고치고 사람이 재승인 → 필요하면 재설계

## 롤백 계획 (High-Risk 필수, 그 외 선택)

- 되돌리는 방법: 구현 커밋 revert (도메인·데이터 무변경이라 코드 revert로 충분)
- 데이터 백업·복구: 해당 없음 (localStorage·서버 미사용)
- 롤백 후 확인: 기존 MVP 흐름(클릭→용지 즉시 채움)과 테스트 18개 통과

## 최종 검증

모든 WP가 done이면 전체가 목표를 달성했는지 따로 확인한다:

- [ ] spec 완료 조건 충족
- [ ] 테스트 (정상·오류·경계값)
- [ ] lint/typecheck
- [ ] Codex 독립 검토 (Standard·High-Risk)
- [ ] CI 통과
- [ ] 사람 최종 확인 → main 병합

## 변경 기록

- 2026-07-03: plan 작성 (확정 design의 구현 순서 5단계를 WP-001~005로 옮김).
- 2026-07-03: WP-001~005 구현·검증 완료. 계획 대비 변경: LottoMachine variant prop 불필요
  (CSS 하위 선택자로 충분), 컴포넌트 테스트는 새 라이브러리 없이 React.act로 작성.
