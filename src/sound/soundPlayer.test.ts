import { describe, it, expect, vi } from 'vitest'
import { createHtmlAudioPlayer, SOUND_EVENTS } from './soundPlayer'

function makeFakeAudio(url: string) {
  return {
    url,
    play: vi.fn<() => Promise<void>>(() => Promise.resolve()),
    pause: vi.fn<() => void>(),
    currentTime: 0,
    muted: false,
    loop: false,
  }
}

type FakeAudio = ReturnType<typeof makeFakeAudio>

function makePlayer() {
  const created: FakeAudio[] = []
  const player = createHtmlAudioPlayer((url) => {
    const audio = makeFakeAudio(url)
    created.push(audio)
    return audio
  })
  return { player, created }
}

describe('createHtmlAudioPlayer', () => {
  it('load는 이벤트별 오디오를 한 번만 만들고 bgm만 loop다', () => {
    const { player, created } = makePlayer()
    player.load()
    player.load()
    expect(created).toHaveLength(SOUND_EVENTS.length)
    for (const audio of created) {
      expect(audio.loop).toBe(audio.url.endsWith('/bgm.mp3'))
    }
  })

  it('play는 해당 이벤트 오디오를 처음부터 재생하고, load 전에는 아무 일도 없다', () => {
    const { player, created } = makePlayer()
    player.play('shoot') // load 전 — 예외 없이 무시
    player.load()
    const shoot = created.find((a) => a.url.endsWith('/shoot.mp3'))!
    shoot.currentTime = 3
    player.play('shoot')
    expect(shoot.play).toHaveBeenCalledTimes(1)
    expect(shoot.currentTime).toBe(0)
  })

  it('play(bgm)은 되감지 않고 멈춘 지점부터 이어서 재생한다', () => {
    const { player, created } = makePlayer()
    player.load()
    const bgm = created.find((a) => a.url.endsWith('/bgm.mp3'))!
    bgm.currentTime = 12
    player.play('bgm')
    expect(bgm.play).toHaveBeenCalledTimes(1)
    expect(bgm.currentTime).toBe(12)
  })

  it('stopAll은 모두 멈추되 효과음만 되감고 bgm 위치는 보존한다', () => {
    const { player, created } = makePlayer()
    player.load()
    for (const audio of created) audio.currentTime = 5
    player.stopAll()
    for (const audio of created) {
      expect(audio.pause).toHaveBeenCalled()
      expect(audio.currentTime).toBe(audio.url.endsWith('/bgm.mp3') ? 5 : 0)
    }
  })

  it('setMuted는 전체 오디오에 즉시 반영되고, load 이후 생성분에도 적용된다', () => {
    const { player, created } = makePlayer()
    player.setMuted(true) // load 전에 설정(첫 방문에 저장된 OFF 복원 경로)
    player.load()
    for (const audio of created) expect(audio.muted).toBe(true)
    player.setMuted(false)
    for (const audio of created) expect(audio.muted).toBe(false)
  })

  it('재생 실패(reject·throw)가 밖으로 던져지지 않는다', () => {
    const player = createHtmlAudioPlayer((url) => {
      const audio = makeFakeAudio(url)
      audio.play = vi.fn<() => Promise<void>>(() =>
        Promise.reject(new Error('blocked')),
      )
      audio.pause = vi.fn<() => void>(() => {
        throw new Error('broken')
      })
      return audio
    })
    player.load()
    expect(() => player.play('bgm')).not.toThrow()
    expect(() => player.stopAll()).not.toThrow()
  })

  it('오디오 생성 실패도 예외를 던지지 않는다', () => {
    const player = createHtmlAudioPlayer(() => {
      throw new Error('no audio support')
    })
    expect(() => player.load()).not.toThrow()
    expect(() => player.play('bgm')).not.toThrow()
  })
})
