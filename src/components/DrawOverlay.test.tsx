import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { DrawOverlay, MIX_MS, REVEAL_INTERVAL_MS } from './DrawOverlay'

// react-dom 없이 act를 쓰려면 act 환경 플래그가 필요하다(테스트 전용).
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

// 공개 순서(뽑힌 순서)와 결과 컷용 오름차순은 서로 다른 배열이어야
// "정렬 안 된 순서로 공개 → 결과 컷은 오름차순"을 구분해 검증할 수 있다.
const REVEAL_ORDER = [44, 3, 27, 11, 45, 38]
const SORTED = [3, 11, 27, 38, 44, 45]

let container: HTMLDivElement
let root: Root
let unmounted: boolean

function unmountOnce() {
  if (!unmounted) {
    act(() => root.unmount())
    unmounted = true
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  unmounted = false
})

afterEach(() => {
  unmountOnce()
  container.remove()
  vi.useRealTimers()
})

function renderOverlay(onConfirm: () => void = () => {}) {
  act(() => {
    root.render(
      <DrawOverlay
        revealOrder={REVEAL_ORDER}
        sortedNumbers={SORTED}
        onConfirm={onConfirm}
      />,
    )
  })
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

// setTimeout 체인은 상태 갱신(리렌더) 후에야 다음 타이머를 예약하므로,
// 한 번의 act 안에서 여러 구간을 한꺼번에 진행할 수 없다 — 공개 n단계를 한 구간씩 진행한다.
function advanceReveals(steps: number) {
  for (let i = 0; i < steps; i++) advance(REVEAL_INTERVAL_MS)
}

function click(selector: string) {
  const el = container.querySelector(selector)
  expect(el).not.toBeNull()
  act(() => {
    el!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
}

function trayNumbers(): number[] {
  return Array.from(container.querySelectorAll('.draw-tray .ball')).map((el) =>
    Number(el.textContent),
  )
}

function resultNumbers(): number[] {
  return Array.from(container.querySelectorAll('.draw-result-balls .ball')).map(
    (el) => Number(el.textContent),
  )
}

describe('DrawOverlay', () => {
  it('mixing에서 시작한다 — 공개된 공 0개, 건너뛰기만 보인다', () => {
    renderOverlay()
    expect(trayNumbers()).toEqual([])
    expect(container.querySelector('.draw-skip')).not.toBeNull()
    expect(container.querySelector('.draw-confirm')).toBeNull()
  })

  it('공이 뽑힌 순서(정렬 안 됨)대로 하나씩 공개된다', () => {
    renderOverlay()
    advance(MIX_MS)
    expect(trayNumbers()).toEqual([])

    advanceReveals(1)
    expect(trayNumbers()).toEqual([44])

    advanceReveals(2)
    expect(trayNumbers()).toEqual([44, 3, 27])

    advanceReveals(3)
    expect(trayNumbers()).toEqual(REVEAL_ORDER)
  })

  it('6개 공개 후 결과 컷 — 오름차순 정렬 + 확인 버튼, 확인 시 onConfirm', () => {
    const onConfirm = vi.fn()
    renderOverlay(onConfirm)
    advance(MIX_MS)
    advanceReveals(7) // 공개 6 + 결과 전 여백 1

    expect(resultNumbers()).toEqual(SORTED)
    expect(container.querySelector('.draw-skip')).toBeNull()

    click('.draw-confirm')
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('건너뛰기를 누르면 즉시 결과 컷으로 넘어간다', () => {
    renderOverlay()
    advance(MIX_MS)
    advanceReveals(1) // 연출 도중(1개 공개)
    click('.draw-skip')

    expect(resultNumbers()).toEqual(SORTED)
    expect(container.querySelector('.draw-confirm')).not.toBeNull()
  })

  it('언마운트하면 예약된 타이머가 정리된다 (유령 전이 없음)', () => {
    renderOverlay()
    advance(MIX_MS) // revealing 진입 — 다음 공개가 예약된 상태
    unmountOnce()
    expect(vi.getTimerCount()).toBe(0)
  })
})
