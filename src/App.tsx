import { useMemo, useState } from 'react'
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

// 샘플 데이터(실제 당첨번호 아님 — src/data/README.md). 배포 전 실데이터로 교체한다.
const draws = (drawsData as DrawsFile).draws

// 회차 당첨번호 띠에 쓸 최신(회차 번호 최대) 회차. 데이터가 없으면 null.
function latestDraw(list: Draw[]): Draw | null {
  if (list.length === 0) return null
  return list.reduce((latest, d) => (d.round > latest.round ? d : latest))
}

export default function App() {
  const frequencies = useMemo(() => calculateFrequencies(draws), [])
  const hasData = useMemo(
    () => frequencies.some((entry) => entry.count > 0),
    [frequencies],
  )
  const [result, setResult] = useState<DrawResult | null>(null)

  function handleDraw(mode: GenerateMode, count: number, fixed: number[]) {
    const games = Array.from({ length: count }, () => {
      if (mode === 'frequent') return generateWeighted(frequencies)
      if (mode === 'fixed') return generateWithFixed(fixed)
      return generateRandom()
    })
    setResult({ games, mode, count })
  }

  return (
    <>
      <div className="pagebg">
        <div className="pstars"></div>
      </div>

      <DisclaimerBanner />
      <WinningBar draw={latestDraw(draws)} />
      <GeneratorPanel onDraw={handleDraw} result={result} hasData={hasData} />
    </>
  )
}
