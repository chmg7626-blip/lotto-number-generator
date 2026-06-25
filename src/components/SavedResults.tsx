import type { GenerateMode, SavedResult } from '../domain/types'

type Props = {
  items: SavedResult[]
  onDelete: (id: string) => void
  onClear: () => void
}

const MODE_LABEL: Record<GenerateMode, string> = {
  random: '순수 랜덤',
  frequent: '자주 위주',
  rare: '드물게 위주',
}

export default function SavedResults({ items, onDelete, onClear }: Props) {
  return (
    <section className="panel">
      <div className="saved-header">
        <h2>저장한 번호</h2>
        {items.length > 0 && (
          <button type="button" onClick={onClear}>
            전체 비우기
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="hint">저장한 번호가 없습니다.</p>
      ) : (
        <ul className="saved-list">
          {items.map((item) => (
            <li key={item.id} className="saved-row">
              <span className="saved-mode">{MODE_LABEL[item.mode]}</span>
              <span className="balls">
                {item.numbers.map((n) => (
                  <span key={n} className="ball small">
                    {n}
                  </span>
                ))}
                <span className="plus">+</span>
                <span className="ball small bonus">{item.bonus}</span>
              </span>
              <button type="button" onClick={() => onDelete(item.id)}>
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
