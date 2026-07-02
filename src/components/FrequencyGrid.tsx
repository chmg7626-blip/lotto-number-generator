import { Ball } from './Ball'
import { barPercent } from './frequencyBar'
import type { FrequencyEntry } from '../domain/types'

type FrequencyGridProps = {
  frequencies: FrequencyEntry[]
}

// 1~45 각 번호의 누적 출현 횟수를 9열 공 그리드로 표시한다.
// 공 아래 빈도 비례 막대로 높낮이를 시각적으로 구분한다(최대 출현수 기준).
// frequencies는 항상 1~45 전체(길이 45)라 빈 데이터(모두 0)여도 오류 없이 그려진다.
export function FrequencyGrid({ frequencies }: FrequencyGridProps) {
  const maxCount = frequencies.reduce(
    (max, entry) => Math.max(max, entry.count),
    0,
  )
  return (
    <div className="statpanel">
      <div className="statgrid">
        {frequencies.map((entry) => (
          <div className="statcell" key={entry.number}>
            <Ball number={entry.number} size="sm" />
            <span className="statcnt">{entry.count}</span>
            <span className="statbar">
              <span
                className="statbar-fill"
                style={{ width: `${barPercent(entry.count, maxCount)}%` }}
              />
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
