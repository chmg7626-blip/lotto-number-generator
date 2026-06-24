# 로또번호생성기

## 작업 시작 시

- **먼저 `PROJECT.md`를 확인한다.** 프로젝트 정체성·현재 상태·진행 중 챌린지의 단일 요약판이다.
- 역할 분리: **행동 규칙은 이 CLAUDE.md, 프로젝트 상태는 PROJECT.md.** 같은 내용을 두 곳에 중복하지 않는다.
- 중요한 결정·단계 변경·다음 할 일이 바뀌면 PROJECT.md(현재 상태·최근 결정·다음 할 일) 갱신을 제안한다.
  PROJECT.md에는 긴 로그가 아니라 요약 상태만 둔다.

## 프로젝트 개요

- 무엇을 만드는가: 과거 당첨 데이터 기반 통계와 여러 생성 모드를 갖춘 정적 웹 로또번호 생성기
- 왜 만드는가: 클릭 한 번에 번호 생성 + 과거 통계 구경(예측 아님·재미용), 본인의 React·하네스 워크플로우 학습. 공개 배포해 피드백 수집.
- spec: docs/specs/ (brainstorm 결과물 — 완료 조건) / 설계: docs/design/ (독립 설계 비교 + 확정) / 조사: docs/research/

## 기술 스택

- 언어/런타임: Node.js (LTS), React 18 + Vite + **TypeScript**
- 주요 라이브러리: React, Vitest(테스트). 차트는 1차엔 미도입(CSS 막대로 충분 — YAGNI)
- 데이터/저장소: 과거 당첨번호는 정적 JSON 파일 동반, 사용자 저장 번호는 브라우저 localStorage. 서버·DB 없음.

## 자주 쓰는 명령어

- 실행(개발): npm run dev
- 빌드: npm run build
- 미리보기: npm run preview
- 테스트: npm test
- 타입체크: npm run typecheck (tsc --noEmit — Vite build는 타입체크를 하지 않음)
- 린트: npm run lint
- 의존성 설치: npm install

## 폴더 구조

```
src/domain/    순수 로직(생성·빈도·가중) + 단위 테스트
src/storage/   localStorage 캡슐화
src/data/      정적 당첨번호 JSON
src/components/ UI 컴포넌트
docs/          spec·설계·계획·조사 문서
```

(확정 설계: docs/design/lotto-mvp.md)

## 프로젝트 규칙

공통 규칙(~/.claude/CLAUDE.md)은 자동 적용된다. 여기에는 **이 프로젝트에서만 다른 것**만 적는다.

- 사행성 소재다. "당첨 보장", "당첨 확률을 높인다" 같은 표현을 코드·UI·문구 어디에도 넣지 않는다.
- 빈도 통계와 빈도가중 생성은 확률적 근거가 없는 **재미 요소**다. UI에 예측이 아님(면책)을 명시한다.
- 번호 생성 로직(중복 없음·범위 1~45·개수)은 반드시 단위 테스트로 검증한다.

## 개발 워크플로우

이 프로젝트는 spec 기반 워크플로우를 사용한다. 기본 작업 공간은 Antigravity IDE다.
**공통 원칙의 단일 원본은 ~/.claude/rules/development-workflow.md** 이고(특히 "Git 생명주기와
체크포인트" 절), 아래는 이 프로젝트의 구체적 실행 순서다. 둘이 충돌하면 공통 원칙이 우선한다
(같은 규칙을 두 곳에 중복해서 적지 않는다).

0. 저장소 준비: 빈/비-Git 폴더면 `git init` → 기본 브랜치 `main` → main에서 초기 템플릿 커밋 →
   첫 `feature/<작업명>` 브랜치 생성. 이미 Git 저장소면 다시 init하지 않고 기존 이력·브랜치·remote를
   건드리지 않는다. **이후 모든 작업(아래 전부)은 feature 브랜치에서 한다.**
1. 사람이 요구사항과 위험등급을 결정한다.
2. Claude Code: brainstorm으로 요구사항을 구체화해 spec 초안(docs/specs/<작업명>.md, 상태 Draft)을
   만든다 (\_template.md 복사 — 완료 조건과 위험등급을 적는다). 이 단계에서 구현 방법은 확정하지 않는다.
3. 외부 조사·자문이 필요한지 판단한다(선택). 필요하면 사용자가 외부에서 직접 실행한다 —
   출처 기반 사실 조사와 아이디어·반대 의견 자문으로 나눈다. 출처 기반 조사는 출처·결론을 확인한
   결과만 Claude Code가 docs/research/<주제>.md 에 기록한다. 검증 전 의견은 검증 전에는 근거로
   쓰지 않고, research에 남길 때 "검증 전 의견"으로 표시한다. (Claude·Codex는 자동 실행하지 않는다.)
4. 독립 설계: Claude Code가 설계안 A를 작성하되 **Codex 실행 전까지 파일·Git에 기록하지 않는다.**
   codex-independent-design 스킬로 Codex 설계안 B를 호출한다 (입력: spec + research 경로만 — Claude의
   설계안·대화는 전달하지 않는다). B가 나온 뒤 A/B 원문을 proposals.md에 함께 저장한다.
5. 두 설계안을 docs/design/<주제>-proposals.md 에 나란히 정리해 사용자에게 제시한다.
   사람이 방향(Claude / Codex / 절충안 / 재설계)을 결정한다. 결정 전에는 구현하지 않는다.
   (결정 전 Draft spec·proposals 커밋은 선택사항.)
6. 설계 확정 체크포인트: 결정을 proposals.md에 기록, 확정 설계를 docs/design/<주제>.md 에,
   바뀐 완료 조건·범위를 spec에 반영하고 사람이 spec을 Approved로 바꾼다. 승인 전에는 plan·구현으로
   넘어가지 않는다. **Standard·High-Risk는 이 문서들만 별도 커밋하고(구현 코드 미포함) 구현을 시작한다.
   Fast는 문서와 구현을 한 커밋에 담을 수 있다.**
7. (필요 시) feature 브랜치를 push해 draft PR을 연다 — push·PR은 사용자 승인 게이트다(main 직접 push 금지).
8. 구현 체크포인트: Claude Code가 Approved spec·확정 설계 기준으로 계획(`docs/plans/<작업>.md`,
   `docs/plans/_template.md` 복사) 작성 → 구현 → 테스트 작성 → 로컬 검사. 각 작업은 `WP-001` 형식의
   Work Package로 쪼개고, **진행 상태의 단일 기준은 이 plan 파일의 체크박스다**(Standard·High-Risk는
   plan을 남긴다 / Fast는 짧은 체크리스트로 대신 가능). **구현 코드와 테스트를 함께 커밋하고,
   Standard·High-Risk는 설계 확정 커밋과 분리한다.**
9. Codex 구현 독립 검토 — Claude가 codex-review 스킬로 직접 호출한다 (입력: Approved spec·확정 design·
   기준 브랜치 대비 diff, 규칙은 AGENTS.md. 테스트 통과는 로컬 검사·CI가 보장하고 Codex 입력이 아니다).
   문제가 나오면 Claude가 **별도 수정 커밋**으로
   고치고, 로직·공개 계약·데이터 모델·보안 동작 변경이면 Codex가 재검토한다(포맷팅·주석·단순 CI 설정만이면 CI 재실행만).
10. push → CI(lint·typecheck·test·build) 통과 → PR을 ready for review로 전환.
    GitHub에 Codex 연동을 켜뒀으면 PR에서도 자동 검토된다 (수동 요청은 PR 코멘트에 `@codex review`).
11. 사람이 최종 검토 후 main에 병합한다.

### 위험등급 — spec 초안에서 초기 등급(+이유), spec에서 최종 확정. 미지정이면 Standard.

사람이 정한다. 하향은 물론 유지·상향도 사람이 최종 확인하며, AI가 임의로 등급을 낮춰 부르지 않는다.

- **Fast**: 오타·문서·주석·동작에 영향 없는 스타일 변경. Codex 독립 설계와 구현 검토를 생략할 수 있다.
- **Standard**: 일반 기능, 버그 수정, API·UI 동작 변경. 전체 워크플로우 적용.
- **High-Risk**: 인증·권한, 결제, 개인정보, 데이터 삭제·마이그레이션, 배포 인프라.
  설계 단계의 두 독립 설계안 비교가 필수다. 구현 후에는 Codex가 독립 테스트 사례를 제안하고,
  Claude가 그 테스트를 작성한 뒤 Codex가 재검토한다 (Codex는 읽기 전용이라 직접 추가하지 않는다).
  롤백 계획은 docs/plans/ 에 남긴다.

### 실패 루프

- Codex 지적·CI 실패는 Claude가 수정한다.
- 수정이 로직을 건드리면 Codex 재검토를 다시 거치고, 설정·포맷팅 수준이면 CI 재실행만 한다.

## 현재 상태 (선택)

진행 상태의 단일 기준은 docs/plans 체크박스다(GitHub PR·이슈도 함께 추적한다). 이 섹션은 선택이며,
짧은 메모가 필요할 때만 쓴다. 여러 컴퓨터에서 작업하면 커밋이 충돌할 수 있어 강제하지 않는다.

- 메모: (현재 상태는 PROJECT.md에서 관리. 필요할 때만 짧게 추가)
