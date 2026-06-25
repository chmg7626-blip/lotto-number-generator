import type { FrequencyEntry } from '../domain/types'

type Props = {
  frequencies: FrequencyEntry[]
  hasData: boolean
}

export default function FrequencyTable({ frequencies, hasData }: Props) {
  const maxCount = Math.max(1, ...frequencies.map((entry) => entry.count))

  return (
    <section className="panel">
      <h2>번호별 출현 빈도</h2>
      {!hasData && (
        <p className="hint">데이터가 없어 모든 번호의 횟수가 0입니다.</p>
      )}
      <ul className="freq-list">
        {frequencies.map((entry) => (
          <li key={entry.number} className="freq-row">
            <span className="freq-number">{entry.number}</span>
            <span className="freq-bar-track">
              <span
                className="freq-bar"
                style={{ width: `${(entry.count / maxCount) * 100}%` }}
              />
            </span>
            <span className="freq-count">{entry.count}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
