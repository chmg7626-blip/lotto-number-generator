import { useEffect, useMemo, useRef, useState } from 'react'
import drawsData from './data/draws.sample.json'
import type { Draw, DrawsFile, GenerateMode } from './domain/types'
import {
  calculateFrequencies,
  generateRandom,
  generateWeighted,
  generateWithFixed,
} from './domain/lotto'
import { DisclaimerBanner } from './components/DisclaimerBanner'
import { WinningBar } from './components/WinningBar'
import { GeneratorPanel } from './components/GeneratorPanel'
import type { DrawResult } from './components/GeneratorPanel'
import { PrizeTable } from './components/PrizeTable'
import { FrequencyGrid } from './components/FrequencyGrid'
import { DrawOverlay } from './components/DrawOverlay'
import { revealSequence } from './components/drawReveal'
import { createHtmlAudioPlayer } from './sound/soundPlayer'
import type { SoundPlayer } from './sound/soundPlayer'
import { loadSoundOn, saveSoundOn } from './storage/soundPreference'

// 샘플 데이터(실제 당첨번호 아님 — src/data/README.md). 배포 전 실데이터로 교체한다.
const draws = (drawsData as DrawsFile).draws

// 회차 당첨번호 띠에 쓸 최신(회차 번호 최대) 회차. 데이터가 없으면 null.
function latestDraw(list: Draw[]): Draw | null {
  if (list.length === 0) return null
  return list.reduce((latest, d) => (d.round > latest.round ? d : latest))
}

// 확정된 번호를 오버레이 확인 전까지 보관한다(확인 후에만 용지 반영 — 확정 설계 핵심 결정 2).
// revealOrder는 게임 A만 만든다(×2~×5도 첫 게임만 연출 — spec 요구 4).
type PendingDraw = { result: DrawResult; revealOrder: number[] }

// reduce 환경이면 연출 없이 즉시 용지에 반영한다. CSS만으로 처리하면 오버레이가
// 잠깐 뜨는 회귀가 생겨 JS에서 분기한다(확정 설계 핵심 결정 3). jsdom에는 matchMedia가 없다.
function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

// soundPlayer prop은 테스트에서 mock을 주입하기 위한 것 — 실제 앱은 HTMLAudio 구현을 쓴다.
type AppProps = { soundPlayer?: SoundPlayer }

export default function App({ soundPlayer }: AppProps = {}) {
  const frequencies = useMemo(() => calculateFrequencies(draws), [])
  const hasData = useMemo(
    () => frequencies.some((entry) => entry.count > 0),
    [frequencies],
  )
  const [result, setResult] = useState<DrawResult | null>(null)
  const [pendingDraw, setPendingDraw] = useState<PendingDraw | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [player] = useState(() => soundPlayer ?? createHtmlAudioPlayer())
  const [soundOn, setSoundOn] = useState(loadSoundOn)

  // 초기 복원값과 토글 변경을 재생 계층에 반영한다(음소거는 정지가 아니라 muted — 확정 설계 결정 4).
  useEffect(() => {
    player.setMuted(!soundOn)
  }, [player, soundOn])

  // BGM은 첫 사용자 상호작용에서 시작한다 — 자동재생 정책상 로드 직후 재생은 차단되므로
  // 제스처 이벤트 핸들러 안에서 시작해야 한다(확정 설계 결정 2, spec 요구 1·4).
  useEffect(() => {
    const removeListeners = () => {
      window.removeEventListener('pointerdown', startBgm)
      window.removeEventListener('keydown', startBgm)
    }
    function startBgm() {
      removeListeners()
      player.load()
      player.play('bgm')
    }
    window.addEventListener('pointerdown', startBgm)
    window.addEventListener('keydown', startBgm)
    return removeListeners
  }, [player])

  function handleDraw(mode: GenerateMode, count: number, fixed: number[]) {
    const games = Array.from({ length: count }, () => {
      if (mode === 'frequent') return generateWeighted(frequencies)
      if (mode === 'fixed') return generateWithFixed(fixed)
      return generateRandom()
    })
    const drawResult: DrawResult = { games, mode, count }

    if (prefersReducedMotion()) {
      setResult(drawResult)
      return
    }
    // 홈 BGM을 멈추고 연출 효과음으로 넘어간다(확인 후 멈춘 지점부터 재개 — spec 요구 1).
    // 오버레이 이벤트 효과음은 DrawOverlay가 phase 전이에서 요청한다.
    player.stopAll()
    setPendingDraw({
      result: drawResult,
      revealOrder: revealSequence(games[0].numbers),
    })
  }

  function confirmDraw() {
    if (!pendingDraw) return
    player.stopAll()
    player.play('bgm')
    setResult(pendingDraw.result)
    setPendingDraw(null)
  }

  function toggleSound() {
    const next = !soundOn
    setSoundOn(next)
    saveSoundOn(next)
  }

  // 오버레이가 떠 있는 동안 배경을 inert로 막고 body 스크롤을 잠근다 —
  // 키보드·스크린리더가 뒤 화면에 닿지 않게 한다(확정 설계 "접근성·입력 차단").
  useEffect(() => {
    const content = contentRef.current
    if (!pendingDraw || !content) return
    content.setAttribute('inert', '')
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      content.removeAttribute('inert')
      document.body.style.overflow = previousOverflow
    }
  }, [pendingDraw])

  return (
    <>
      <div className="app-content" ref={contentRef}>
        <div className="pagebg">
          <div className="pstars"></div>
        </div>

        <DisclaimerBanner />
        <button
          type="button"
          className="page-sound-toggle"
          onClick={toggleSound}
          aria-pressed={soundOn}
        >
          {soundOn ? '🔊 소리 켬' : '🔇 소리 꺼짐'}
        </button>
        <WinningBar draw={latestDraw(draws)} />
        <GeneratorPanel onDraw={handleDraw} result={result} hasData={hasData} />

        <section className="wrap">
          <h2 className="sec-title">당첨금액</h2>
          <p className="sec-sub">샘플 · 실제 당첨금이 아닙니다</p>
          <PrizeTable />
        </section>

        <section className="wrap" style={{ paddingBottom: 80 }}>
          <h2 className="sec-title">1~45번 출현 통계</h2>
          <p className="sec-sub">
            {hasData
              ? `샘플 ${draws.length}회차 기준 · 예측이 아닌 재미용 통계`
              : '데이터 없음 · 통계 없음'}
          </p>
          <FrequencyGrid frequencies={frequencies} />
        </section>
      </div>

      {pendingDraw && (
        <DrawOverlay
          revealOrder={pendingDraw.revealOrder}
          sortedNumbers={pendingDraw.result.games[0].numbers}
          onConfirm={confirmDraw}
          soundPlayer={player}
          soundOn={soundOn}
          onToggleSound={toggleSound}
        />
      )}
    </>
  )
}
