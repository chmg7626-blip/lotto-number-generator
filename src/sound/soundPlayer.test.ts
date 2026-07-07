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
  it('load는 이벤트별 음원을 한 번만 받아 디코드한다', async () => {
    const { player, fetched, context } = makePlayer()
    player.load()
    player.load()
    await flushAsync()
    expect(fetched).toHaveLength(SOUND_EVENTS.length)
    expect(fetched.some((u) => u.endsWith('/shoot.mp3'))).toBe(true)
    expect(context.decodeAudioData).toHaveBeenCalledTimes(SOUND_EVENTS.length)
  })

  it('play는 디코드된 버퍼로 소스를 만들어 즉시 시작하고, load 전에는 아무 일도 없다', async () => {
    const { player, sources } = makePlayer()
    player.play('shoot') // load 전 — 예외 없이 무시
    expect(sources).toHaveLength(0)
    player.load()
    await flushAsync()
    player.play('shoot')
    expect(sources).toHaveLength(1)
    expect(sources[0].start).toHaveBeenCalledTimes(1)
    expect(sources[0].buffer).not.toBeNull()
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
    player.stopAll()
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
