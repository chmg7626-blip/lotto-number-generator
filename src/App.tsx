import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import drawsData from './data/draws.json'
import latestPrizeData from './data/latestPrize.json'
import type { Draw, DrawsFile, GenerateMode } from './domain/types'
import {
  calculateFrequencies,
  generateRandom,
  generateWeighted,
  generateWithFixed,
} from './domain/lotto'
import { DisclaimerBanner } from './components/DisclaimerBanner'
import { SourceNotice } from './components/SourceNotice'
import { WinningBar } from './components/WinningBar'
import { GeneratorPanel } from './components/GeneratorPanel'
import type { DrawResult } from './components/GeneratorPanel'
import { PrizeTable } from './components/PrizeTable'
import { FrequencyGrid } from './components/FrequencyGrid'
import { DrawOverlay } from './components/DrawOverlay'
import { revealSequence } from './components/drawReveal'
import { pickQuip } from './components/expertQuips'
import { buildFrequentNotes } from './components/frequentNote'
import { createWebAudioPlayer } from './sound/soundPlayer'
import type { SoundPlayer } from './sound/soundPlayer'
import { loadSoundOn, saveSoundOn } from './storage/soundPreference'

// 실데이터(동행복권 공식 출처 — src/data/README.md). npm run data:update 로 갱신된다.
const draws = (drawsData as DrawsFile).draws
const prizeRound = latestPrizeData.round

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
  const [player] = useState(() => soundPlayer ?? createWebAudioPlayer())
  const [soundOn, setSoundOn] = useState(loadSoundOn)

  // 초기 복원값과 토글 변경을 재생 계층에 반영한다(음소거는 정지가 아니라 muted — 확정 설계 결정 4).
  useEffect(() => {
    player.setMuted(!soundOn)
  }, [player, soundOn])

  // 진입 즉시 BGM을 시도한다. 브라우저가 무제스처 재생을 막으면 첫 click capture에서
  // 같은 source의 AudioContext를 resume한다. 첫 클릭이 뽑기여도 resume → stop 순서를 보장한다.
  useEffect(() => {
    player.load()
    player.startBgm()

    function startAmbient() {
      player.load()
      player.startBgm()
    }
    document.addEventListener('click', startAmbient, {
      once: true,
      capture: true,
    })
    return () =>
      document.removeEventListener('click', startAmbient, { capture: true })
  }, [player])

  function handleDraw(mode: GenerateMode, count: number, fixed: number[]) {
    const games = Array.from({ length: count }, () => {
      if (mode === 'frequent') return generateWeighted(frequencies)
      if (mode === 'fixed') return generateWithFixed(fixed)
      return generateRandom()
    })
    const drawResult: DrawResult = { games, mode, count, quip: pickQuip() }

    if (prefersReducedMotion()) {
      setResult(drawResult)
      return
    }
    // 클릭 제스처 체인 안에서 음원을 로드한다(자동재생 정책 — 확정 설계 결정 2).
    // 이벤트 효과음은 DrawOverlay가 phase 전이에서 요청한다.
    // 연출 동안은 배경음악을 멈춘다(효과음에 집중 — 확인 후 재개).
    player.load()
    player.stopBgm()
    setPendingDraw({
      result: drawResult,
      revealOrder: revealSequence(games[0].numbers),
    })
  }

  function confirmDraw() {
    if (!pendingDraw) return
    player.stopAll()
    setResult(pendingDraw.result)
    setPendingDraw(null)
  }

  const completeDrawAnimation = useCallback(() => {
    player.startBgm()
  }, [player])

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
      <div className="app-content app-content--studio" ref={contentRef}>
        <div className="pagebg">
          <div className="pstars"></div>
        </div>

        <DisclaimerBanner />

        <header className="site-header">
          <div className="logo">
            <div className="logo-img"></div>
            <div className="logo-name">
              로또 6/45<small>LUCKY DRAW</small>
            </div>
          </div>
          <div className="header-actions">
            <span className="data-status">
              <span aria-hidden="true"></span>최신 회차 데이터 반영
            </span>
            <button
              type="button"
              className="home-sound-toggle"
              onClick={toggleSound}
              aria-pressed={soundOn}
            >
              {soundOn ? '🔊 소리 켬' : '🔇 소리 꺼짐'}
            </button>
          </div>
        </header>

        <main className="site-main">
          <section className="studio-hero" aria-labelledby="page-title">
            <div className="studio-story">
              <p className="studio-index">
                <span>01</span> SATURDAY PICK STUDIO
              </p>
              <div className="intro">
                <div className="kicker">
                  이번 주 번호를 고르는 가장 가벼운 방법
                </div>
                <h1 className="htitle" id="page-title">
                  로또 <span className="n">6/45</span>
                </h1>
                <p className="hsub">
                  취향대로 고르고, 결과는 한눈에. 세 가지 방식으로 나만의 6개를
                  만들어보세요.
                </p>
              </div>

              <div className="studio-latest">
                <p className="studio-latest-label">LATEST DRAW</p>
                <WinningBar draw={latestDraw(draws)} />
              </div>

              <p className="studio-trust-note">
                과거 회차 데이터는 참고용이며 번호 생성은 당첨을 예측하거나
                보장하지 않습니다.
              </p>
            </div>

            <div className="studio-generator">
              <p className="studio-index studio-index--dark">
                <span>02</span> MAKE YOUR NUMBERS
              </p>
              <GeneratorPanel
                onDraw={handleDraw}
                result={result}
                hasData={hasData}
                notes={
                  result
                    ? buildFrequentNotes(
                        result.mode,
                        result.games,
                        frequencies,
                        draws.length,
                      )
                    : null
                }
              />
            </div>
          </section>

          <section className="wrap wrap--prize">
            <p className="section-index">03 · PRIZE BRIEF</p>
            <h2 className="sec-title">당첨금액</h2>
            <p className="sec-sub">
              제{prizeRound}회 기준 · 금액은 만원 미만 절사한 약식 표기
            </p>
            <div className="prize-content">
              <PrizeTable />
            </div>
          </section>

          <section className="wrap wrap--stats">
            <p className="section-index">04 · NUMBER ARCHIVE</p>
            <h2 className="sec-title">1~45번 출현 통계</h2>
            <p className="sec-sub">
              {hasData
                ? `역대 ${draws.length}회차 기준 · 예측이 아닌 재미용 통계`
                : '데이터 없음 · 통계 없음'}
            </p>
            <FrequencyGrid frequencies={frequencies} />
          </section>
        </main>

        <SourceNotice />
      </div>

      {pendingDraw && (
        <DrawOverlay
          revealOrder={pendingDraw.revealOrder}
          sortedNumbers={pendingDraw.result.games[0].numbers}
          onConfirm={confirmDraw}
          onComplete={completeDrawAnimation}
          soundPlayer={player}
          soundOn={soundOn}
          onToggleSound={toggleSound}
        />
      )}
    </>
  )
}
