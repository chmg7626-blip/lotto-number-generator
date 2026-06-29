import { describe, it, expect } from 'vitest'
import { zoneOf } from './zones'

describe('zoneOf', () => {
  it('각 구간의 경계값을 올바른 색에 매핑한다', () => {
    // 구간 경계: 1·10→z1, 11·20→z2, 21·30→z3, 31·40→z4, 41·45→z5
    expect(zoneOf(1)).toBe('z1')
    expect(zoneOf(10)).toBe('z1')
    expect(zoneOf(11)).toBe('z2')
    expect(zoneOf(20)).toBe('z2')
    expect(zoneOf(21)).toBe('z3')
    expect(zoneOf(30)).toBe('z3')
    expect(zoneOf(31)).toBe('z4')
    expect(zoneOf(40)).toBe('z4')
    expect(zoneOf(41)).toBe('z5')
    expect(zoneOf(45)).toBe('z5')
  })

  it('1~45 전체가 z1~z5 중 하나로 매핑된다', () => {
    const zones = new Set(['z1', 'z2', 'z3', 'z4', 'z5'])
    for (let n = 1; n <= 45; n++) {
      expect(zones.has(zoneOf(n))).toBe(true)
    }
  })
})
