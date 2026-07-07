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

// 사운드는 요청 시점만 검증한다 — 실제 재생 대신 mock을 주입한다(spec 요구 10).
// 출력 지연 기본 0 = 보상 없음(소리와 화면 전환이 같은 시점).
function makeMockPlayer(outputLatencyMs = 0) {
  return {
    load: vi.fn(),
    play: vi.fn(),
    stopAll: vi.fn(),
    setMuted: vi.fn(),
    outputLatencyMs: vi.fn(() => outputLatencyMs),
    startBgm: vi.fn(),
    stopBgm: vi.fn(),
  }
}

function renderOverlay(
  onConfirm: () => void = () => {},
  soundPlayer = makeMockPlayer(),
  onToggleSound: () => void = () => {},
) {
  act(() => {
    root.render(
      <DrawOverlay
        revealOrder={REVEAL_ORDER}
        sortedNumbers={SORTED}
        onConfirm={onConfirm}
        soundPlayer={soundPlayer}
        soundOn={true}
        onToggleSound={onToggleSound}
      />,
    )
  })
  return soundPlayer
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

describe('DrawOverlay 사운드 요청', () => {
  it('공개마다 shoot→cutin, 마지막 공 앞 suspense, 마지막 컷인에서 stopAll 후 fanfare 순으로 요청한다', () => {
    const player = renderOverlay()
    expect(player.play).not.toHaveBeenCalled() // mixing에는 이벤트 효과음이 없다

    advance(MIX_MS)
    for (let i = 0; i < 5; i++) advanceOneReveal()
    advance(SUSPENSE_MS)
    advance(SHOOT_MS)
    // 마지막 공 대형 컷인: 번호 공개와 동기로 팡파르(컷인 팝 대신 — spec 요구 2).
    const pairs = Array.from({ length: 5 }, () => ['shoot', 'cutin']).flat()
    expect(player.play.mock.calls.map(([event]) => event)).toEqual([
      ...pairs,
      'suspense',
      'shoot',
      'fanfare',
    ])
    // 팡파르 전에 나머지 소리를 정리한다.
    expect(player.stopAll).toHaveBeenCalledTimes(1)
    const fanfareOrder =
      player.play.mock.invocationCallOrder[player.play.mock.calls.length - 1]
    expect(player.stopAll.mock.invocationCallOrder[0]).toBeLessThan(
      fanfareOrder,
    )

    // 결과 컷 진입에서는 팡파르를 다시 재생하지 않는다(1회 보장).
    advance(SHOWCASE_FINAL_MS)
    expect(
      player.play.mock.calls.filter(([event]) => event === 'fanfare'),
    ).toHaveLength(1)
    expect(player.stopAll).toHaveBeenCalledTimes(1)
  })

  it('건너뛰기 시 stopAll 후 fanfare 1회 — 어긋난 효과음이 남지 않는다', () => {
    const player = renderOverlay()
    advance(MIX_MS)
    advanceOneReveal() // 연출 도중
    player.play.mockClear()
    player.stopAll.mockClear()

    click('.draw-skip')
    expect(player.stopAll).toHaveBeenCalledTimes(1)
    expect(player.play.mock.calls.map(([event]) => event)).toEqual(['fanfare'])

    // 결과 컷 이후 타이머가 더 흘러도 추가 요청이 없다(팡파르 1회 보장).
    advance(SHOWCASE_FINAL_MS + SUSPENSE_MS)
    expect(player.play).toHaveBeenCalledTimes(1)
  })

  it('출력 지연만큼 소리를 화면 전환보다 먼저 요청한다 (보상)', () => {
    const player = renderOverlay(() => {}, makeMockPlayer(100))

    // mixing 종료 100ms 전: 첫 shoot 소리가 먼저 출발하고, 화면은 아직 mixing이다.
    advance(MIX_MS - 100)
    expect(player.play.mock.calls.map(([event]) => event)).toEqual(['shoot'])
    advance(100) // 화면이 shooting으로 전환

    // shooting 종료 100ms 전: cutin 소리가 먼저, 컷인 공 표시는 아직 없다.
    advance(SHOOT_MS - 100)
    expect(player.play.mock.calls.map(([event]) => event)).toEqual([
      'shoot',
      'cutin',
    ])
    expect(cutinNumber()).toBeNull()
    advance(100)
    expect(cutinNumber()).toBe(44)
  })

  it('음소거 토글 버튼이 onToggleSound를 호출한다', () => {
    const onToggleSound = vi.fn()
    renderOverlay(() => {}, makeMockPlayer(), onToggleSound)
    click('.draw-sound-toggle')
    expect(onToggleSound).toHaveBeenCalledTimes(1)
  })
})
