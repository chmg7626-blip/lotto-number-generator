# Plan: 실데이터 교체와 GitHub Pages 배포

확정 spec/design 이후 구현 작업을 추적하는 계획 문서다.
**진행 상태의 단일 기준은 이 파일의 체크박스다** — 채팅이 아니라 여기서 상태를 읽는다.
각 작업은 독립적으로 완료·검증할 수 있는 Work Package(WP)로 쪼갠다.

## 상태

- 상태: Active
- 변경 등급: Standard
- 작성일: 2026-07-06
- 작성자: Claude Code

## 기준 문서

- PROJECT.md: PROJECT.md
- spec: docs/specs/real-data-deploy.md (Approved 2026-07-06)
- design: docs/design/real-data-deploy.md (확정 — 절충안)
- research/proposals: docs/research/lotto-draw-data.md / docs/design/real-data-deploy-proposals.md

## 실행 전 확인

- 현재 브랜치: feature/real-data-deploy
- main 직접 작업 아님: 예
- 작업트리 상태: clean (미추적 dgp4d.jpg·.agents/·.codex/는 이 작업과 무관)
- 사용자 승인: spec Approved 확인됨 (2026-07-06)
- CI 상태: 직전 main 통과
- 미결정 사항: 없음 (단, WP-001 스파이크 결과가 "불가"면 spec 재논의로 복귀)

## Work Packages

WP 하나는 따로 완료·검증할 수 있는 크기로 잡는다. 끝나면 체크박스와 상태를 함께 갱신한다.

- [x] WP-001: 취득 스파이크 — 직접 호출 확인
  - 목적: 동행복권 회차별 당첨번호 엑셀 다운로드의 직접 호출 URL·응답 형식을 확인해
    스크립트화 가능/불가를 판정한다 (설계의 첫 관문).
  - 변경 파일: 없음 (판정 결과만 이 plan 변경 기록에 남김. 코드 산출물 없음)
  - 완료 조건: 요청 URL·파라미터·응답 형식(HTML/XLS/기타)·회차·번호·보너스·당첨금 필드
    위치가 문서화되고, 가능/불가 판정이 남는다. 불가면 이후 WP를 blocked로 두고 spec 재논의.
  - 검증: 스크래치에서 실제 응답 1건을 받아 최신 회차(1231) 데이터가 파싱 가능한지 확인.
  - 위험: 로그인·리퍼러 요구, 인코딩(EUC-KR) 문제. 확인 결과가 곧 판정.
  - 상태: done (가능 판정 — 변경 기록 2026-07-06 참조)

- [x] WP-002: 스키마 검증 모듈
  - 목적: draws·latestPrize 데이터의 공용 검증 로직 (스크립트·앱 테스트 공유).
  - 변경 파일: src/domain/drawsValidation.ts (신규), src/domain/drawsValidation.test.ts (신규)
  - 완료 조건: 회차 1~최신 연속·본번호 6개·중복 없음·1~45 범위·보너스 범위·당첨금 구조·
    latestPrize.round == draws 최신 round 검증. 위반 시 어떤 항목이 왜 실패했는지 반환.
  - 검증: `npm test` — 정상·오류(중복/범위 밖/회차 구멍/round 불일치)·경계(1회만·45 포함) 통과.
  - 위험: 낮음.
  - 상태: done (테스트 72개 통과·typecheck·lint 깨끗 — 2026-07-06)

- [x] WP-003: 갱신 스크립트
  - 목적: 증분 fetch→parse→normalize→validate→compare→atomic write 스크립트.
  - 변경 파일: scripts/update-draws.mjs (신규), scripts fixture 테스트 (신규),
    package.json (`data:update` 스크립트 추가)
  - 완료 조건: 로컬 실행 시 최신 회차까지 draws.json·latestPrize.json 갱신. 멱등(이미
    최신이면 파일 무변경). 취득·검증 실패 시 exit≠0 + 기존 파일 무손상. `--full` 재수집 옵션.
  - 검증: fixture 기반 단위 테스트(네트워크 없이) + 실제 1회 실행으로 파일 생성 확인,
    재실행 시 diff 없음 확인.
  - 위험: 응답 인코딩·형식 변형. WP-001 결과에 의존.
  - 상태: done (전 회차 1231건 생성·재실행 멱등 확인, fixture 테스트 7개.
    Node 타입 제거 실행이라 스크립트는 .ts, 검증 모듈 import는 .ts 확장자
    (tsconfig allowImportingTsExtensions 추가). 취득 실패 경로는 검증 후 쓰기 구조+단위
    테스트로 보장, 네트워크 오류 주입 테스트는 없음 — 2026-07-06)

- [x] WP-004: 전체 데이터 생성·앱 교체
  - 목적: 실데이터로 앱 전환 — 샘플 제거, 출처·비공식 문구 추가.
  - 변경 파일: src/data/draws.json·latestPrize.json (생성), src/data/draws.sample.json·
    prize.sample.ts (삭제), src/data/README.md, src/App.tsx, src/components/PrizeTable.tsx
    (+금액 포맷 유틸·테스트), 출처 문구 컴포넌트(푸터/면책 영역)
  - 완료 조건: spec 정상 조건 1~3·7 — 전 회차 포함·검증 테스트 통과, 샘플 import 제거,
    최신 회차 당첨번호·당첨금 실데이터 표시·"샘플" 표기 제거, 출처+비공식+삭제 수용 문구 노출.
  - 검증: `npm test`(검증 모듈이 실제 draws.json 검사, 금지어 테스트 포함), `npm run dev`
    실화면 확인.
  - 위험: 30→1231회차로 빈도 그리드·통계 성능/표시 변화 — 실화면에서 확인.
  - 상태: done (테스트 88개·typecheck·lint·build 통과. 출처 고지 SourceNotice 푸터 추가,
    당첨금 포맷 유틸 prizeFormat. 실화면 확인은 WP-005 preview에서 병행 — 2026-07-06)

- [x] WP-005: vite base + Pages 배포 파이프라인
  - 목적: 하위 경로 배포 설정과 "검사 통과 후 배포" 단일 파이프라인.
  - 변경 파일: vite.config.ts, .github/workflows/ci.yml (deploy job 추가)
  - 완료 조건: base `/lotto-number-generator/` 설정, main push 시 lint·typecheck·test·build
    통과 후에만 deploy job 실행(PR에서는 미실행). 오디오·데이터 경로 BASE_URL 기준 유지.
  - 검증: `npm run build && npm run preview`로 하위 경로 자산 로드 확인(로컬),
    워크플로우는 push 후 CI에서 확인(사용자 승인 게이트 뒤).
  - 위험: 절대 경로 참조 잔존 시 배포에서만 깨짐 — preview로 사전 확인.
  - 상태: done (dist의 JS·CSS·마스코트 이미지 경로에 base 적용 확인. preview 실화면에서
    1231회 띠·당첨금 1~5등·통계 1231회차·출처 고지 표시, 콘솔 오류 없음. 워크플로우
    실동작은 push 후 CI에서 확인 — 2026-07-06)

- [x] WP-006: 주간 자동 갱신 워크플로우
  - 목적: 토 15:30 UTC(일 00:30 KST) 크론 + workflow_dispatch로 데이터 갱신 봇 커밋.
  - 변경 파일: .github/workflows/update-data.yml (신규)
  - 완료 조건: 스크립트 실행 → 변경이 생성 데이터 파일뿐인지 diff allowlist 검사 → 데이터
    외 변경이면 실패, 새 회차 없으면 커밋 없이 성공, 새 회차 있으면 봇 커밋·push.
    실패는 워크플로우 실패로 표시.
  - 검증: push 후 workflow_dispatch 수동 실행으로 "변경 없음" 경로와 allowlist 동작 확인
    (사용자 승인 게이트 뒤).
  - 위험: 봇 main 직접 커밋은 운영 규칙 예외 — allowlist로 범위 제한. branch protection
    도입 시 봇 예외 필요(사용자 안내).
  - 상태: done (파일 작성 완료. 크론·dispatch·allowlist 실동작은 push 후
    workflow_dispatch로 확인 — 최종 검증 항목에 포함 — 2026-07-06)

## 실패 루프

막히면 어디서 다시 시작할지 (development-workflow.md "실패·수정 루프" 참조):

- 검증 실패: 원인 격리 → debug 스킬
- WP-001 불가 판정: WP-003 이후 blocked → spec "주간 자동 갱신" 재논의(사람 결정)
- Codex 리뷰 지적: 로직·계약·보안 변경이면 수정 후 재검토, 설정·포맷이면 CI 재실행
- CI 실패: 별도 수정 커밋으로 처리
- spec 변경 필요: spec부터 고치고 사람이 재승인 → 필요하면 재설계

## 롤백 계획 (선택)

- 되돌리는 방법: 배포·데이터 커밋 revert → CI 재실행으로 이전 상태 재배포
- 데이터 백업·복구: draws.json은 git 이력이 스냅샷 — 직전 커밋으로 복구
- 롤백 후 확인: Pages URL에서 이전 데이터로 정상 표시 확인

## 최종 검증

모든 WP가 done이면 전체가 목표를 달성했는지 따로 확인한다:

- [ ] spec 완료 조건 충족 (정상 7 + 오류·경계 6)
- [ ] 테스트 (정상·오류·경계값)
- [ ] lint/typecheck
- [ ] Codex 독립 검토 (Standard)
- [ ] CI 통과
- [ ] Pages URL 실확인 (JS·CSS·오디오·데이터 로드)
- [ ] 사람 최종 확인 → main 병합

## 변경 기록

- 2026-07-06: 최초 작성 (확정 설계 절충안 기준, WP-001~006)
- 2026-07-06: WP-001 done — 가능 판정. 취득 방법을 엑셀 다운로드에서 **공식 페이지의
  JSON API**로 변경(사용자 승인, design 핵심 결정 1 갱신).
  `GET https://www.dhlottery.co.kr/lt645/selectPstLt645Info.do?srchStrLtEpsd=1&srchEndLtEpsd=1231`
  → UTF-8 JSON 746KB, 전 회차 1건 호출 가능, 인증 불요. 필드: ltEpsd·ltRflYmd(YYYYMMDD)·
  tm1~tm6WnNo·bnsWnNo·rnk1~5{WnNope,WnAmt}. 검증: 1231회=조사 결과 일치,
  1회(2002-12-07)=실측 일치, 회차 구멍 0. 구 common.do API는 폐기(302→홈).
