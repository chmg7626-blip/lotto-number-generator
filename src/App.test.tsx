import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import App from './App'
import { EXPERT_QUIPS } from './components/expertQuips'
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
    outputLatencyMs: vi.fn(() => 0),
    startBgm: vi.fn(),
    stopBgm: vi.fn(),
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

describe('단골 빈도 설명', () => {
  function clickChip(label: string) {
    const chip = Array.from(container.querySelectorAll('.chip')).find(
      (b) => b.textContent === label,
    )
    expect(chip).not.toBeUndefined()
    act(() => {
      chip!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
  }

  it('frequent 모드로 뽑으면 게임마다 설명 한 줄이 보인다', () => {
    stubReducedMotion(true) // 연출 없이 바로 용지 확인
    renderApp()
    clickChip('역대 단골 번호')
    click('.drawbtn')

    const notes = container.querySelectorAll('.gnote')
    expect(notes).toHaveLength(
      container.querySelectorAll('.ticket .game').length,
    )
    const text = notes[0].textContent ?? ''
    expect(text).toContain('역대')
    expect(text).toContain('나왔어요')
    expect(text).not.toMatch(/당첨|보장|확률을 높/)
  })

  it('기본(random) 모드로 뽑으면 설명 줄이 없다', () => {
    stubReducedMotion(true)
    renderApp()
    click('.drawbtn')

    expect(container.querySelector('.ticket')).not.toBeNull()
    expect(container.querySelector('.gnote')).toBeNull()
  })
})

describe('전문가 훈수(패러디)', () => {
  it('용지에 멘트 풀의 문구 1개와 패러디 표시가 보인다', () => {
    renderApp()
    click('.drawbtn')
    click('.draw-skip')
    click('.draw-confirm')

    const quip = container.querySelector('.quip')
    expect(quip).not.toBeNull()
    const text = quip!.textContent ?? ''
    expect(EXPERT_QUIPS.some((q) => text.includes(q))).toBe(true)
    expect(text).toContain('패러디')
  })
})

describe('App 배경음악(BGM) 흐름', () => {
  // 페이지 아무 곳이나 클릭(자동재생 허용 제스처) — BGM 시작 신호.
  function firstClick() {
    act(() => {
      container.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
  }

  it('첫 클릭에서 로드와 BGM 루프를 시작한다 — 그 전에는 무음, 두 번째부터는 재시작 없음', () => {
    const player = renderApp()
    expect(player.startBgm).not.toHaveBeenCalled()
    firstClick()
    expect(player.load).toHaveBeenCalled()
    expect(player.startBgm).toHaveBeenCalledTimes(1)
    firstClick() // once — 두 번째 상호작용에서 다시 시작하지 않는다
    expect(player.startBgm).toHaveBeenCalledTimes(1)
  })

  it('첫 클릭이 곧 뽑기여도 시작→정지 순서가 보장돼 연출 중 BGM이 없다', () => {
    const player = renderApp()
    click('.drawbtn') // 페이지 첫 상호작용이 뽑기 버튼
    expect(player.startBgm).toHaveBeenCalledTimes(1)
    expect(player.stopBgm).toHaveBeenCalledTimes(1)
    // capture(문서)에서 시작이 먼저, React 핸들러의 정지가 나중 — 결과적으로 무음.
    expect(player.startBgm.mock.invocationCallOrder[0]).toBeLessThan(
      player.stopBgm.mock.invocationCallOrder[0],
    )
  })

  it('뽑기(연출 시작)에서 BGM을 멈추고, 확인으로 닫으면 다시 시작한다', () => {
    const player = renderApp()
    firstClick()
    player.startBgm.mockClear()

    click('.drawbtn')
    expect(player.stopBgm).toHaveBeenCalledTimes(1)
    expect(player.startBgm).not.toHaveBeenCalled() // 연출 중에는 음악 없음

    click('.draw-skip')
    click('.draw-confirm')
    expect(player.startBgm).toHaveBeenCalledTimes(1)
  })

  it('reduced-motion(연출 없음)에서는 뽑기가 BGM을 멈추지 않는다', () => {
    stubReducedMotion(true)
    const player = renderApp()
    firstClick()
    click('.drawbtn')
    expect(player.stopBgm).not.toHaveBeenCalled()
  })

  it('홈 상시 토글이 보이고, 누르면 즉시 음소거되며 저장돼 재마운트 후 유지된다', () => {
    const player = renderApp()
    const toggle = container.querySelector('.home-sound-toggle')
    expect(toggle).not.toBeNull()
    expect(toggle!.textContent).toContain('소리 켬')

    click('.home-sound-toggle')
    expect(player.setMuted).toHaveBeenLastCalledWith(true)
    expect(toggle!.textContent).toContain('소리 꺼짐')

    act(() => root.unmount())
    root = createRoot(container)
    const nextPlayer = renderApp()
    expect(nextPlayer.setMuted).toHaveBeenLastCalledWith(true)
  })
})

describe('App 사운드 흐름', () => {
  it('뽑기 클릭 전에는 어떤 소리 요청도 없고, 클릭하면 음원 로드가 시작된다', () => {
    const player = renderApp()
    expect(player.load).not.toHaveBeenCalled()
    expect(player.play).not.toHaveBeenCalled()

    click('.drawbtn')
    expect(player.load).toHaveBeenCalled() // 제스처(BGM 시작)와 뽑기 경로 양쪽에서 요청될 수 있다
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

  it('prefers-reduced-motion이면 연출 효과음 요청이 없다 (BGM 시작·로드는 제스처 몫)', () => {
    stubReducedMotion(true)
    const player = renderApp()
    click('.drawbtn')
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
