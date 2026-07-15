import { Ball } from './Ball'
import { MIN_NUMBER, MAX_NUMBER, MAIN_COUNT } from '../domain/lotto'

// 행운수 고정 모드에서 최대로 고정할 수 있는 개수(나머지 1자리는 항상 랜덤).
export const MAX_FIXED = MAIN_COUNT - 1

type NumberPadProps = {
  fixed: number[]
  onToggle: (n: number) => void
  onClear: () => void
}

// 행운수 고정 모드 전용 1~45 번호판. 0~5개까지 토글하고, 5개가 차면 미선택 공을 비활성해
// 6개째 선택을 막는다(이미 고른 공은 해제 가능). 고정 번호는 확률에 영향 없는 재미 요소다.
export function NumberPad({ fixed, onToggle, onClear }: NumberPadProps) {
  const full = fixed.length >= MAX_FIXED
  const numbers: number[] = []
  for (let n = MIN_NUMBER; n <= MAX_NUMBER; n++) numbers.push(n)

  return (
    <div className="numpad" role="group" aria-label="행운수 고정 번호 선택">
      <div className="numpad-head">
        <span className="numpad-note">
          내가 고른 <b>{fixed.length}</b>개 + 랜덤 {MAIN_COUNT - fixed.length}개
          <span className="numpad-fun"> · 재미용(확률에 영향 없음)</span>
        </span>
        <button
          type="button"
          className="numpad-clear"
          onClick={onClear}
          disabled={fixed.length === 0}
        >
          전체 해제
        </button>
      </div>
      <div className="numpad-grid">
        {numbers.map((n) => {
          const on = fixed.includes(n)
          const disabled = !on && full
          return (
            <button
              key={n}
              type="button"
              className={`numcell${on ? ' on' : ''}`}
              onClick={() => onToggle(n)}
              disabled={disabled}
              aria-pressed={on}
            >
              <Ball number={n} size="sm" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
