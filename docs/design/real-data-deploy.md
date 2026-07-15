# 실데이터 교체와 GitHub Pages 배포 설계 (확정)

## 2026-07-15 배포 연결 보정

`update-data.yml`은 번호와 당첨금을 갱신해 main에 commit한다. GitHub의 `GITHUB_TOKEN` 재귀 실행 제한 때문에 이 push에 의존하지 않고, `ci.yml`이 `workflow_run(workflows: [Update lotto data], types: [completed])`를 구독한다. 성공 결론일 때만 기존 check와 Pages deploy를 수행한다. checkout은 data workflow 시작 SHA가 아니라 완료 시점의 최신 default branch를 사용한다.

- 작성일: 2026-07-06
- 기준 spec: docs/specs/real-data-deploy.md
- 출처: docs/design/real-data-deploy-proposals.md 의 사용자 결정 (절충안)

독립 설계안 비교에서 사용자가 결정한 확정 설계다. plan·구현은 이 문서를 기준으로 한다.

## 구조

```
scripts/update-draws.mjs          # Node 내장 fetch — 새 의존성 0 (A)
src/data/draws.json               # 전 회차 당첨번호 (스크립트 생성물)
src/data/latestPrize.json         # 최신 회차 등수별 당첨금 (생성물, 당첨번호와 분리)
src/domain/drawsValidation.ts     # 스키마 검증 — 스크립트·앱 테스트 공용 (A)
.github/workflows/ci.yml          # 기존 확장: main push 시 검사 통과 후 deploy job (A)
.github/workflows/update-data.yml # 주간 크론 갱신 + diff allowlist (B)
vite.config.ts                    # base: '/lotto-number-generator/'
```

데이터 흐름: 동행복권 공식 회차 조회 JSON API → parse → normalize → **validate** → compare →
**atomic write**(B의 파이프라인) → 변경 시에만 봇 커밋 → CI 게이트 통과 후 Pages 배포.

## 핵심 결정

1. **취득은 동행복권 공식 회차별 당첨번호 페이지의 JSON API 단일 소스로 고정한다**
   (2026-07-06 WP-001 스파이크 후 사용자 승인으로 "엑셀 다운로드"에서 변경 — 같은 공식
   페이지의 동일 데이터, 파싱 코드 최소·새 의존성 0):
   `GET /lt645/selectPstLt645Info.do?srchStrLtEpsd=<시작>&srchEndLtEpsd=<끝>` —
   UTF-8 JSON, 인증·리퍼러 불요. 필드: `ltEpsd`(회차), `ltRflYmd`(YYYYMMDD),
   `tm1WnNo~tm6WnNo`, `bnsWnNo`, `rnk1~rnk5{WnNope,WnAmt}`. 응답이 이 형식을 벗어나면
   임의 우회 없이 spec 재논의로 돌아온다(B — 변경 통제). 오프라인 폴백(`--from-file`)은
   미리 만들지 않는다(사용자 지시 — YAGNI).
2. **증분 갱신(A) + compare·atomic write(B)**: 기존 draws.json의 최대 회차 이후만 요청해
   주간 실행의 요청 수를 최소화한다. 전체 재수집은 `--full` 옵션. 검증 통과 전에는 파일을
   건드리지 않고, 이미 최신이면 diff가 없다(멱등 — deterministic formatting).
3. **검증 모듈은 src/domain 공용(A) + 검증 항목은 B 기준**: 회차 1~최신 연속·본번호 6개
   중복 없음·1~45 범위·보너스 범위·최신 당첨금 구조, 그리고 **latestPrize.round ==
   draws 최신 round 명시 검증(B)**. 스크립트 실행 시 검증 실패 → 기존 파일 무변경·exit 1.
   같은 모듈을 Vitest가 실제 draws.json에 대해 실행한다.
4. **봇 커밋은 main 직접 + diff allowlist(B)**: update-data.yml이 `contents: write`로
   커밋하되, 변경 파일이 생성 데이터(draws.json·latestPrize.json)뿐인지 워크플로우에서
   검사하고 그 외 변경이 있으면 실패시킨다. 크론은 **토 15:30 UTC(일 00:30 KST) +
   workflow_dispatch**(B). 새 회차 없으면 커밋 없음, 실패는 워크플로우 실패로 드러난다.
5. **배포는 ci.yml 확장 단일 파이프라인(A)**: main push 시 lint·typecheck·test·build 통과
   후 같은 워크플로우의 deploy job(actions/deploy-pages)이 실행 — "검사 통과 후 배포"를
   구조로 보장.
6. **출처 표기는 레코드 스키마를 깨지 않는 쪽 우선(B)**: draws.json 레코드 스키마는
   유지하고, 출처·확인일 메타는 별도 위치(데이터 README·앱 푸터 문구)에 둔다. 앱 화면에
   "당첨번호 출처: 동행복권 로또 6/45 회차별 당첨번호" + 비공식·재배포 허가 아님·권리자
   요청 시 삭제 수용 문구.
7. 당첨금은 같은 스크립트가 latestPrize.json으로 동시 갱신. PrizeTable에 금액 포맷
   유틸(+테스트)을 추가해 숫자 데이터(prizePerGame·winnerCount)를 표시 문자열로 변환.

## 위험과 대응

- **취득 URL·응답 형식**: WP-001 스파이크로 확인 완료(가능 판정 — 1231회·1회 데이터
  실값 대조, 회차 구멍 0). 단, 비공개 내부 API라 예고 없이 바뀔 수 있다 — 응답 형식
  변경 시 검증이 실패해 워크플로우가 명시적으로 실패한다(조용한 stale 방지). 데이터는
  기존 상태 유지.
- **봇 main 직접 커밋(운영 규칙 예외)**: diff allowlist + 사전 workflow_dispatch 테스트로
  범위를 데이터 파일로 제한. branch protection을 켜면 봇 예외 설정을 사용자에게 안내.
- **전체 회차 JSON 공개 재배포 리스크(사용자 감수)**: 출처·비공식·삭제 수용 문구로 완화.
  삭제하더라도 git 이력에 남는다는 점은 수용된 잔여 리스크로 기록
  (docs/research/lotto-draw-data.md).
- **크론 시각과 데이터 게시 시각 불일치**: 추첨(토 20:35 KST) 후 여유를 둔 일 00:30 KST
  실행 + 새 회차 없으면 무커밋이라 다음 주기에 자연 복구.

## 구현 및 검증 순서

1. WP-1 취득 스파이크: 직접 호출 URL·응답 형식 확인 → 가능/불가 판정
   (완료 — JSON API 가능 판정, 위 핵심 결정 1 참조).
2. WP-2 검증 모듈(src/domain/drawsValidation.ts)+단위 테스트(정상·오류·경계).
3. WP-3 갱신 스크립트(scripts/update-draws.mjs): 증분 fetch→parse→normalize→validate→
   compare→atomic write. fixture 기반 테스트(네트워크 없이).
4. WP-4 전체 데이터 생성·앱 교체: 샘플 import 제거, draws.json·latestPrize.json 사용,
   "샘플" 표기 제거, 출처·비공식 문구 추가, 금지어 테스트 통과 확인.
5. WP-5 vite base 설정 + ci.yml deploy job. 로컬 `npm run build && npm run preview`로
   하위 경로 자산(JS·CSS·오디오·데이터) 확인.
6. WP-6 update-data.yml(크론+dispatch+diff allowlist). workflow_dispatch로 사전 테스트.
7. 로컬 검사(lint·typecheck·test·build) → codex-review → push·CI → Pages URL 실확인.
