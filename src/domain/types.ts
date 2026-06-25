// 데이터 스키마 (확정 설계 docs/design/lotto-mvp.md). 실데이터를 같은 형식으로 교체만 하면 되게 고정한다.

export type Draw = {
  round: number
  date?: string
  numbers: number[]
  bonus: number
}

export type DrawsFile = { draws: Draw[] }

export type GenerateMode = 'random' | 'frequent' | 'rare'

export type GeneratedNumbers = {
  numbers: number[]
  bonus: number
}

// 1~45 각 번호의 누적 출현 횟수. 항상 1~45 전체(길이 45)를 number 오름차순으로 담는다.
export type FrequencyEntry = {
  number: number
  count: number
}

export type SavedResult = {
  id: string
  createdAt: number
  mode: GenerateMode
  numbers: number[]
  bonus: number
}
