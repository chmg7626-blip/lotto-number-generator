import { useState } from 'react'
import type { GenerateMode, GeneratedNumbers } from '../domain/types'
import { NumberPad, MAX_FIXED } from './NumberPad'
import { LottoMachine } from './LottoMachine'
import { Ticket } from './Ticket'

// 모드칩 라벨. 내부 GenerateMode 'frequent'="역대 단골 번호", 'fixed'="행운수 고정".
const MODES: { value: GenerateMode; label: string }[] = [
  { value: 'random', label: '순수 랜덤' },
  { value: 'frequent', label: '역대 단골 번호' },
  { value: 'fixed', label: '행운수 고정' },
]

const COUNTS = [1, 2, 3, 4, 5] as const

// 번호 뽑기 결과. 생성 당시 모드·게임수를 함께 담아 용지 라벨이 이후 모드 변경과 어긋나지 않게 한다.
export type DrawResult = {
  games: GeneratedNumbers[]
  mode: GenerateMode
  count: number
}

function modeLabel(mode: GenerateMode): string {
  return MODES.find((m) => m.value === mode)?.label ?? ''
}

type GeneratorPanelProps = {
  onDraw: (mode: GenerateMode, count: number, fixed: number[]) => void
  result: DrawResult | null
  // 단골 가중에 쓸 과거 데이터가 있는지(빈 데이터면 단골 모드가 랜덤으로 폴백함을 안내).
  hasData: boolean
}

export function GeneratorPanel({
  onDraw,
  result,
  hasData,
}: GeneratorPanelProps) {
  const [mode, setMode] = useState<GenerateMode>('random')
  const [count, setCount] = useState(1)
  const [fixed, setFixed] = useState<number[]>([])

  function toggleFixed(n: number) {
    setFixed((prev) => {
      if (prev.includes(n)) return prev.filter((x) => x !== n)
      if (prev.length >= MAX_FIXED) return prev // 6개째 차단(NumberPad가 이미 비활성 처리)
      return [...prev, n]
    })
  }

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
            type="button"
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

      {mode === 'fixed' && (
        <NumberPad
          fixed={fixed}
          onToggle={toggleFixed}
          onClear={() => setFixed([])}
        />
      )}

      {mode === 'frequent' && !hasData && (
        <p className="datanote">데이터 없음 — 순수 랜덤으로 동작합니다.</p>
      )}

      <div className="drawrow">
        <button
          type="button"
          className="drawbtn"
          onClick={() => onDraw(mode, count, fixed)}
        >
          번호 뽑기
        </button>
        <div className="countsel" title="연속 뽑기 횟수 (기본 ×1, 최대 ×5)">
          {COUNTS.map((c) => (
            <button
              key={c}
              type="button"
              className={`cnt${count === c ? ' on' : ''}`}
              onClick={() => setCount(c)}
            >
              ×{c}
            </button>
          ))}
        </div>
      </div>

      <LottoMachine />

      {result && (
        <Ticket games={result.games} modeLabel={modeLabel(result.mode)} />
      )}
    </section>
  )
}
