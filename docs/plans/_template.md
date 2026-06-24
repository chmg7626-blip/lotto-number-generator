# Plan: {{TASK_NAME}}

확정 spec/design 이후 구현 작업을 추적하는 계획 문서다.
**진행 상태의 단일 기준은 이 파일의 체크박스다** — 채팅이 아니라 여기서 상태를 읽는다.
각 작업은 독립적으로 완료·검증할 수 있는 Work Package(WP)로 쪼갠다.

## 상태
- 상태: {{Draft | Active | Done | Superseded}}
- 변경 등급: {{Fast | Standard | High-Risk}} ← spec에서 확정한 등급
- 작성일: {{YYYY-MM-DD}}
- 작성자: {{이름}}

## 기준 문서
- PROJECT.md: {{현재 상태판 경로 — 보통 PROJECT.md}}
- spec: docs/specs/{{작업명}}.md (Approved)
- design: docs/design/{{주제}}.md (확정)
- research/proposals: {{docs/research/<주제>.md / docs/design/<주제>-proposals.md / 없음}}

## 실행 전 확인
- 현재 브랜치: {{feature/<작업명> — main 아님}}
- main 직접 작업 아님: {{예}}
- 작업트리 상태: {{clean / 의도한 변경만}}
- 사용자 승인: {{spec Approved 확인됨}}
- CI 상태: {{직전 통과 / 해당 없음}}
- 미결정 사항: {{없으면 "없음" — 있으면 먼저 해소한다}}

## Work Packages
WP 하나는 따로 완료·검증할 수 있는 크기로 잡는다. 끝나면 체크박스와 상태를 함께 갱신한다.

- [ ] WP-001: {{작업명}}
  - 목적: {{이 WP가 무엇을 끝내는가}}
  - 변경 파일: {{대상 파일/모듈}}
  - 완료 조건: {{무엇이 되면 끝인가 — spec 완료 조건과 연결}}
  - 검증: {{실행 명령과 기대 결과}}
  - 위험: {{꼬일 수 있는 지점 / 없으면 "낮음"}}
  - 상태: {{pending | in_progress | done | blocked}}

- [ ] WP-002: {{작업명}}
  - 목적:
  - 변경 파일:
  - 완료 조건:
  - 검증:
  - 위험:
  - 상태: {{pending | in_progress | done | blocked}}

## 실패 루프
막히면 어디서 다시 시작할지 (development-workflow.md "실패·수정 루프" 참조):
- 검증 실패: {{원인 격리 → debug 스킬}}
- Codex 리뷰 지적: {{로직·계약·보안 변경이면 수정 후 재검토, 설정·포맷이면 CI 재실행}}
- CI 실패: {{별도 수정 커밋으로 처리}}
- spec 변경 필요: {{spec부터 고치고 사람이 재승인 → 필요하면 재설계}}

## 롤백 계획 (High-Risk 필수, 그 외 선택)
배포·데이터·보안 변경이 잘못됐을 때 되돌리는 절차 (development-workflow.md 위험등급 참조):
- 되돌리는 방법: {{예: 직전 커밋으로 revert / 마이그레이션 down}}
- 데이터 백업·복구: {{예: 변경 전 스냅샷 위치·복구 절차}}
- 롤백 후 확인: {{정상 동작 확인 방법}}

## 최종 검증
모든 WP가 done이면 전체가 목표를 달성했는지 따로 확인한다:
- [ ] spec 완료 조건 충족
- [ ] 테스트 (정상·오류·경계값)
- [ ] lint/typecheck
- [ ] Codex 독립 검토 (Standard·High-Risk)
- [ ] CI 통과
- [ ] 사람 최종 확인 → main 병합

## 변경 기록
- {{YYYY-MM-DD}}: {{무엇을 / 왜}}
