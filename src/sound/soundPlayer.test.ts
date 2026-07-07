import { describe, it, expect, vi } from 'vitest'
import { createWebAudioPlayer, SOUND_EVENTS } from './soundPlayer'
import type {
  AudioContextLike,
  BufferSourceLike,
  GainLike,
} from './soundPlayer'

// load의 fetch→decode 프라미스 체인을 끝까지 흘려보낸다.
function flushAsync(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

function makeFakeContext(state = 'running') {
  const sources: BufferSourceLike[] = []
  const gains: GainLike[] = []
  const context: AudioContextLike = {
    state,
    destination: { name: 'destination' },
    resume: vi.fn(() => Promise.resolve()),
    decodeAudioData: vi.fn((data: ArrayBuffer) =>
      Promise.resolve({ decoded: data }),
    ),
    createGain: vi.fn(() => {
      const gain: GainLike = { gain: { value: 1 }, connect: vi.fn() }
      gains.push(gain)
      return gain
    }),
    createBufferSource: vi.fn(() => {
      const source: BufferSourceLike = {
        buffer: null,
        loop: false,
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        onended: null,
      }
      sources.push(source)
      return source
    }),
  }
  return { context, sources, gains }
}

function makePlayer(state = 'running') {
  const fake = makeFakeContext(state)
  const fetched: string[] = []
  const fetchData = vi.fn((url: string) => {
    fetched.push(url)
    return Promise.resolve(new ArrayBuffer(8))
  })
  const player = createWebAudioPlayer({
    createContext: () => fake.context,
    fetchData,
  })
  return { player, ...fake, fetched }
}

describe('createWebAudioPlayer', () => {
  it('load는 이벤트별 음원과 BGM을 한 번만 받아 디코드한다', async () => {
    const { player, fetched, context } = makePlayer()
    player.load()
    player.load()
    await flushAsync()
    expect(fetched).toHaveLength(SOUND_EVENTS.length + 1) // 효과음 4 + bgm
    expect(fetched.some((u) => u.endsWith('/shoot.mp3'))).toBe(true)
    expect(context.decodeAudioData).toHaveBeenCalledTimes(
      SOUND_EVENTS.length + 1,
    )
  })

  it('play는 디코드된 버퍼로 소스를 만들어 시작하고, load 전에는 아무 일도 없다', async () => {
    const { player, sources } = makePlayer()
    player.play('shoot') // load 전 — 예외 없이 무시
    expect(sources).toHaveLength(0)
    player.load()
    await flushAsync()
    player.play('shoot')
    await flushAsync() // 디코드 프라미스 경유 — 마이크로태스크 뒤에 시작된다
    expect(sources).toHaveLength(1)
    expect(sources[0].start).toHaveBeenCalledTimes(1)
    expect(sources[0].buffer).not.toBeNull()
  })

  it('디코드가 끝나기 전의 play 요청은 버려지지 않고 완료 시 재생된다 (로드 직후 건너뛰기)', async () => {
    const fake = makeFakeContext()
    let resolveFetch!: (data: ArrayBuffer) => void
    const pending = new Promise<ArrayBuffer>((resolve) => {
      resolveFetch = resolve
    })
    const player = createWebAudioPlayer({
      createContext: () => fake.context,
      fetchData: () => pending,
    })
    player.load()
    player.play('fanfare') // 아직 디코드 전 — 팡파르는 호출부 1회 플래그 때문에 재시도가 없다
    expect(fake.sources).toHaveLength(0)
    resolveFetch(new ArrayBuffer(8))
    await flushAsync()
    expect(fake.sources).toHaveLength(1)
    expect(fake.sources[0].start).toHaveBeenCalledTimes(1)
  })

  it('디코드 대기 중 stopAll이 오면 뒤늦게 시작되지 않는다', async () => {
    const fake = makeFakeContext()
    let resolveFetch!: (data: ArrayBuffer) => void
    const pending = new Promise<ArrayBuffer>((resolve) => {
      resolveFetch = resolve
    })
    const player = createWebAudioPlayer({
      createContext: () => fake.context,
      fetchData: () => pending,
    })
    player.load()
    player.play('shoot')
    player.stopAll()
    resolveFetch(new ArrayBuffer(8))
    await flushAsync()
    expect(fake.sources).toHaveLength(0)
  })

  it('컨텍스트가 suspended면 play가 resume을 요청한다', async () => {
    const { player, context } = makePlayer('suspended')
    player.load()
    await flushAsync()
    player.play('cutin')
    expect(context.resume).toHaveBeenCalled()
  })

  it('stopAll은 재생 중인 소스를 모두 멈춘다', async () => {
    const { player, sources } = makePlayer()
    player.load()
    await flushAsync()
    player.play('shoot')
    player.play('fanfare')
    await flushAsync() // 두 소스가 실제로 시작된 뒤 멈춘다
    player.stopAll()
    expect(sources).toHaveLength(2)
    for (const source of sources) {
      expect(source.stop).toHaveBeenCalled()
    }
  })

  it('setMuted는 gain에 즉시 반영되고, load 전에 설정해도 적용된다', async () => {
    const { player, gains } = makePlayer()
    player.setMuted(true) // load 전에 설정(첫 방문에 저장된 OFF 복원 경로)
    player.load()
    await flushAsync()
    expect(gains[0].gain.value).toBe(0)
    player.setMuted(false)
    expect(gains[0].gain.value).toBe(1)
  })

  it('로드 실패(fetch reject) 후 play는 조용히 무시된다', async () => {
    const fake = makeFakeContext()
    const player = createWebAudioPlayer({
      createContext: () => fake.context,
      fetchData: () => Promise.reject(new Error('offline')),
    })
    player.load()
    await flushAsync()
    expect(() => player.play('shoot')).not.toThrow()
    expect(fake.sources).toHaveLength(0)
  })

  it('재생 실패(소스 생성 throw)가 밖으로 던져지지 않는다', async () => {
    const fake = makeFakeContext()
    fake.context.createBufferSource = vi.fn(() => {
      throw new Error('broken')
    })
    const player = createWebAudioPlayer({
      createContext: () => fake.context,
      fetchData: () => Promise.resolve(new ArrayBuffer(8)),
    })
    player.load()
    await flushAsync()
    expect(() => player.play('shoot')).not.toThrow()
    expect(() => player.stopAll()).not.toThrow()
  })

  it('startBgm은 낮은 게인의 루프 소스를 1개만 만들고, stopAll에는 멈추지 않는다', async () => {
    const { player, sources, gains, fetched } = makePlayer()
    player.load()
    await flushAsync()
    expect(fetched.some((u) => u.endsWith('/bgm.mp3'))).toBe(true)

    player.startBgm()
    player.startBgm() // 중복 시작 무시
    await flushAsync()
    expect(sources).toHaveLength(1)
    expect(sources[0].loop).toBe(true)
    expect(sources[0].start).toHaveBeenCalledTimes(1)
    // 마스터(1) 외에 BGM 전용 게인이 낮은 값으로 하나 더 있다.
    expect(gains).toHaveLength(2)
    expect(gains[1].gain.value).toBeLessThan(1)

    player.stopAll() // 효과음 정지가 BGM을 건드리지 않는다
    expect(sources[0].stop).not.toHaveBeenCalled()
    player.stopBgm()
    expect(sources[0].stop).toHaveBeenCalledTimes(1)
  })

  it('디코드 대기 중 stopBgm이 오면 BGM이 뒤늦게 시작되지 않는다', async () => {
    const fake = makeFakeContext()
    let resolveFetch!: (data: ArrayBuffer) => void
    const pending = new Promise<ArrayBuffer>((resolve) => {
      resolveFetch = resolve
    })
    const player = createWebAudioPlayer({
      createContext: () => fake.context,
      fetchData: () => pending,
    })
    player.load()
    player.startBgm()
    player.stopBgm()
    resolveFetch(new ArrayBuffer(8))
    await flushAsync()
    expect(fake.sources).toHaveLength(0)
  })

  it('outputLatencyMs는 컨텍스트의 출력 지연(초)을 ms로 돌려주고, 없으면 baseLatency→0 순으로 폴백한다', () => {
    const withOutput = makePlayer()
    expect(withOutput.player.outputLatencyMs()).toBe(0) // load 전 — 컨텍스트 없음
    withOutput.context.outputLatency = 0.12
    withOutput.player.load()
    expect(withOutput.player.outputLatencyMs()).toBeCloseTo(120)

    const withBase = makePlayer()
    withBase.context.baseLatency = 0.02
    withBase.player.load()
    expect(withBase.player.outputLatencyMs()).toBeCloseTo(20)

    const withNeither = makePlayer()
    withNeither.player.load()
    expect(withNeither.player.outputLatencyMs()).toBe(0)
  })

  it('컨텍스트 생성 실패도 예외를 던지지 않는다', () => {
    const player = createWebAudioPlayer({
      createContext: () => {
        throw new Error('no web audio support')
      },
      fetchData: () => Promise.resolve(new ArrayBuffer(8)),
    })
    expect(() => player.load()).not.toThrow()
    expect(() => player.play('shoot')).not.toThrow()
    expect(() => player.setMuted(true)).not.toThrow()
  })
})
