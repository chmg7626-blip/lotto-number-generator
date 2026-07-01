import { prizeSample } from '../data/prize.sample'

// 당첨금액 표시(1등 강조 + 2~5등). 샘플 데이터라 상위 섹션에 "샘플"을 명시한다.
export function PrizeTable() {
  const { first, rest } = prizeSample

  return (
    <>
      <div className="prize-top">
        <div className="prize-rank">1등</div>
        <div className="prize-amt">
          {first.amount}
          <span>{first.per}</span>
        </div>
        <div className="prize-meta">{first.meta}</div>
      </div>

      <div className="prize-list">
        {rest.map((tier) => (
          <div className="prize-row" key={tier.rank}>
            <span className="pr">{tier.rank}</span>
            <span className="pa">{tier.amount}</span>
            <span className="pc">{tier.count}</span>
          </div>
        ))}
      </div>
    </>
  )
}
