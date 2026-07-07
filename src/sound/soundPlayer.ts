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
  // 스피커·이어폰까지의 출력 지연 추정(ms). 연출이 소리를 이만큼 먼저 출발시켜
  // "귀에 닿는 시점"을 화면과 맞춘다. 추정치가 없으면 0(보상 없음 — 기존 동작).
  outputLatencyMs(): number
  // 홈 배경음악(루프). 효과음과 분리된 낮은 음량 게인을 쓰고, stopAll에 안 멈춘다 —
  // 연출 시작(정지)·종료(재개)는 App이 소유한다(2026-07-07 BGM 재도입).
  startBgm(): void
  stopBgm(): void
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
  loop: boolean
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
  // 출력 지연 추정(초). outputLatency는 하드웨어 경로 전체, baseLatency는 처리 지연만 —
  // 브라우저에 따라 없을 수 있어 둘 다 선택 속성이다.
  outputLatency?: number
  baseLatency?: number
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
function soundUrl(name: SoundEvent | 'bgm'): string {
  return `${import.meta.env.BASE_URL}sounds/${name}.mp3`
}

// 배경음악은 효과음보다 한참 낮게 깐다("소리 너무 크지 않게" — 2026-07-07 사용자 요구).
const BGM_GAIN = 0.35

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
  // 이벤트별 디코드 프라미스 — 완료된 버퍼가 아니라 프라미스를 두는 이유는, 디코드가 끝나기
  // 전에 들어온 play 요청(로드 직후 건너뛰기 등)을 버리지 않고 완료 시점에 재생하기 위해서다.
  // 팡파르는 호출부가 1회 플래그를 먼저 세워 재시도가 없다(spec 요구 5 — 조용히 버리면 회귀).
  const buffers = new Map<SoundEvent, Promise<unknown>>()
  const activeSources = new Set<BufferSourceLike>()
  // stopAll 세대 표식: 정지 후에 디코드가 끝난 지연 재생이 뒤늦게 시작되지 않게 한다.
  let stopEpoch = 0
  let muted = false
  // BGM: 별도 게인(마스터 게인에 연결 — 음소거가 함께 적용됨)과 단일 루프 소스.
  let bgmGain: GainLike | null = null
  let bgmBuffer: Promise<unknown> | null = null
  let bgmSource: BufferSourceLike | null = null
  // stopBgm 세대 표식: 디코드 대기 중 정지된 시작 요청이 뒤늦게 울리지 않게 한다.
  let bgmEpoch = 0

  return {
    // 클릭 제스처 체인 안에서 호출된다(자동재생 정책 — 확정 설계 결정 2).
    load() {
      if (context) return
      ignoreFailure(() => {
        context = deps.createContext()
        gain = context.createGain()
        gain.gain.value = muted ? 0 : 1
        gain.connect(context.destination)
        for (const event of SOUND_EVENTS) {
          const decoded = deps
            .fetchData(soundUrl(event))
            .then((data) => context!.decodeAudioData(data))
          decoded.catch(() => {}) // 실패는 재생 시점에 무시된다 — unhandled rejection만 막는다
          buffers.set(event, decoded)
        }
        bgmGain = context.createGain()
        bgmGain.gain.value = BGM_GAIN
        bgmGain.connect(gain)
        bgmBuffer = deps
          .fetchData(soundUrl('bgm'))
          .then((data) => context!.decodeAudioData(data))
        bgmBuffer.catch(() => {})
      })
    },
    play(event) {
      const decoded = buffers.get(event)
      if (!context || !gain || !decoded) return
      // 제스처 밖(타이머 콜백)에서 컨텍스트가 잠들어 있으면 깨운다 — 페이지는 이미 클릭됐다.
      if (context.state === 'suspended') ignoreFailure(() => context!.resume())
      const epoch = stopEpoch
      ignoreFailure(() =>
        decoded.then((buffer) => {
          if (epoch !== stopEpoch) return // 대기 중 stopAll — 시작하지 않는다
          const source = context!.createBufferSource()
          source.buffer = buffer
          source.connect(gain!)
          activeSources.add(source)
          source.onended = () => activeSources.delete(source)
          source.start()
        }),
      )
    },
    stopAll() {
      stopEpoch++
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
    outputLatencyMs() {
      if (!context) return 0
      const seconds = context.outputLatency ?? context.baseLatency ?? 0
      return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : 0
    },
    startBgm() {
      if (!context || !bgmGain || !bgmBuffer || bgmSource) return
      if (context.state === 'suspended') ignoreFailure(() => context!.resume())
      const epoch = bgmEpoch
      ignoreFailure(() =>
        bgmBuffer!.then((buffer) => {
          if (epoch !== bgmEpoch || bgmSource) return // 대기 중 정지·중복 시작 방지
          const source = context!.createBufferSource()
          source.buffer = buffer
          source.loop = true
          source.connect(bgmGain!)
          bgmSource = source
          source.start()
        }),
      )
    },
    stopBgm() {
      bgmEpoch++
      if (bgmSource) {
        const source = bgmSource
        bgmSource = null
        ignoreFailure(() => source.stop())
      }
    },
  }
}
