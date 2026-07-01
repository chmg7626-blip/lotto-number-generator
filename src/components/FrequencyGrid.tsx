import { Ball } from './Ball'
import type { FrequencyEntry } from '../domain/types'

type FrequencyGridProps = {
  frequencies: FrequencyEntry[]
}

// 1~45 각 번호의 누적 출현 횟수를 9열 공 그리드로 표시한다.
// frequencies는 항상 1~45 전체(길이 45)라 빈 데이터(모두 0)여도 오류 없이 그려진다.
export function FrequencyGrid({ frequencies }: FrequencyGridProps) {
  return (
    <div className="statpanel">
      <div className="statgrid">
        {frequencies.map((entry) => (
          <div className="statcell" key={entry.number}>
            <Ball number={entry.number} size="sm" />
            <span className="statcnt">{entry.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
