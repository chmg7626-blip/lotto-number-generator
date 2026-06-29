import { describe, it, expect } from 'vitest'
import type { Draw, FrequencyEntry, GeneratedNumbers } from './types'
import {
  calculateFrequencies,
  generateRandom,
  generateWeighted,
  type Rng,
} from './lotto'

// 항상 같은 값을 돌려주는 RNG는 인덱스 0을 계속 고르게 해 결정적 결과를 만든다.
function constantRng(value: number): Rng {
  return () => value
}

function assertValidResult(result: GeneratedNumbers) {
  expect(result.numbers).toHaveLength(6)
  for (const n of result.numbers) {
    expect(n).toBeGreaterThanOrEqual(1)
    expect(n).toBeLessThanOrEqual(45)
  }
  expect(new Set(result.numbers).size).toBe(6)
}

describe('generateRandom', () => {
  it('본번호 6개·1~45 범위·중복 없음 (보너스 없음, 1000회 반복)', () => {
    for (let i = 0; i < 1000; i++) {
      assertValidResult(generateRandom())
    }
  })

  it('본번호를 오름차순으로 정렬해 돌려준다', () => {
    const { numbers } = generateRandom()
    const sorted = [...numbers].sort((a, b) => a - b)
    expect(numbers).toEqual(sorted)
  })

  it('RNG를 주입하면 결정적이다 (항상 0 → 가장 작은 번호부터)', () => {
    const result = generateRandom(constantRng(0))
    expect(result.numbers).toEqual([1, 2, 3, 4, 5, 6])
  })
})

describe('calculateFrequencies', () => {
  it('항상 1~45 전체를 number 오름차순(길이 45)으로 돌려준다', () => {
    const entries = calculateFrequencies([])
    expect(entries).toHaveLength(45)
    expect(entries.map((e) => e.number)).toEqual(
      Array.from({ length: 45 }, (_, i) => i + 1),
    )
  })

  it('빈 데이터(0건)에서는 모든 count가 0이다 (경계값)', () => {
    const entries = calculateFrequencies([])
    expect(entries.every((e) => e.count === 0)).toBe(true)
  })

  it('알려진 데이터의 출현 횟수를 정확히 센다 (보너스 제외)', () => {
    const draws: Draw[] = [
      { round: 1, numbers: [1, 2, 3, 4, 5, 6], bonus: 7 },
      { round: 2, numbers: [1, 2, 3, 10, 20, 30], bonus: 1 },
      { round: 3, numbers: [1, 45, 44, 43, 42, 41], bonus: 2 },
    ]
    const byNumber = new Map(
      calculateFrequencies(draws).map((e) => [e.number, e.count]),
    )

    expect(byNumber.get(1)).toBe(3)
    expect(byNumber.get(2)).toBe(2)
    expect(byNumber.get(3)).toBe(2)
    expect(byNumber.get(4)).toBe(1)
    expect(byNumber.get(45)).toBe(1)
    // 보너스로만 등장한 7은 집계되지 않는다.
    expect(byNumber.get(7)).toBe(0)
    // 어디에도 안 나온 번호는 0.
    expect(byNumber.get(9)).toBe(0)
  })
})

// counts 맵으로 1~45 빈도 배열을 만든다(지정 안 한 번호는 0).
function freqWith(counts: Record<number, number>): FrequencyEntry[] {
  const entries: FrequencyEntry[] = []
  for (let n = 1; n <= 45; n++) {
    entries.push({ number: n, count: counts[n] ?? 0 })
  }
  return entries
}

// 결과들에서 특정 번호가 본번호로 등장한 비율.
function appearanceRate(results: GeneratedNumbers[], target: number): number {
  const hits = results.filter((r) => r.numbers.includes(target)).length
  return hits / results.length
}

describe('generateWeighted', () => {
  it('자주/드물게 모두 6개 불변식을 동일하게 만족한다 (각 500회)', () => {
    const freq = freqWith({ 1: 10, 7: 5, 20: 3, 45: 1 })
    for (let i = 0; i < 500; i++) {
      assertValidResult(generateWeighted('frequent', freq))
      assertValidResult(generateWeighted('rare', freq))
    }
  })

  it('데이터가 없으면(누적 0건) 순수 랜덤으로 폴백한다', () => {
    const empty = freqWith({})
    const weighted = generateWeighted('frequent', empty, constantRng(0))
    const random = generateRandom(constantRng(0))
    expect(weighted).toEqual(random)
    expect(weighted.numbers).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('자주 모드는 출현 많은 번호를, 드물게 모드는 적은 번호를 선호한다', () => {
    // 45만 압도적으로 많이 나온 데이터.
    const freq = freqWith({ 45: 1000 })
    const runs = 500
    const frequent = Array.from({ length: runs }, () =>
      generateWeighted('frequent', freq),
    )
    const rare = Array.from({ length: runs }, () =>
      generateWeighted('rare', freq),
    )

    // 자주 모드에서는 45가 거의 항상, 드물게 모드에서는 드물게 등장한다(보수적 여유).
    expect(appearanceRate(frequent, 45)).toBeGreaterThan(0.7)
    expect(appearanceRate(rare, 45)).toBeLessThan(0.3)
  })
})
