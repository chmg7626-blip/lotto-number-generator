import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import {
  DrawOverlay,
  MIX_MS,
  SHOOT_MS,
  SHOWCASE_MS,
  SHOWCASE_FINAL_MS,
  SUSPENSE_MS,
} from './DrawOverlay'

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
// 한 번의 act 안에서 여러 단계를 한꺼번에 진행할 수 없다 — 단계별로 진행한다.
// 공개 1회 = 슛(SHOOT_MS) → 컷인(SHOWCASE_MS) → 트레이 안착.
function advanceOneReveal() {
  advance(SHOOT_MS)
  advance(SHOWCASE_MS)
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

function cutinNumber(): number | null {
  const el = container.querySelector('.draw-cutin .ball')
  return el ? Number(el.textContent) : null
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
    expect(cutinNumber()).toBeNull()
    expect(container.querySelector('.draw-skip')).not.toBeNull()
    expect(container.querySelector('.draw-confirm')).toBeNull()
  })

  it('공 하나마다 슛 → 컷인(뽑힌 순서) → 트레이 안착 순으로 공개된다', () => {
    renderOverlay()
    advance(MIX_MS)
    // 슛 중: 아직 컷인도 트레이도 없다.
    expect(cutinNumber()).toBeNull()
    expect(trayNumbers()).toEqual([])

    advance(SHOOT_MS)
    // 컷인: 첫 공(뽑힌 순서, 정렬 안 됨)이 크게 공개되고, 트레이엔 아직 없다.
    expect(cutinNumber()).toBe(44)
    expect(trayNumbers()).toEqual([])

    advance(SHOWCASE_MS)
    // 안착: 트레이에 들어가고 다음 슛으로 넘어간다.
    expect(trayNumbers()).toEqual([44])
    expect(cutinNumber()).toBeNull()

    advanceOneReveal()
    expect(trayNumbers()).toEqual([44, 3])
  })

  it('5개 공개 후 서스펜스를 거쳐 마지막 공 → 결과 컷(오름차순)·확인', () => {
    const onConfirm = vi.fn()
    renderOverlay(onConfirm)
    advance(MIX_MS)
    for (let i = 0; i < 5; i++) advanceOneReveal()
    expect(trayNumbers()).toEqual([44, 3, 27, 11, 45])

    // 서스펜스: 아직 마지막 공이 안 나왔다.
    expect(container.querySelector('.draw-confirm')).toBeNull()
    advance(SUSPENSE_MS)
    // 마지막 공 컷인은 final 강화(더 크게·더 길게)로 표시된다.
    advance(SHOOT_MS)
    expect(container.querySelector('.draw-cutin.final')).not.toBeNull()
    advance(SHOWCASE_FINAL_MS)

    expect(resultNumbers()).toEqual(SORTED)
    expect(container.querySelector('.draw-skip')).toBeNull()

    click('.draw-confirm')
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('건너뛰기를 누르면 즉시 결과 컷으로 넘어간다', () => {
    renderOverlay()
    advance(MIX_MS)
    advanceOneReveal() // 연출 도중(1개 공개)
    click('.draw-skip')

    expect(resultNumbers()).toEqual(SORTED)
    expect(container.querySelector('.draw-confirm')).not.toBeNull()
  })

  it('언마운트하면 예약된 타이머가 정리된다 (유령 전이 없음)', () => {
    renderOverlay()
    advance(MIX_MS) // 첫 슛이 예약된 상태
    unmountOnce()
    expect(vi.getTimerCount()).toBe(0)
  })
})
