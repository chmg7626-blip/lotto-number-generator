import latestPrizeData from '../data/latestPrize.json'
import type { LatestPrizeFile } from '../domain/types'
import { formatWon, withComma } from './prizeFormat.ts'

// 최신 회차 등수별 당첨금(실데이터 — src/data/README.md). 1등 강조 + 2~5등.
// 총액은 게임 수 × 1게임당 당첨금이다(공식 데이터의 등수별 합계와 일치 — WP-001 확인).
const prize = latestPrizeData as LatestPrizeFile

export function PrizeTable() {
  const [first, ...rest] = prize.tiers

  return (
    <>
      <div className="prize-top">
        <div className="prize-rank">1등</div>
        <div className="prize-amt">
          {formatWon(first.prizePerGame)}
          <span>1게임당</span>
        </div>
        <div className="prize-meta">
          당첨 {withComma(first.winners)}게임 · 총{' '}
          {formatWon(first.winners * first.prizePerGame)}
        </div>
      </div>

      <div className="prize-list">
        {rest.map((tier) => (
          <div className="prize-row" key={tier.rank}>
            <span className="pr">{tier.rank}등</span>
            <span className="pa">{formatWon(tier.prizePerGame)}</span>
            <span className="pc">{withComma(tier.winners)}게임</span>
          </div>
        ))}
      </div>
    </>
  )
}
