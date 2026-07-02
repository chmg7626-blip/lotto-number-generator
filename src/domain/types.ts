// 데이터 스키마 (확정 설계 docs/design/lotto-mvp.md). 실데이터를 같은 형식으로 교체만 하면 되게 고정한다.

export type Draw = {
  round: number
  date?: string
  numbers: number[]
  bonus: number
}

export type DrawsFile = { draws: Draw[] }

// random=순수 랜덤, frequent="역대 단골 번호"(빈도 가중), fixed="행운수 고정"(번호 직접 입력)
export type GenerateMode = 'random' | 'frequent' | 'fixed'

// 생성 결과는 본번호 6개만 다룬다. 보너스는 생성하지 않는다(2026-06-29 결정).
// 과거 당첨 데이터(Draw)의 bonus는 실제 회차 정보라 별개로 유지한다.
export type GeneratedNumbers = {
  numbers: number[]
}

// 1~45 각 번호의 누적 출현 횟수. 항상 1~45 전체(길이 45)를 number 오름차순으로 담는다.
export type FrequencyEntry = {
  number: number
  count: number
}
