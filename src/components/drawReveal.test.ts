import { describe, it, expect } from 'vitest'
import type { Rng } from '../domain/lotto'
import { revealSequence } from './drawReveal'

function constantRng(value: number): Rng {
  return () => value
}

describe('revealSequence', () => {
  it('입력과 같은 집합의 순열을 돌려준다 (길이 6·중복 없음, 500회)', () => {
    const numbers = [3, 11, 27, 38, 44, 45]
    for (let i = 0; i < 500; i++) {
      const sequence = revealSequence(numbers)
      expect(sequence).toHaveLength(6)
      expect([...sequence].sort((a, b) => a - b)).toEqual(numbers)
    }
  })

  it('입력 배열을 변경하지 않는다', () => {
    const numbers = [1, 2, 3, 4, 5, 6]
    revealSequence(numbers)
    expect(numbers).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('RNG를 주입하면 결정적이다 (항상 0 → 왼쪽 회전 순열)', () => {
    // 피셔-예이츠에서 rng()=0이면 매번 j=0과 교환되어 결과가 항상 같다.
    const first = revealSequence([1, 2, 3, 4, 5, 6], constantRng(0))
    const second = revealSequence([1, 2, 3, 4, 5, 6], constantRng(0))
    expect(first).toEqual(second)
    // 오름차순 그대로가 아니라 실제로 섞였는지도 고정값으로 확인한다.
    expect(first).not.toEqual([1, 2, 3, 4, 5, 6])
  })
})
