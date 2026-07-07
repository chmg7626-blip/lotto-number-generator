import { describe, it, expect } from 'vitest'
import { formatWon, withComma } from './prizeFormat.ts'

describe('formatWon', () => {
  it('억 단위 금액을 억+만으로 표기한다 (정상 — 1231회 1등 실값)', () => {
    expect(formatWon(1652990074)).toBe('16억5,299만원')
  })

  it('억 단위 총액도 같은 규칙이다 (정상 — 1231회 1등 총액 실값)', () => {
    expect(formatWon(28100831258)).toBe('281억83만원')
  })

  it('만 단위 금액은 만원으로 표기한다 (정상 — 2·3등 실값)', () => {
    expect(formatWon(50907303)).toBe('5,090만원')
    expect(formatWon(1406871)).toBe('140만원')
    expect(formatWon(50000)).toBe('5만원')
  })

  it('천 단위 딱 떨어지는 금액은 천원으로 표기한다 (정상 — 5등 실값)', () => {
    expect(formatWon(5000)).toBe('5천원')
  })

  it('경계값: 정확히 1억이면 만 없이 억원만 쓴다', () => {
    expect(formatWon(100_000_000)).toBe('1억원')
  })

  it('경계값: 천 단위로 안 떨어지면 원 단위 그대로 쓴다', () => {
    expect(formatWon(1500)).toBe('1,500원')
    expect(formatWon(0)).toBe('0원')
  })
})

describe('withComma', () => {
  it('세 자리마다 쉼표를 넣는다', () => {
    expect(withComma(2686693)).toBe('2,686,693')
    expect(withComma(17)).toBe('17')
  })
})
