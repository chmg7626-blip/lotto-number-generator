import { describe, it, expect } from 'vitest'
import drawsData from './draws.json'
import latestPrizeData from './latestPrize.json'
import type { DrawsFile, LatestPrizeFile } from '../domain/types'
import {
  validateDraws,
  validateLatestPrize,
} from '../domain/drawsValidation.ts'

// 커밋된 실데이터가 갱신 스크립트와 같은 규칙(스키마 검증)을 지키는지 확인한다
// (spec 완료 조건 — 회차 연속·범위·중복·보너스·당첨금 회차 일치).
const draws = drawsData as DrawsFile
const prize = latestPrizeData as LatestPrizeFile

describe('실데이터 파일', () => {
  it('draws.json이 1회~최신 회차 연속·스키마 검증을 통과한다', () => {
    const result = validateDraws(draws)
    expect(result.errors).toEqual([])
    expect(result.ok).toBe(true)
  })

  it('latestPrize.json이 당첨번호 최신 회차와 일치하고 1~5등을 담는다', () => {
    const latestRound = draws.draws[draws.draws.length - 1].round
    const result = validateLatestPrize(prize, latestRound)
    expect(result.errors).toEqual([])
    expect(result.ok).toBe(true)
  })
})
