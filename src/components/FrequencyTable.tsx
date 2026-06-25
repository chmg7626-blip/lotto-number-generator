import type { FrequencyEntry } from '../domain/types'
import { zoneColor } from './zoneColor'

type Props = {
  frequencies: FrequencyEntry[]
  hasData: boolean
}

export default function FrequencyTable({ frequencies, hasData }: Props) {
  const maxCount = Math.max(1, ...frequencies.map((entry) => entry.count))

  return (
    <section className="card">
      <h2>번호별 출현 빈도</h2>
      {!hasData && (
        <p className="hint">데이터가 없어 모든 번호의 횟수가 0입니다.</p>
      )}
      <ul className="freq-list">
        {frequencies.map((entry) => (
          <li key={entry.number} className="freq-row">
            <span
              className="freq-number"
              style={{ color: zoneColor(entry.number) }}
            >
              {String(entry.number).padStart(2, '0')}
            </span>
            <span className="freq-bar-track">
              <span
                className="freq-bar"
                style={{
                  width: `${(entry.count / maxCount) * 100}%`,
                  background: zoneColor(entry.number),
                }}
              />
            </span>
            <span className="freq-count">{entry.count}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
