// 연출 사운드의 "요청"과 "실제 재생"을 분리하는 얇은 계층(확정 설계 docs/design/draw-sound.md).
// 컴포넌트는 SoundPlayer 인터페이스에 이벤트만 요청하고, 테스트는 mock을 주입해
// "언제 어떤 이벤트를 요청했는가"를 검증한다(실제 오디오 재생은 jsdom에서 검증 불가).

export type SoundEvent = 'shoot' | 'cutin' | 'suspense' | 'fanfare'

export interface SoundPlayer {
  load(): void
  play(event: SoundEvent): void
  stopAll(): void
  setMuted(muted: boolean): void
}

export const SOUND_EVENTS: SoundEvent[] = [
  'shoot',
  'cutin',
  'suspense',
  'fanfare',
]

// HTMLAudioElement 중 이 계층이 쓰는 표면만 — 테스트에서 가짜 객체를 주입하기 위한 최소 계약.
export type AudioLike = {
  play(): Promise<void> | void
  pause(): void
  currentTime: number
  muted: boolean
}

export type CreateAudio = (url: string) => AudioLike

// GitHub Pages는 /<repo>/ 서브패스로 배포되므로 절대경로 대신 BASE_URL로 조립한다(확정 설계 결정 3).
function soundUrl(event: SoundEvent): string {
  return `${import.meta.env.BASE_URL}sounds/${event}.mp3`
}

// 소리 실패는 연출을 막지 않는다(spec 요구 6) — 로드·재생·정지 실패를 전부 삼킨다.
function ignoreFailure(action: () => Promise<void> | void): void {
  try {
    const result = action()
    if (result instanceof Promise) result.catch(() => {})
  } catch {
    // 무시 — 소리 없이 연출이 계속된다.
  }
}

export function createHtmlAudioPlayer(
  createAudio: CreateAudio = (url) => new Audio(url),
): SoundPlayer {
  const audios = new Map<SoundEvent, AudioLike>()
  let muted = false

  return {
    load() {
      if (audios.size > 0) return
      for (const event of SOUND_EVENTS) {
        ignoreFailure(() => {
          const audio = createAudio(soundUrl(event))
          audio.muted = muted
          audios.set(event, audio)
        })
      }
    },
    play(event) {
      const audio = audios.get(event)
      if (!audio) return
      ignoreFailure(() => {
        audio.currentTime = 0
        return audio.play()
      })
    },
    stopAll() {
      for (const audio of audios.values()) {
        ignoreFailure(() => {
          audio.pause()
          audio.currentTime = 0
        })
      }
    },
    setMuted(next) {
      muted = next
      for (const audio of audios.values()) {
        ignoreFailure(() => {
          audio.muted = next
        })
      }
    },
  }
}
