import { useState } from 'react'
import type { GenerateMode, GeneratedNumbers } from '../domain/types'
import { NumberPad, MAX_FIXED } from './NumberPad'
import { Ticket } from './Ticket'

// 모드칩 라벨. 내부 GenerateMode 'frequent'="역대 단골 번호", 'fixed'="행운수 고정".
const MODES: { value: GenerateMode; label: string }[] = [
  { value: 'random', label: '순수 랜덤' },
  { value: 'frequent', label: '역대 단골 번호' },
  { value: 'fixed', label: '행운수 고정' },
]

const COUNTS = [1, 2, 3, 4, 5] as const

// 번호 뽑기 결과. 생성 당시 모드·게임수를 함께 담아 용지 라벨이 이후 모드 변경과 어긋나지 않게 한다.
// quip은 뽑기 시점에 확정한 전문가 훈수(패러디) 멘트 — 리렌더에 흔들리지 않는다(spec 요구 2).
export type DrawResult = {
  games: GeneratedNumbers[]
  mode: GenerateMode
  count: number
  quip: string
}

function modeLabel(mode: GenerateMode): string {
  return MODES.find((m) => m.value === mode)?.label ?? ''
}

type GeneratorPanelProps = {
  onDraw: (mode: GenerateMode, count: number, fixed: number[]) => void
  result: DrawResult | null
  // 단골 가중에 쓸 과거 데이터가 있는지(빈 데이터면 단골 모드가 랜덤으로 폴백함을 안내).
  hasData: boolean
  // 단골 빈도 설명(spec: frequent-stat-note) — App이 result·빈도에서 계산해 내려준다.
  notes: string[] | null
}

export function GeneratorPanel({
  onDraw,
  result,
  hasData,
  notes,
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
    <section className="generator-section" aria-labelledby="generator-heading">
      <div className="generator-card">
        <div className="generator-card-head">
          <p className="eyebrow">번호 생성</p>
          <h2 id="generator-heading">어떤 방식으로 뽑을까요?</h2>
        </div>

        <div className="modechips" role="group" aria-label="번호 생성 방식">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              className={`chip${mode === m.value ? ' on' : ''}`}
              onClick={() => setMode(m.value)}
              aria-pressed={mode === m.value}
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
          <div className="draw-count">
            <span className="control-label" id="game-count-label">
              게임 수
            </span>
            <div
              className="countsel"
              title="연속 뽑기 횟수 (기본 ×1, 최대 ×5)"
              role="group"
              aria-labelledby="game-count-label"
            >
              {COUNTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`cnt${count === c ? ' on' : ''}`}
                  onClick={() => setCount(c)}
                  aria-pressed={count === c}
                >
                  ×{c}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            className="drawbtn"
            onClick={() => onDraw(mode, count, fixed)}
          >
            번호 뽑기
          </button>
        </div>
      </div>

      {result && (
        <section className="result-section" aria-labelledby="result-heading">
          <div className="result-section-head">
            <p className="eyebrow">내 결과</p>
            <h2 id="result-heading">이번에 뽑은 번호</h2>
          </div>
          <Ticket
            games={result.games}
            modeLabel={modeLabel(result.mode)}
            quip={result.quip}
            notes={notes}
          />
        </section>
      )}
    </section>
  )
}
