import type { Draw } from '../domain/types'
import { Ball } from './Ball'

// 회차 당첨번호 띠. 과거 당첨 데이터(Draw)를 그대로 쓰므로 본번호 6 + 보너스를 보여준다.
// 데이터가 없으면 렌더하지 않는다.
type WinningBarProps = {
  draw: Draw | null
}

export function WinningBar({ draw }: WinningBarProps) {
  if (draw === null) return null

  return (
    <div className="winbar">
      <span className="wlabel">
        <b>제{draw.round}회</b> 당첨번호
      </span>
      <span className="wballs">
        {draw.numbers.map((n) => (
          <Ball key={n} number={n} size="sm" />
        ))}
        <span className="plus">+</span>
        <Ball number={draw.bonus} size="sm" />
      </span>
    </div>
  )
}
