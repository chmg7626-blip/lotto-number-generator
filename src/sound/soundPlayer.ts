// 연출 사운드의 "요청"과 "실제 재생"을 분리하는 얇은 계층(확정 설계 docs/design/draw-sound.md).
// 컴포넌트는 SoundPlayer 인터페이스에 이벤트만 요청하고, 테스트는 mock을 주입해
// "언제 어떤 이벤트를 요청했는가"를 검증한다(실제 오디오 재생은 jsdom에서 검증 불가).
//
// 재생 구현은 Web Audio API다 — HTMLAudioElement.play()는 호출부터 발음까지 브라우저
// 파이프라인 지연이 매번 붙어 화면과 어긋났다(2026-07-07 배포 후 체감 피드백: 소리가 매번
// 늦음). 미리 디코드한 버퍼를 BufferSource로 즉시 시작하면 시작 지연이 거의 없다.

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

// Web Audio 중 이 계층이 쓰는 표면만 — 테스트에서 가짜 객체를 주입하기 위한 최소 계약.
export type BufferSourceLike = {
  buffer: unknown
  connect(node: unknown): void
  start(): void
  stop(): void
  // DOM의 onended는 (this, ev) 시그니처라 함수 타입으로 좁히면 AudioContext가
  // 이 계약에 안 맞는다. 우리는 대입만 하므로 unknown으로 둔다.
  onended: unknown
}

export type GainLike = {
  gain: { value: number }
  connect(node: unknown): void
}

export type AudioContextLike = {
  state: string
  destination: unknown
  resume(): Promise<void> | void
  decodeAudioData(data: ArrayBuffer): Promise<unknown>
  createGain(): GainLike
  createBufferSource(): BufferSourceLike
}

export type WebAudioDeps = {
  createContext: () => AudioContextLike
  fetchData: (url: string) => Promise<ArrayBuffer>
}

// GitHub Pages는 /<repo>/ 서브패스로 배포되므로 절대경로 대신 BASE_URL로 조립한다(확정 설계 결정 3).
function soundUrl(event: SoundEvent): string {
  return `${import.meta.env.BASE_URL}sounds/${event}.mp3`
}

// 소리 실패는 연출을 막지 않는다(spec 요구 6) — 로드·디코드·재생·정지 실패를 전부 삼킨다.
function ignoreFailure(action: () => Promise<unknown> | unknown): void {
  try {
    const result = action()
    if (result instanceof Promise) result.catch(() => {})
  } catch {
    // 무시 — 소리 없이 연출이 계속된다.
  }
}

const defaultDeps: WebAudioDeps = {
  createContext: () => new AudioContext(),
  fetchData: (url) => fetch(url).then((response) => response.arrayBuffer()),
}

export function createWebAudioPlayer(
  deps: WebAudioDeps = defaultDeps,
): SoundPlayer {
  let context: AudioContextLike | null = null
  let gain: GainLike | null = null
  const buffers = new Map<SoundEvent, unknown>()
  const activeSources = new Set<BufferSourceLike>()
  let muted = false

  return {
    // 클릭 제스처 체인 안에서 호출된다(자동재생 정책 — 확정 설계 결정 2).
    // 디코드는 비동기지만 믹싱 700ms 안에 끝나는 크기이고, 못 끝나면 그 소리만 조용히 건너뛴다.
    load() {
      if (context) return
      ignoreFailure(() => {
        context = deps.createContext()
        gain = context.createGain()
        gain.gain.value = muted ? 0 : 1
        gain.connect(context.destination)
        for (const event of SOUND_EVENTS) {
          ignoreFailure(() =>
            deps
              .fetchData(soundUrl(event))
              .then((data) => context!.decodeAudioData(data))
              .then((buffer) => {
                buffers.set(event, buffer)
              }),
          )
        }
      })
    },
    play(event) {
      const buffer = buffers.get(event)
      if (!context || !gain || !buffer) return
      // 제스처 밖(타이머 콜백)에서 컨텍스트가 잠들어 있으면 깨운다 — 페이지는 이미 클릭됐다.
      if (context.state === 'suspended') ignoreFailure(() => context!.resume())
      ignoreFailure(() => {
        const source = context!.createBufferSource()
        source.buffer = buffer
        source.connect(gain!)
        activeSources.add(source)
        source.onended = () => activeSources.delete(source)
        source.start()
      })
    },
    stopAll() {
      for (const source of activeSources) {
        ignoreFailure(() => source.stop())
      }
      activeSources.clear()
    },
    // 음소거는 정지가 아니라 무음이다(확정 설계 결정 4) — 진행 중 소리도 즉시 조용해진다.
    setMuted(next) {
      muted = next
      if (gain) gain.gain.value = next ? 0 : 1
    },
  }
}
