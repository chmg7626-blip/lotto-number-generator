import { useEffect, useRef, useState } from 'react'
import { Ball } from './Ball'
import { DrawMachineCanvas } from './DrawMachineCanvas'

// 연출 타이밍(ms). "뽑히는 순간"이 주인공인 리듬(2026-07-04 재설계 — design 변경 이력):
// 믹싱(배경) → [슛(공이 튜브로 나감) → 컷인(화면 중앙 확대 공개)] ×6 → 결과 컷.
// 마지막 공 앞에만 서스펜스(드럼 떨림)를 넣고, 마지막 컷인은 더 크고 길게(final 강화).
// ×1 총 = MIX + 5×(SHOOT+SHOWCASE) + SUSPENSE + SHOOT + SHOWCASE_FINAL ≈ 7초.
export const MIX_MS = 700
export const SHOOT_MS = 300
export const SHOWCASE_MS = 550
export const SUSPENSE_MS = 800
export const SHOWCASE_FINAL_MS = 900

type Phase = 'mixing' | 'shooting' | 'showcase' | 'suspense' | 'result'

type DrawOverlayProps = {
  // 게임 A의 공개 순서(뽑힌 순서 — 정렬 안 됨)와 결과 컷용 오름차순 번호.
  revealOrder: number[]
  sortedNumbers: number[]
  onConfirm: () => void
}

export function DrawOverlay({
  revealOrder,
  sortedNumbers,
  onConfirm,
}: DrawOverlayProps) {
  const [phase, setPhase] = useState<Phase>('mixing')
  // shotCount: 드럼에서 나간(나가는 중 포함) 공 수 — 캔버스 추출 기준.
  // settledCount: 컷인을 마치고 트레이에 안착한 공 수 — 트레이 표시 기준.
  const [shotCount, setShotCount] = useState(0)
  const [settledCount, setSettledCount] = useState(0)
  const skipButtonRef = useRef<HTMLButtonElement>(null)
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  // 열릴 때 focus를 오버레이 안으로 옮기고, 닫힐 때 원래 자리(뽑기 버튼)로 되돌린다 —
  // 키보드가 뒤 화면에 남지 않게 한다(확정 설계 "접근성·입력 차단").
  useEffect(() => {
    const previous = document.activeElement
    skipButtonRef.current?.focus()
    return () => {
      if (previous instanceof HTMLElement) previous.focus()
    }
  }, [])

  // 결과 컷으로 넘어가면 건너뛰기 버튼이 사라지므로 focus를 확인 버튼으로 옮긴다.
  useEffect(() => {
    if (phase === 'result') confirmButtonRef.current?.focus()
  }, [phase])

  // 상태가 바뀔 때마다 다음 전이 하나만 예약하고 cleanup에서 해제한다 —
  // StrictMode 재실행·건너뛰기·언마운트에서 유령 전이가 없다(확정 설계 "위험과 완화").
  useEffect(() => {
    if (phase === 'result') return
    const delay =
      phase === 'mixing'
        ? MIX_MS
        : phase === 'shooting'
          ? SHOOT_MS
          : phase === 'suspense'
            ? SUSPENSE_MS
            : shotCount >= revealOrder.length
              ? SHOWCASE_FINAL_MS
              : SHOWCASE_MS
    const timer = window.setTimeout(() => {
      if (phase === 'mixing') {
        setShotCount(1)
        setPhase('shooting')
      } else if (phase === 'suspense') {
        setShotCount(revealOrder.length)
        setPhase('shooting')
      } else if (phase === 'shooting') {
        setPhase('showcase')
      } else {
        // showcase 종료: 컷인 공이 트레이에 안착한다.
        setSettledCount(shotCount)
        if (shotCount >= revealOrder.length) {
          setPhase('result')
        } else if (shotCount === revealOrder.length - 1) {
          setPhase('suspense')
        } else {
          setShotCount(shotCount + 1)
          setPhase('shooting')
        }
      }
    }, delay)
    return () => window.clearTimeout(timer)
  }, [phase, shotCount, revealOrder.length])

  function skip() {
    setShotCount(revealOrder.length)
    setSettledCount(revealOrder.length)
    setPhase('result')
  }

  return (
    <div
      className="draw-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="추첨 연출"
    >
      {phase !== 'result' ? (
        <div className="draw-stage">
          <DrawMachineCanvas
            revealOrder={revealOrder}
            shotCount={shotCount}
            suspense={phase === 'suspense'}
          />
          {phase === 'showcase' && (
            <div
              className={`draw-cutin${
                shotCount >= revealOrder.length ? ' final' : ''
              }`}
              aria-hidden="true"
            >
              <Ball number={revealOrder[shotCount - 1]} />
            </div>
          )}
          <div className="draw-tray" aria-live="polite">
            {revealOrder.slice(0, settledCount).map((n) => (
              <Ball key={n} number={n} />
            ))}
          </div>
          <button
            type="button"
            className="draw-skip"
            onClick={skip}
            ref={skipButtonRef}
          >
            건너뛰기
          </button>
        </div>
      ) : (
        <div className="draw-resultcut">
          <p className="draw-result-title">뽑힌 번호</p>
          <div className="draw-result-balls">
            {sortedNumbers.map((n) => (
              <Ball key={n} number={n} />
            ))}
          </div>
          <button
            type="button"
            className="draw-confirm"
            onClick={onConfirm}
            ref={confirmButtonRef}
          >
            확인
          </button>
        </div>
      )}
    </div>
  )
}
