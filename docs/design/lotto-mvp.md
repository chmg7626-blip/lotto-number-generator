# 로또번호생성기 1차 MVP 설계 (확정)

- 작성일: 2026-06-24
- 기준 spec: docs/specs/lotto-mvp.md
- 출처: docs/design/lotto-mvp-proposals.md 의 사용자 결정 (Codex, TypeScript 기반)

독립 설계안 비교에서 사용자가 결정한 확정 설계다. plan·구현은 이 문서를 기준으로 한다.
언어는 **TypeScript**로 확정했다(학습 목적 + 데이터 스키마 타입 명시).

## 구조

React + Vite + **TypeScript** 정적 웹앱. 순수 로직을 UI에서 분리한다.

```
src/
  domain/
    lotto.ts          순수 랜덤 생성, 빈도가중 생성, 불변식 검증, 빈도 계산 (UI·localStorage 무관)
    lotto.test.ts     생성·빈도·가중·빈 데이터 경계값 단위 테스트 (Vitest)
  storage/
    savedResults.ts   localStorage 읽기/저장/개별삭제/전체삭제 캡슐화. 파싱 실패 시 빈 목록 복구.
  data/
    draws.sample.json 고정 스키마의 정적 당첨 데이터 (샘플 → 실데이터 교체)
  components/
    DisclaimerBanner.tsx
    GeneratorPanel.tsx   모드 선택(순수/자주/드물게) + 뽑기 + 결과 카드
    FrequencyTable.tsx   번호별 출현 횟수 + CSS 막대
    SavedResults.tsx     저장 목록 + 개별 삭제 + 전체 비우기
  App.tsx              JSON 로드 · 빈도 계산 · 생성 결과 · 저장 목록 상태 조합
  main.tsx
```

**데이터 흐름**: `draws.sample.json → calculateFrequencies → 통계 UI 표시 + 가중 생성 입력`.
생성 결과는 사용자가 저장할 때만 localStorage에 들어간다.

**타입 (데이터 스키마 명시 — spec의 "데이터 형식 고정" 요구사항 충족)**:

```ts
type Draw = { round: number; date?: string; numbers: number[]; bonus: number };
type DrawsFile = { draws: Draw[] };
type GenerateMode = "random" | "frequent" | "rare";
type SavedResult = {
  id: string;
  createdAt: number;
  mode: GenerateMode;
  numbers: number[];
  bonus: number;
};
```

## 핵심 결정

1. **생성·통계 로직을 UI에서 완전히 분리** (`src/domain/lotto.ts`). 완료 조건의 핵심이 불변식과
   계산 정확도라 React 렌더링과 분리한 순수 함수 단위 테스트가 검증에 적합하다.
2. **빈도가중 생성에 RNG(난수 함수)를 주입 가능하게** 설계한다. 예: `generate(mode, freq, rng = Math.random)`.
   테스트에서 고정 난수를 주입해 "자주/드물게" 가중이 의도대로 동작하는지 결정적으로 검증한다.
3. **비복원 가중 추출**: 본번호 6개를 뽑을 때 뽑힌 번호는 후보에서 제거 → 중복 방지를 별도 보정 없이 보장.
4. **가중치 공식**: "자주" = `count + 1`(0회 번호도 배제 안 함), "드물게" = `maxCount - count + 1`(최다 번호도 0 안 됨).
5. **빈 데이터(0건) 시 가중 생성은 순수 랜덤으로 폴백**하고, UI에 "데이터 없음, 랜덤으로 동작" 상태를 표시한다.
6. **빈도 통계는 1~45 전체를 항상 렌더링**한다. 데이터가 없어도 각 count는 0으로 계산하고 "데이터 없음" 메시지를 함께 보여준다.
7. **저장 데이터 최소 필드** `{ id, createdAt, mode, numbers, bonus }`. id는 `crypto.randomUUID()` 우선, 미지원 환경은 timestamp 기반 fallback.
8. **보너스**: 본번호 6개를 뽑은 뒤 남은 39개에서 1개.
9. **상태관리는 useState만** (Redux 등 미도입, YAGNI). **차트 라이브러리 미사용**(CSS 막대).
10. **면책 배너와 가중 옵션 안내 문구는 별도 컴포넌트/고정 위치**로 두어 사행성 표현 누락을 막는다.

## 위험과 대응

- **실데이터 출처·이용약관 미검증**: 구현 초기엔 샘플 또는 사용자가 확인한 정적 JSON만 사용한다.
  공개 배포 전 `docs/research/`에 출처·이용 가능 여부가 기록돼야 한다. (배포 게이트)
- **"빈도가중"의 확률 향상 오해**: 버튼·결과 영역 근처에 "확률적 근거 없는 재미 요소", "통계는 예측 아님" 문구를 반복 노출한다.
- **가중 테스트의 무작위성 불안정**: 난수 함수를 주입해 고정 난수로 경계값을 검증한다. 분포 성향 테스트가 필요하면 반복 횟수·허용 오차를 보수적으로 둔다.
- **localStorage 손상 데이터로 UI 붕괴**: 저장소 경계(savedResults.ts)에서만 파싱 실패를 처리해 빈 목록으로 복구한다.
- **TypeScript 빌드 타입체크**: Vite build는 타입체크를 하지 않으므로 CI에 `tsc --noEmit`(typecheck) 단계를 별도로 둔다.
- **GitHub Pages base 경로**: 배포 시 vite `base` 설정이 필요하다(배포 단계에서 처리, 1차 코드 범위 밖).

## 구현 및 검증 순서

1. React + Vite + TypeScript + Vitest + ESLint/Prettier 스캐폴딩 (package-lock 생성 → CI 동작).
2. `src/domain/lotto.ts`: 순수 랜덤 생성, 빈도 계산, 가중 생성 함수 구현 (RNG 주입 시그니처).
3. 단위 테스트(`lotto.test.ts`):
   - 본번호 6개 / 1~45 범위 / 중복 없음
   - 보너스 1개 / 본번호와 중복 없음
   - 빈도 계산 정확성
   - 빈 데이터에서 1~45 count 0 처리
   - 가중 생성도 동일 불변식 만족
   - 빈 데이터 가중 생성은 랜덤 폴백
   - 고정 난수 주입 시 가중 방향(자주/드물게)이 의도대로 반영
4. `draws.sample.json` 추가 + `App`에서 빈도 계산 연결.
5. UI 구현: 면책 배너 → 순수 랜덤 생성 → 자주/드물게 가중 생성 → 빈도 숫자+CSS 막대 → 데이터 없음 상태 → 저장 목록/개별삭제/전체비우기.
6. `savedResults.ts` localStorage 모듈 + 저장 UI 연결.
7. 표현 검토: "당첨 확률을 높인다"·"당첨 보장"·예측처럼 보이는 문구가 코드·UI에 없는지 확인.
8. 완료 전 검증: `npm run lint` → `npm run typecheck` → `npm test` → `npm run build` (verify).
