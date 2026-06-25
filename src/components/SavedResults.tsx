import type { GenerateMode, SavedResult } from '../domain/types'
import { zoneClass } from './zoneColor'

type Props = {
  items: SavedResult[]
  onDelete: (id: string) => void
  onClear: () => void
}

const MODE_LABEL: Record<GenerateMode, string> = {
  random: '순수 랜덤',
  frequent: '자주 나온',
  rare: '드물게 나온',
}

export default function SavedResults({ items, onDelete, onClear }: Props) {
  return (
    <section className="card">
      <div className="saved-header">
        <h2>저장한 번호</h2>
        {items.length > 0 && (
          <button type="button" className="ghost" onClick={onClear}>
            전체 비우기
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="hint">
          아직 저장한 번호가 없습니다. 마음에 드는 조합을 저장해 보세요.
        </p>
      ) : (
        <ul className="saved-list">
          {items.map((item) => (
            <li key={item.id} className="saved-row">
              <span className="saved-mode">{MODE_LABEL[item.mode]}</span>
              <span className="balls">
                {item.numbers.map((n) => (
                  <span key={n} className={`ball ball-sm ${zoneClass(n)}`}>
                    {n}
                  </span>
                ))}
                <span className="plus">+</span>
                <span className={`ball ball-sm ${zoneClass(item.bonus)}`}>
                  {item.bonus}
                </span>
              </span>
              <button
                type="button"
                className="ghost"
                onClick={() => onDelete(item.id)}
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
