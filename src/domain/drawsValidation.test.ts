import { describe, it, expect } from 'vitest'
import type { Draw, DrawsFile, LatestPrizeFile } from './types'
import { validateDraws, validateLatestPrize } from './drawsValidation.ts'

// 회차 round의 유효한 Draw를 만든다. 겹치지 않는 오름차순 본번호와 보너스를 결정적으로 채운다.
function makeDraw(round: number, overrides: Partial<Draw> = {}): Draw {
  return {
    round,
    date: '2026-07-04',
    numbers: [4, 13, 14, 18, 31, 38],
    bonus: 15,
    ...overrides,
  }
}

function makeFile(count: number): DrawsFile {
  const draws: Draw[] = []
  for (let round = 1; round <= count; round++) draws.push(makeDraw(round))
  return { draws }
}

function makePrize(overrides: Partial<LatestPrizeFile> = {}): LatestPrizeFile {
  return {
    round: 3,
    tiers: [
      { rank: 1, winners: 17, prizePerGame: 1652990074 },
      { rank: 2, winners: 92, prizePerGame: 50907303 },
      { rank: 3, winners: 3329, prizePerGame: 1406871 },
      { rank: 4, winners: 162821, prizePerGame: 50000 },
      { rank: 5, winners: 2686693, prizePerGame: 5000 },
    ],
    ...overrides,
  }
}

describe('validateDraws', () => {
  it('유효한 파일은 통과한다 (정상)', () => {
    const result = validateDraws(makeFile(3))
    expect(result.errors).toEqual([])
    expect(result.ok).toBe(true)
  })

  it('1회차 하나만 있어도 통과한다 (경계)', () => {
    expect(validateDraws(makeFile(1)).ok).toBe(true)
  })

  it('경계값 번호(1·45)를 허용한다 (경계)', () => {
    const file: DrawsFile = {
      draws: [makeDraw(1, { numbers: [1, 2, 3, 4, 5, 45], bonus: 44 })],
    }
    expect(validateDraws(file).ok).toBe(true)
  })

  it('date가 없어도 통과한다 (경계 — 스키마상 선택 필드)', () => {
    const file: DrawsFile = { draws: [makeDraw(1, { date: undefined })] }
    expect(validateDraws(file).ok).toBe(true)
  })

  it('빈 파일은 실패한다 (오류)', () => {
    const result = validateDraws({ draws: [] })
    expect(result.ok).toBe(false)
    expect(result.errors).toHaveLength(1)
  })

  it('첫 회차가 1이 아니면 실패한다 (오류)', () => {
    const file: DrawsFile = { draws: [makeDraw(2)] }
    const result = validateDraws(file)
    expect(result.ok).toBe(false)
    expect(result.errors[0]).toContain('첫 회차')
  })

  it('회차에 구멍이 있으면 실패한다 (오류)', () => {
    const file: DrawsFile = { draws: [makeDraw(1), makeDraw(3)] }
    const result = validateDraws(file)
    expect(result.ok).toBe(false)
    expect(result.errors[0]).toContain('연속이 아님')
  })

  it('본번호가 6개가 아니면 실패한다 (오류)', () => {
    const file: DrawsFile = {
      draws: [makeDraw(1, { numbers: [1, 2, 3, 4, 5] })],
    }
    expect(validateDraws(file).ok).toBe(false)
  })

  it('범위 밖 본번호(0·46)는 실패한다 (오류)', () => {
    for (const bad of [0, 46]) {
      const file: DrawsFile = {
        draws: [
          makeDraw(1, { numbers: [bad, 2, 3, 4, 5, 6].sort((a, b) => a - b) }),
        ],
      }
      expect(validateDraws(file).ok).toBe(false)
    }
  })

  it('본번호 중복은 실패한다 (오류)', () => {
    const file: DrawsFile = {
      draws: [makeDraw(1, { numbers: [4, 4, 14, 18, 31, 38] })],
    }
    const result = validateDraws(file)
    expect(result.ok).toBe(false)
    expect(result.errors.join()).toContain('중복')
  })

  it('본번호가 오름차순이 아니면 실패한다 (오류 — 결정적 포맷)', () => {
    const file: DrawsFile = {
      draws: [makeDraw(1, { numbers: [13, 4, 14, 18, 31, 38] })],
    }
    const result = validateDraws(file)
    expect(result.ok).toBe(false)
    expect(result.errors.join()).toContain('오름차순')
  })

  it('보너스가 범위 밖이거나 본번호와 겹치면 실패한다 (오류)', () => {
    expect(validateDraws({ draws: [makeDraw(1, { bonus: 0 })] }).ok).toBe(false)
    expect(validateDraws({ draws: [makeDraw(1, { bonus: 46 })] }).ok).toBe(
      false,
    )
    expect(validateDraws({ draws: [makeDraw(1, { bonus: 4 })] }).ok).toBe(false)
  })

  it('날짜 형식이 YYYY-MM-DD가 아니면 실패한다 (오류)', () => {
    const file: DrawsFile = { draws: [makeDraw(1, { date: '20260704' })] }
    expect(validateDraws(file).ok).toBe(false)
  })

  it('오류가 여러 개면 모두 모아 보고한다', () => {
    const file: DrawsFile = {
      draws: [makeDraw(2, { numbers: [4, 4, 14, 18, 31, 46], bonus: 0 })],
    }
    const result = validateDraws(file)
    expect(result.ok).toBe(false)
    expect(result.errors.length).toBeGreaterThanOrEqual(3)
  })
})

describe('validateLatestPrize', () => {
  it('유효한 당첨금 파일은 통과한다 (정상)', () => {
    const result = validateLatestPrize(makePrize(), 3)
    expect(result.errors).toEqual([])
    expect(result.ok).toBe(true)
  })

  it('당첨자 0명(이월 회차)을 허용한다 (경계)', () => {
    const prize = makePrize()
    prize.tiers[0] = { rank: 1, winners: 0, prizePerGame: 0 }
    expect(validateLatestPrize(prize, 3).ok).toBe(true)
  })

  it('회차가 당첨번호 최신 회차와 다르면 실패한다 (오류)', () => {
    const result = validateLatestPrize(makePrize({ round: 2 }), 3)
    expect(result.ok).toBe(false)
    expect(result.errors[0]).toContain('최신 회차')
  })

  it('등수가 1~5등 순서 그대로가 아니면 실패한다 (오류)', () => {
    const missing = makePrize()
    missing.tiers = missing.tiers.slice(0, 4)
    expect(validateLatestPrize(missing, 3).ok).toBe(false)

    const shuffled = makePrize()
    shuffled.tiers = [
      shuffled.tiers[1],
      shuffled.tiers[0],
      ...shuffled.tiers.slice(2),
    ]
    expect(validateLatestPrize(shuffled, 3).ok).toBe(false)
  })

  it('당첨 게임 수·당첨금이 음수거나 정수가 아니면 실패한다 (오류)', () => {
    const negative = makePrize()
    negative.tiers[4] = { rank: 5, winners: -1, prizePerGame: 5000 }
    expect(validateLatestPrize(negative, 3).ok).toBe(false)

    const fractional = makePrize()
    fractional.tiers[4] = { rank: 5, winners: 1, prizePerGame: 5000.5 }
    expect(validateLatestPrize(fractional, 3).ok).toBe(false)
  })
})
