import { describe, it, expect } from 'vitest'
import { EXPERT_QUIPS, pickQuip } from './expertQuips'

describe('expertQuips', () => {
  it('멘트 풀은 15개 이상이고 빈 문구가 없다', () => {
    expect(EXPERT_QUIPS.length).toBeGreaterThanOrEqual(15)
    for (const quip of EXPERT_QUIPS) {
      expect(quip.trim().length).toBeGreaterThan(0)
    }
  })

  it("사행성 금지 표현('당첨'·'보장'·'확률을 높')이 없다", () => {
    for (const quip of EXPERT_QUIPS) {
      expect(quip).not.toMatch(/당첨|보장|확률을 높/)
    }
  })

  it('RNG 주입 시 결정적이고, 경계값(0·1 직전)에서도 유효한 멘트를 돌려준다', () => {
    expect(pickQuip(() => 0)).toBe(EXPERT_QUIPS[0])
    expect(pickQuip(() => 0.999999)).toBe(EXPERT_QUIPS[EXPERT_QUIPS.length - 1])
    expect(pickQuip(() => 0.5)).toBe(pickQuip(() => 0.5))
  })

  it('기본 RNG로도 항상 풀 안의 멘트를 돌려준다 (200회)', () => {
    for (let i = 0; i < 200; i++) {
      expect(EXPERT_QUIPS).toContain(pickQuip())
    }
  })
})
