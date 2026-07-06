import { describe, it, expect } from 'vitest'
import type { Draw } from '../src/domain/types'
import {
  buildLatestPrize,
  mergeDraws,
  serialize,
  toDraw,
  type ApiDrawItem,
} from './updateDrawsCore.ts'

// WP-001 스파이크에서 받은 실제 응답(1231회)을 fixture로 쓴다 — 네트워크 없이 변환을 검증한다.
const item1231: ApiDrawItem = {
  ltEpsd: 1231,
  ltRflYmd: '20260704',
  tm1WnNo: 4,
  tm2WnNo: 13,
  tm3WnNo: 14,
  tm4WnNo: 18,
  tm5WnNo: 31,
  tm6WnNo: 38,
  bnsWnNo: 15,
  rnk1WnNope: 17,
  rnk1WnAmt: 1652990074,
  rnk2WnNope: 92,
  rnk2WnAmt: 50907303,
  rnk3WnNope: 3329,
  rnk3WnAmt: 1406871,
  rnk4WnNope: 162821,
  rnk4WnAmt: 50000,
  rnk5WnNope: 2686693,
  rnk5WnAmt: 5000,
}

function makeItem(
  round: number,
  overrides: Partial<ApiDrawItem> = {},
): ApiDrawItem {
  return { ...item1231, ltEpsd: round, ...overrides }
}

describe('toDraw', () => {
  it('회차·날짜(YYYY-MM-DD)·본번호·보너스를 변환한다 (정상)', () => {
    expect(toDraw(item1231)).toEqual({
      round: 1231,
      date: '2026-07-04',
      numbers: [4, 13, 14, 18, 31, 38],
      bonus: 15,
    })
  })

  it('본번호를 오름차순으로 정렬한다 (경계 — API 순서에 의존하지 않음)', () => {
    const shuffled = makeItem(1, { tm1WnNo: 38, tm6WnNo: 4 })
    expect(toDraw(shuffled).numbers).toEqual([4, 13, 14, 18, 31, 38])
  })
})

describe('mergeDraws', () => {
  const existing: Draw[] = [toDraw(makeItem(1)), toDraw(makeItem(2))]

  it('기존 최신 회차 이후만 추가한다 (겹치는 회차는 버림)', () => {
    const merged = mergeDraws(existing, [makeItem(2), makeItem(3), makeItem(4)])
    expect(merged.map((d) => d.round)).toEqual([1, 2, 3, 4])
  })

  it('새 회차가 없으면 기존 그대로다 (경계)', () => {
    expect(mergeDraws(existing, [makeItem(2)])).toEqual(existing)
  })

  it('기존이 비어 있으면 전체를 오름차순으로 넣는다 (--full 경로)', () => {
    const merged = mergeDraws([], [makeItem(2), makeItem(1)])
    expect(merged.map((d) => d.round)).toEqual([1, 2])
  })
})

describe('buildLatestPrize', () => {
  it('최신 회차 항목에서 1~5등 당첨금 파일을 만든다 (정상)', () => {
    const prize = buildLatestPrize(item1231)
    expect(prize.round).toBe(1231)
    expect(prize.tiers).toHaveLength(5)
    expect(prize.tiers[0]).toEqual({
      rank: 1,
      winners: 17,
      prizePerGame: 1652990074,
    })
    expect(prize.tiers[4]).toEqual({
      rank: 5,
      winners: 2686693,
      prizePerGame: 5000,
    })
  })
})

describe('serialize', () => {
  it('같은 데이터는 바이트 단위로 같은 결과를 낸다 (멱등의 전제)', () => {
    const a = serialize({ draws: [toDraw(item1231)] })
    const b = serialize({ draws: [toDraw(makeItem(1231))] })
    expect(a).toBe(b)
    expect(a.endsWith('\n')).toBe(true)
  })
})
