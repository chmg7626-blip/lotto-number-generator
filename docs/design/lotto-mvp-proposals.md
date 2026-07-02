# 로또번호생성기 1차 MVP — 독립 설계안 비교

- 작성일: 2026-06-24
- 기준 spec: docs/specs/lotto-mvp.md
- 참고 research: 없음
- 상태: 결정됨

Claude Code와 Codex가 같은 spec만 보고 서로 독립적으로 작성한 두 설계안이다.
두 안이 모두 나오기 전에는 서로의 설계안을 공유하지 않았다 (독립성). 사용자가 방향을 결정한다.

## Claude Code 설계안 (A)

- **구조**:
  - `src/lib/` (순수 로직, React·DOM 무관)
    - `generator.js`: 순수 랜덤 생성 + 빈도가중 생성 (RNG 주입 가능)
    - `stats.js`: 빈도 계산
    - `storage.js`: localStorage 래퍼
  - `src/data/draws.json`: 정적 당첨번호 (샘플 → 실데이터 교체). 형식 `[{round, date, numbers:[6], bonus}]`
  - `src/components/`: `DisclaimerBanner`, `Generator`(모드선택+뽑기+결과카드), `Frequency`, `SavedList`
  - `src/App.jsx`, `src/main.jsx`
  - 단위 테스트는 lib 옆에 colocated (`*.test.js`, Vitest)
  - 데이터 흐름: `draws.json → stats 계산 → 통계 UI + 가중 생성 입력`. 저장 시에만 localStorage.
- **핵심 결정**:
  1. 순수 로직을 React에서 완전히 분리 → DOM 없이 생성 불변식·빈도 계산 단위 테스트(완료조건 핵심).
  2. 빈도가중 생성에 **RNG를 주입 가능하게** 설계 → 시드 고정으로 자주/드물게 가중을 결정적으로 테스트.
  3. 가중은 출현 횟수 기반 역가중(자주=횟수 비례, 드물게=역비례), 비복원 추출로 중복 방지.
  4. 보너스: 본번호 6개 후 남은 39개에서 1개.
  5. 상태관리는 useState만 (Redux 등 미도입, YAGNI). 차트는 CSS 막대.
  6. 언어는 **JavaScript** (spec·CLAUDE.md의 확정 스택).
- **장점**: 로직/뷰 분리로 테스트 직접 충족 / 의존성 최소 / 데이터 교체가 import 한 곳 / 정적 빌드 즉시 배포.
- **위험**: 가중 함수 정의가 모호하면 테스트 곤란(→ RNG 주입+명확 정의) / localStorage 파싱·용량 오류 / GitHub Pages base 경로 / 비복원 가중 구현 버그(→ 불변식 테스트).
- **구현 및 검증 순서**: Vite+React 초기화·도구 설정 → generator(랜덤)+테스트 → stats+테스트 → generator(가중)+테스트 → storage+테스트 → 컴포넌트(배너→생성→통계→저장) → 샘플 draws.json → lint·test·build → verify.

## Codex 설계안 (B)

- **구조**:
  - `src/domain/lotto.ts`: 순수 랜덤 생성, 빈도가중 생성, 불변식 검증, 빈도 계산 (UI·localStorage 무관 순수 함수)
  - `src/data/draws.sample.json`: 고정 스키마. 예 `{ "draws": [{ "round":1, "numbers":[1..6], "bonus":7 }] }`
  - `src/storage/savedResults.ts`: localStorage 읽기/저장/개별삭제/전체삭제 캡슐화. 파싱 실패 시 빈 목록 복구.
  - `src/components/`: `DisclaimerBanner`, `GeneratorPanel`, `FrequencyTable`, `SavedResults`
  - `src/App.tsx`: JSON 로드·빈도 계산·생성 결과·저장 목록 상태 조합
  - `src/domain/*.test.ts`: 생성·빈도·가중·빈 데이터 경계값 단위 테스트
  - 데이터 흐름: `draws.sample.json → calculateFrequencies → UI + weighted generator 입력`. 저장 시에만 localStorage.
- **핵심 결정**:
  1. 생성·통계 로직을 UI에서 분리 (불변식·계산 정확도가 완료조건 핵심).
  2. 가중 생성은 **비복원 가중 추출** — 뽑힌 번호는 후보에서 제거(별도 중복 보정 불필요).
  3. "자주" 가중치 = `count + 1` (0회 번호도 배제 안 함).
  4. "드물게" 가중치 = `maxCount - count + 1` (최다 번호도 0 안 됨, 모든 번호 후보 유지).
  5. 빈 데이터면 가중 생성을 **순수 랜덤으로 폴백**(비활성 아님) + "데이터 없음, 랜덤 동작" 표시.
  6. 빈도 통계는 1~45 전체 항상 렌더, 데이터 없어도 count 0 + "데이터 없음" 메시지.
  7. 저장 데이터 최소 필드 `{ id, createdAt, mode, numbers, bonus }`. id는 `crypto.randomUUID()` 우선 + timestamp fallback.
  8. 차트 라이브러리 미사용 (CSS 막대).
  - 언어는 **TypeScript** 전제 (.ts/.tsx).
- **장점**: 테스트 대상 명확 / 데이터 교체 쉬움 / 면책·안내 문구를 별도 컴포넌트로 고정해 사행성 표현 누락 방지 / MVP 범위 작음.
- **위험**: 실데이터 출처·약관 미검증(초기엔 샘플만, 배포 전 research 기록 필수) / "빈도가중"이 확률 향상 오해 가능(문구 반복 노출) / 가중 테스트 무작위성 불안정(난수 주입+보수적 허용오차) / localStorage 손상 시 UI 붕괴(저장소 경계에서 빈 목록 복구).
- **구현 및 검증 순서**: React+Vite+**TS**+테스트 스캐폴딩 → domain/lotto 순수함수 → 단위 테스트(6개/범위/중복/보너스/빈도/빈 데이터 count 0/가중 불변식/빈 데이터 랜덤 폴백) → 샘플 JSON+App 연결 → UI(배너→랜덤→가중→빈도+막대→데이터 없음→저장/삭제/비우기) → localStorage 연결 → 표현 검토(금지 표현 부재 확인) → lint·test·build.

## 핵심 차이

| 항목           | Claude Code (A)                           | Codex (B)                                           |
| -------------- | ----------------------------------------- | --------------------------------------------------- |
| 언어           | **JavaScript** (확정 스택 준수)           | **TypeScript** (.ts/.tsx)                           |
| 폴더 구조      | `src/lib/` 한 곳(generator·stats·storage) | `src/domain/`·`src/storage/` 분리                   |
| 가중치 공식    | 역가중 개념만(미확정)                     | **명시**: 자주=`count+1`, 드물게=`maxCount-count+1` |
| 빈 데이터 가중 | 폴백/비활성 택1 미정                      | **순수 랜덤 폴백** 확정 + 안내 표시                 |
| 빈 데이터 통계 | "데이터 없음" 표시                        | 1~45 전체 count 0 렌더 + "데이터 없음" 메시지       |
| 저장 id        | (미명시)                                  | `crypto.randomUUID()` + timestamp fallback          |
| 중복 방지      | 비복원 추출                               | 비복원 가중 추출 (동일 취지)                        |

## 각 도구의 추천

- Claude Code 추천: 구조·테스트 전략은 두 안이 사실상 동일. **언어는 JavaScript 유지**를 권한다 — spec·CLAUDE.md에서 이미 JS로 확정했고, 1차 MVP 규모에 TS 타입 설계는 학습 부담만 키운다(YAGNI). 단 Codex가 명시한 **가중치 공식(count+1 / maxCount-count+1)과 빈 데이터 랜덤 폴백, id fallback**은 A에 그대로 흡수할 가치가 있다.
- Codex 추천: TypeScript 전제로 도메인 로직을 `src/domain/`에 두고, 가중치·폴백·id 생성을 명시적으로 결정한 안.

## 사용자 결정

- 선택: Codex (TypeScript 기반)
- 선택 이유: 실무 React의 사실상 표준인 TypeScript를 처음부터 익히려는 학습 목적. 타입으로 데이터 스키마(Draw·SavedResult)를 명시하는 것이 "데이터 형식 고정" 요구사항과도 잘 맞는다. 초기 셋업·타입 학습 부담은 감수.
- 추가 지시:
  - 언어는 TypeScript로 확정. spec·CLAUDE.md의 스택 기록을 TS로 갱신하고, CI에 typecheck 단계를 추가한다.
  - 빈도가중 생성은 RNG(난수 함수)를 주입 가능하게 설계해 시드 고정으로 가중을 결정적으로 테스트한다(두 안 공통 전략을 명시).
  - 가중치 공식(자주=count+1, 드물게=maxCount-count+1), 빈 데이터 시 순수 랜덤 폴백 + "데이터 없음" 표시, 저장 id는 crypto.randomUUID() + timestamp fallback을 채택한다.
  - 폴더 구조는 Codex 안(src/domain·src/storage·src/components) 채택.
