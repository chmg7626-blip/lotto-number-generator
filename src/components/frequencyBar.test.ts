import { describe, it, expect } from 'vitest'
import { barPercent } from './frequencyBar'

describe('barPercent', () => {
  it('최대 출현수 대비 비율(%)로 정규화한다', () => {
    expect(barPercent(13, 13)).toBe(100)
    expect(barPercent(0, 13)).toBe(0)
    expect(barPercent(7, 13)).toBe(54) // round(7/13*100)
  })

  it('빈 데이터(최대 0)면 0을 돌려 0으로 나누기를 피한다', () => {
    expect(barPercent(0, 0)).toBe(0)
  })
})
