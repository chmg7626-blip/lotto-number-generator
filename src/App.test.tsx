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
  window.localStorage.clear()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

// 사운드는 요청 시점만 검증한다 — 실제 재생 대신 mock을 주입한다(spec 요구 10).
function makeMockPlayer() {
  return {
    load: vi.fn(),
    play: vi.fn(),
    stopAll: vi.fn(),
    setMuted: vi.fn(),
  }
}

function renderApp(soundPlayer = makeMockPlayer()) {
  act(() => {
    root.render(<App soundPlayer={soundPlayer} />)
  })
  return soundPlayer
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

describe('용지 구매 링크', () => {
  it('확인 후 용지에 동행복권 구매 링크가 새 탭으로 열리게 있다', () => {
    renderApp()
    click('.drawbtn')
    click('.draw-skip')
    click('.draw-confirm')

    const link = container.querySelector<HTMLAnchorElement>('.buylink')
    expect(link).not.toBeNull()
    expect(link!.href).toBe('https://dhlottery.co.kr/')
    expect(link!.target).toBe('_blank')
    expect(link!.rel).toContain('noopener')
  })
})

describe('App 사운드 흐름', () => {
  it('뽑기 클릭 전에는 어떤 소리 요청도 없고, 클릭하면 음원 로드가 시작된다', () => {
    const player = renderApp()
    expect(player.load).not.toHaveBeenCalled()
    expect(player.play).not.toHaveBeenCalled()

    click('.drawbtn')
    expect(player.load).toHaveBeenCalledTimes(1)
    expect(player.play).not.toHaveBeenCalledWith('fanfare') // 연출 소리는 오버레이 phase 몫
  })

  it('확인으로 오버레이를 닫으면 모든 소리가 멈춘다', () => {
    const player = renderApp()
    click('.drawbtn')
    click('.draw-skip')
    player.stopAll.mockClear() // 결과 컷 진입(팡파르 전 정리) 몫은 제외
    click('.draw-confirm')
    expect(player.stopAll).toHaveBeenCalledTimes(1)
  })

  it('prefers-reduced-motion이면 소리 요청도 없다', () => {
    stubReducedMotion(true)
    const player = renderApp()
    click('.drawbtn')
    expect(player.load).not.toHaveBeenCalled()
    expect(player.play).not.toHaveBeenCalled()
  })

  it('첫 방문(저장값 없음)은 기본 ON — muted=false로 반영된다', () => {
    const player = renderApp()
    expect(player.setMuted).toHaveBeenLastCalledWith(false)
  })

  it('오버레이 토글이 즉시 반영되고 localStorage에 저장돼 재마운트 후 유지된다', () => {
    const player = renderApp()
    click('.drawbtn')
    click('.draw-sound-toggle')
    expect(player.setMuted).toHaveBeenLastCalledWith(true)

    // 재마운트(새 방문) — 저장된 OFF가 복원된다.
    act(() => root.unmount())
    root = createRoot(container)
    const nextPlayer = renderApp()
    expect(nextPlayer.setMuted).toHaveBeenLastCalledWith(true)
  })
})
