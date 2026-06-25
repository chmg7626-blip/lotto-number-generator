import type { GenerateMode, GeneratedNumbers } from '../domain/types'

type Props = {
  mode: GenerateMode
  onModeChange: (mode: GenerateMode) => void
  onGenerate: () => void
  onSave: () => void
  current: GeneratedNumbers | null
  hasData: boolean
}

const MODES: { value: GenerateMode; label: string }[] = [
  { value: 'random', label: '순수 랜덤' },
  { value: 'frequent', label: '자주 나온 번호 위주' },
  { value: 'rare', label: '드물게 나온 번호 위주' },
]

export default function GeneratorPanel({
  mode,
  onModeChange,
  onGenerate,
  onSave,
  current,
  hasData,
}: Props) {
  const isWeighted = mode !== 'random'

  return (
    <section className="panel">
      <h2>번호 생성</h2>

      <div className="modes">
        {MODES.map((option) => (
          <label key={option.value} className="mode-option">
            <input
              type="radio"
              name="mode"
              value={option.value}
              checked={mode === option.value}
              onChange={() => onModeChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>

      {isWeighted && (
        <p className="hint">
          빈도가중은 확률적 근거가 없는 재미 요소입니다. 자주/드물게 나온 번호에
          가중치를 줄 뿐, 당첨 확률과는 무관합니다.
          {!hasData && ' (데이터 없음 — 순수 랜덤으로 동작합니다.)'}
        </p>
      )}

      <button type="button" className="primary" onClick={onGenerate}>
        번호 뽑기
      </button>

      {current && (
        <div className="result">
          <div className="balls">
            {current.numbers.map((n) => (
              <span key={n} className="ball">
                {n}
              </span>
            ))}
            <span className="plus">+</span>
            <span className="ball bonus">{current.bonus}</span>
          </div>
          <button type="button" onClick={onSave}>
            저장
          </button>
        </div>
      )}
    </section>
  )
}
