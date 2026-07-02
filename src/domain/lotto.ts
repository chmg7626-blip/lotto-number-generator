import type { Draw, FrequencyEntry, GeneratedNumbers } from './types'

export const MIN_NUMBER = 1
export const MAX_NUMBER = 45
export const MAIN_COUNT = 6

// 테스트에서 고정 난수를 주입할 수 있게 RNG를 받는다. 계약은 Math.random과 같은 [0, 1).
export type Rng = () => number

function fullPool(): number[] {
  const pool: number[] = []
  for (let n = MIN_NUMBER; n <= MAX_NUMBER; n++) pool.push(n)
  return pool
}

// 풀에서 count개를 비복원 추출한다(보너스 없음 — 2026-06-29 결정).
// 비복원이라 중복은 구조적으로 발생하지 않는다(별도 보정 불필요). pool은 호출자가 소유한다.
function drawFromPool(pool: number[], count: number, rng: Rng): number[] {
  const numbers: number[] = []
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(rng() * pool.length)
    numbers.push(pool.splice(idx, 1)[0])
  }
  return numbers
}

// 1~45 중복 없는 본번호 6개 (순수 랜덤).
export function generateRandom(rng: Rng = Math.random): GeneratedNumbers {
  const numbers = drawFromPool(fullPool(), MAIN_COUNT, rng)
  numbers.sort((a, b) => a - b)
  return { numbers }
}

// 행운수 고정: 고정 번호(0~5개)를 그대로 포함하고 나머지 자리를 비복원 랜덤으로 채운다.
// 고정이 0개면 generateRandom과 동일하다. 확률에 영향 없는 재미 요소다(예측 아님).
// fixed는 UI 번호판이 1~45·중복 없음·최대 5개로 막지만, 도메인도 시스템 경계로 방어한다:
// 범위 밖·중복을 거르고 최대 5개(MAIN_COUNT-1)로 잘라 랜덤 자리가 항상 최소 1개 남게 한다.
export function generateWithFixed(
  fixed: number[],
  rng: Rng = Math.random,
): GeneratedNumbers {
  const sanitized: number[] = []
  for (const n of fixed) {
    if (sanitized.length >= MAIN_COUNT - 1) break
    if (n >= MIN_NUMBER && n <= MAX_NUMBER && !sanitized.includes(n)) {
      sanitized.push(n)
    }
  }

  const fixedSet = new Set(sanitized)
  const pool = fullPool().filter((n) => !fixedSet.has(n))
  const filled = drawFromPool(pool, MAIN_COUNT - sanitized.length, rng)

  const numbers = [...sanitized, ...filled]
  numbers.sort((a, b) => a - b)
  return { numbers }
}

// 당첨 데이터에서 1~45 각 번호의 누적 출현 횟수를 센다.
// 보너스는 제외하고 본번호(numbers)만 집계한다. 데이터는 외부 JSON이라 범위 밖 값은 무시한다.
// 데이터가 비어 있어도 1~45 전체를 count 0으로 항상 돌려준다.
export function calculateFrequencies(draws: Draw[]): FrequencyEntry[] {
  const counts = new Array<number>(MAX_NUMBER + 1).fill(0)
  for (const draw of draws) {
    for (const n of draw.numbers) {
      if (n >= MIN_NUMBER && n <= MAX_NUMBER) counts[n]++
    }
  }

  const entries: FrequencyEntry[] = []
  for (let n = MIN_NUMBER; n <= MAX_NUMBER; n++) {
    entries.push({ number: n, count: counts[n] })
  }
  return entries
}

type Candidate = { number: number; weight: number }

// 가중치에 비례해 후보 하나를 고르고 후보 목록에서 제거한다(비복원). 모든 weight는 1 이상이라
// 총합이 항상 양수이고 모든 번호가 도달 가능하다 → 본번호 6개 불변식이 깨지지 않는다.
function pickWeighted(candidates: Candidate[], rng: Rng): number {
  const total = candidates.reduce((sum, c) => sum + c.weight, 0)
  let threshold = rng() * total
  for (let i = 0; i < candidates.length; i++) {
    threshold -= candidates[i].weight
    if (threshold < 0) return candidates.splice(i, 1)[0].number
  }
  // 부동소수점 잔차로 끝까지 못 고른 경우(rng()≈total) 마지막 후보.
  return candidates.splice(candidates.length - 1, 1)[0].number
}

// "역대 단골 번호": 과거 출현 빈도로 가중해 생성한다. 자주 나온 번호일수록 가중(count+1).
// 데이터가 없으면(누적 0건) 순수 랜덤으로 폴백한다. 확률적 근거 없는 재미 요소다(예측 아님).
export function generateWeighted(
  frequencies: FrequencyEntry[],
  rng: Rng = Math.random,
): GeneratedNumbers {
  const totalCount = frequencies.reduce((sum, e) => sum + e.count, 0)
  if (totalCount === 0) return generateRandom(rng)

  const candidates: Candidate[] = frequencies.map((e) => ({
    number: e.number,
    weight: e.count + 1,
  }))

  const numbers: number[] = []
  for (let i = 0; i < MAIN_COUNT; i++) {
    numbers.push(pickWeighted(candidates, rng))
  }

  numbers.sort((a, b) => a - b)
  return { numbers }
}
