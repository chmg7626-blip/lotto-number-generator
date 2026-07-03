import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import App from './App'
;(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

function renderApp() {
  act(() => {
    root.render(<App />)
  })
}

function click(selector: string) {
  const el = container.querySelector(selector)
  expect(el).not.toBeNull()
  act(() => {
    el!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
}

// jsdom에는 matchMedia가 없어 기본은 "연출 있음" 경로다. reduce 환경은 stub으로 만든다.
function stubReducedMotion(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({ matches } as MediaQueryList),
  )
}

function resultCutNumbers(): number[] {
  return Array.from(container.querySelectorAll('.draw-result-balls .ball')).map(
    (el) => Number(el.textContent),
  )
}

function ticketGameNumbers(gameIndex: number): number[] {
  const games = container.querySelectorAll('.ticket .game')
  expect(games.length).toBeGreaterThan(gameIndex)
  return Array.from(games[gameIndex].querySelectorAll('.ball')).map((el) =>
    Number(el.textContent),
  )
}

describe('App 추첨 연출 흐름', () => {
  it('뽑기 → 오버레이(용지 미반영·배경 차단) → 건너뛰기 → 확인 → 용지에 같은 번호', () => {
    renderApp()
    click('.drawbtn')

    // 오버레이가 뜨고, 확인 전에는 용지가 채워지지 않는다.
    expect(container.querySelector('.draw-overlay')).not.toBeNull()
    expect(container.querySelector('.ticket')).toBeNull()
    // 배경은 inert로 막히고 body 스크롤이 잠긴다(재클릭 차단 포함).
    expect(container.querySelector('.app-content')!.hasAttribute('inert')).toBe(
      true,
    )
    expect(document.body.style.overflow).toBe('hidden')

    click('.draw-skip')
    const revealed = resultCutNumbers()
    expect(revealed).toHaveLength(6)

    click('.draw-confirm')
    // 오버레이가 닫히고 잠금이 풀리며, 결과 컷과 같은 번호가 용지 게임 A에 있다.
    expect(container.querySelector('.draw-overlay')).toBeNull()
    expect(container.querySelector('.app-content')!.hasAttribute('inert')).toBe(
      false,
    )
    expect(document.body.style.overflow).toBe('')
    expect(ticketGameNumbers(0)).toEqual(revealed)
  })

  it('prefers-reduced-motion이면 오버레이 없이 즉시 용지에 반영된다', () => {
    stubReducedMotion(true)
    renderApp()
    click('.drawbtn')

    expect(container.querySelector('.draw-overlay')).toBeNull()
    expect(ticketGameNumbers(0)).toHaveLength(6)
  })

  it('×5 연속뽑기 — 게임 A만 연출하고 확인 후 5게임 모두 용지에 채워진다 (경계값)', () => {
    renderApp()
    const countButtons = Array.from(container.querySelectorAll('.cnt'))
    const times5 = countButtons.find((b) => b.textContent === '×5')
    expect(times5).not.toBeUndefined()
    act(() => {
      times5!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    click('.drawbtn')
    click('.draw-skip')
    // 연출(결과 컷)은 게임 A 6개뿐이다.
    expect(resultCutNumbers()).toHaveLength(6)

    click('.draw-confirm')
    expect(container.querySelectorAll('.ticket .game')).toHaveLength(5)
    for (let i = 0; i < 5; i++) {
      expect(ticketGameNumbers(i)).toHaveLength(6)
    }
  })
})
