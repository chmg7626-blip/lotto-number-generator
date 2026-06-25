import type { GenerateMode, GeneratedNumbers } from '../domain/types'
import { zoneClass } from './zoneColor'

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
  { value: 'frequent', label: '자주 나온' },
  { value: 'rare', label: '드물게 나온' },
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
    <section className="stage">
      <div className="stage-result" aria-live="polite">
        {current ? (
          <div
            className="balls balls-hero"
            key={`${current.numbers.join('-')}-${current.bonus}`}
          >
            {current.numbers.map((n) => (
              <span key={n} className={`ball ${zoneClass(n)}`}>
                {n}
              </span>
            ))}
            <span className="plus">+</span>
            <span className={`ball ${zoneClass(current.bonus)}`}>
              {current.bonus}
            </span>
          </div>
        ) : (
          <p className="stage-empty">번호를 뽑으면 여기에 공이 나옵니다.</p>
        )}
      </div>

      <div className="chips" role="group" aria-label="생성 방식">
        {MODES.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`chip${mode === option.value ? ' chip-on' : ''}`}
            aria-pressed={mode === option.value}
            onClick={() => onModeChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {isWeighted && (
        <p className="hint">
          빈도가중은 확률적 근거가 없는 재미 요소입니다. 자주/드물게 나온 번호에
          가중치를 줄 뿐, 당첨 확률과는 무관합니다.
          {!hasData && ' 데이터가 없어 순수 랜덤으로 동작합니다.'}
        </p>
      )}

      <div className="stage-actions">
        <button type="button" className="draw" onClick={onGenerate}>
          번호 뽑기
        </button>
        <button
          type="button"
          className="save"
          onClick={onSave}
          disabled={!current}
        >
          저장
        </button>
      </div>
    </section>
  )
}
