import { useEffect, useRef, useState } from 'react'
import { Ball } from './Ball'
import { LottoMachine } from './LottoMachine'

// 연출 타이밍(ms)을 한곳에 모은다(확정 설계 — 조정 가능하게).
// ×1 기준 시작~결과 컷 = MIX_MS + REVEAL_INTERVAL_MS × 7(공개 6 + 결과 전 여백 1) ≈ 6초
// (spec 약 5~7초 — 2026-07-03 사용자 요청으로 8~12초에서 단축).
export const MIX_MS = 1400
export const REVEAL_INTERVAL_MS = 650

type Phase = 'mixing' | 'revealing' | 'result'

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
  const [revealedCount, setRevealedCount] = useState(0)
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
    const delay = phase === 'mixing' ? MIX_MS : REVEAL_INTERVAL_MS
    const timer = window.setTimeout(() => {
      if (phase === 'mixing') {
        setPhase('revealing')
      } else if (revealedCount < revealOrder.length) {
        setRevealedCount(revealedCount + 1)
      } else {
        setPhase('result')
      }
    }, delay)
    return () => window.clearTimeout(timer)
  }, [phase, revealedCount, revealOrder.length])

  function skip() {
    setRevealedCount(revealOrder.length)
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
          <LottoMachine />
          <div className="draw-tray" aria-live="polite">
            {revealOrder.slice(0, revealedCount).map((n) => (
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
