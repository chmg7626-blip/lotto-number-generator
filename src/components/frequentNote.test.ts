import { describe, it, expect } from 'vitest'
import { buildFrequentNotes, subjectParticle } from './frequentNote'
import type { FrequencyEntry } from '../domain/types'

// 1~45 전체를 count 0으로 깔고 일부만 덮어쓴다 — calculateFrequencies의 반환 형태와 같다.
function makeFrequencies(counts: Record<number, number>): FrequencyEntry[] {
  const entries: FrequencyEntry[] = []
  for (let n = 1; n <= 45; n++) {
    entries.push({ number: n, count: counts[n] ?? 0 })
  }
  return entries
}

describe('subjectParticle (은/는)', () => {
  it('끝자리 2·4·5·9만 받침이 없어 "는", 나머지는 "은"이다', () => {
    expect(subjectParticle(2)).toBe('는') // 이
    expect(subjectParticle(34)).toBe('는') // 삼십사
    expect(subjectParticle(45)).toBe('는') // 사십오
    expect(subjectParticle(9)).toBe('는') // 구
    expect(subjectParticle(1)).toBe('은') // 일
    expect(subjectParticle(27)).toBe('은') // 이십칠
    expect(subjectParticle(6)).toBe('은') // 육
    expect(subjectParticle(10)).toBe('은') // 십
    expect(subjectParticle(40)).toBe('은') // 사십
  })
})

describe('buildFrequentNotes', () => {
  const frequencies = makeFrequencies({ 34: 184, 27: 181, 13: 179, 45: 175 })
  const game = { numbers: [3, 13, 27, 34, 41, 45] }

  it('게임의 출현 횟수 상위 2개를 횟수·순위와 함께 문장으로 만든다', () => {
    const notes = buildFrequentNotes('frequent', [game], frequencies, 1231)
    expect(notes).toEqual([
      '🔥 34는 역대 1,231번 추첨에서 184번 나온 단골 1위, 27은 181번(2위) 나왔어요',
    ])
  })

  it('게임 수만큼 설명을 돌려준다 (×5 경계값)', () => {
    const games = Array.from({ length: 5 }, () => game)
    const notes = buildFrequentNotes('frequent', games, frequencies, 1231)
    expect(notes).toHaveLength(5)
  })

  it('동률은 공동 순위로 세고, 언급 순서는 번호가 작은 쪽이 먼저다', () => {
    const tied = makeFrequencies({ 14: 172, 3: 172, 40: 90 })
    const notes = buildFrequentNotes(
      'frequent',
      [{ numbers: [1, 3, 14, 20, 40, 44] }],
      tied,
      100,
    )
    // 3과 14가 172회 동률 → 둘 다 1위, 작은 3이 먼저.
    expect(notes).toEqual([
      '🔥 3은 역대 100번 추첨에서 172번 나온 단골 1위, 14는 172번(1위) 나왔어요',
    ])
  })

  it('random·fixed 모드면 null이다', () => {
    expect(buildFrequentNotes('random', [game], frequencies, 1231)).toBeNull()
    expect(buildFrequentNotes('fixed', [game], frequencies, 1231)).toBeNull()
  })

  it('데이터가 없으면(회차 0) null이다 — 도메인의 랜덤 폴백과 짝', () => {
    const empty = makeFrequencies({})
    expect(buildFrequentNotes('frequent', [game], empty, 0)).toBeNull()
  })

  it('같은 입력이면 항상 같은 문장이다 (순수 함수)', () => {
    const a = buildFrequentNotes('frequent', [game], frequencies, 1231)
    const b = buildFrequentNotes('frequent', [game], frequencies, 1231)
    expect(a).toEqual(b)
  })

  it('문구에 금지 표현이 없다 — 사행성 규칙', () => {
    // 여러 구간 번호가 문장에 등장하도록 게임을 깔아 검사한다.
    const games = [
      { numbers: [1, 2, 3, 4, 5, 6] },
      { numbers: [10, 15, 20, 25, 30, 35] },
      { numbers: [40, 41, 42, 43, 44, 45] },
    ]
    const all = makeFrequencies(
      Object.fromEntries(
        Array.from({ length: 45 }, (_, i) => [i + 1, 100 + i]),
      ),
    )
    const notes = buildFrequentNotes('frequent', games, all, 1231) ?? []
    expect(notes).toHaveLength(3)
    for (const note of notes) {
      expect(note).not.toMatch(/당첨|보장|확률을 높/)
    }
  })
})
