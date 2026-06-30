import { useState } from 'react'
import type { GenerateMode } from '../domain/types'

// 모드칩 라벨. 내부 GenerateMode 'frequent'="역대 단골 번호", 'fixed'="행운수 고정".
const MODES: { value: GenerateMode; label: string }[] = [
  { value: 'random', label: '순수 랜덤' },
  { value: 'frequent', label: '역대 단골 번호' },
  { value: 'fixed', label: '행운수 고정' },
]

const COUNTS = [1, 2, 3, 4, 5] as const

type GeneratorPanelProps = {
  onDraw: (mode: GenerateMode, count: number) => void
}

export function GeneratorPanel({ onDraw }: GeneratorPanelProps) {
  const [mode, setMode] = useState<GenerateMode>('random')
  const [count, setCount] = useState(1)

  return (
    <section className="hero">
      <div className="logo">
        <div className="logo-img"></div>
        <div className="logo-name">
          로또 6/45<small>LUCKY DRAW</small>
        </div>
      </div>

      <div className="kicker">매주 토요일 저녁 8시 45분 추첨</div>
      <h1 className="htitle">
        로또 <span className="n">6/45</span>
      </h1>
      <p className="hsub">
        과거 빈도를 구경하고, 추첨기로 5게임을 한 번에 뽑아보세요
      </p>

      <div className="modechips">
        {MODES.map((m) => (
          <button
            key={m.value}
            className={`chip${mode === m.value ? ' on' : ''}`}
            onClick={() => setMode(m.value)}
          >
            {m.label}
          </button>
        ))}
      </div>
      <p className="modenote">
        ‘역대 단골 번호 · 행운수 고정’은 확률에 영향 없는 재미 요소예요 (예측
        아님).
      </p>

      <div className="drawrow">
        <button className="drawbtn" onClick={() => onDraw(mode, count)}>
          번호 뽑기
        </button>
        <div className="countsel" title="연속 뽑기 횟수 (기본 ×1, 최대 ×5)">
          {COUNTS.map((c) => (
            <button
              key={c}
              className={`cnt${count === c ? ' on' : ''}`}
              onClick={() => setCount(c)}
            >
              ×{c}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
