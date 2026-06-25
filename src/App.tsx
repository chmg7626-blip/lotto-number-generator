import { useMemo, useState } from 'react'
import drawsData from './data/draws.sample.json'
import type {
  DrawsFile,
  GenerateMode,
  GeneratedNumbers,
  SavedResult,
} from './domain/types'
import {
  calculateFrequencies,
  generateRandom,
  generateWeighted,
} from './domain/lotto'
import {
  clearSavedResults,
  deleteSavedResult,
  listSavedResults,
  saveResult,
} from './storage/savedResults'
import DisclaimerBanner from './components/DisclaimerBanner'
import GeneratorPanel from './components/GeneratorPanel'
import FrequencyTable from './components/FrequencyTable'
import SavedResults from './components/SavedResults'
import './App.css'

// 샘플 데이터(실제 당첨번호 아님 — src/data/README.md). 배포 전 실데이터로 교체한다.
const draws = (drawsData as DrawsFile).draws

export default function App() {
  const frequencies = useMemo(() => calculateFrequencies(draws), [])
  const hasData = useMemo(
    () => frequencies.some((entry) => entry.count > 0),
    [frequencies],
  )

  const [mode, setMode] = useState<GenerateMode>('random')
  const [current, setCurrent] = useState<GeneratedNumbers | null>(null)
  const [saved, setSaved] = useState<SavedResult[]>(() => listSavedResults())

  function handleGenerate() {
    setCurrent(
      mode === 'random'
        ? generateRandom()
        : generateWeighted(mode, frequencies),
    )
  }

  function handleSave() {
    if (!current) return
    saveResult(mode, current)
    setSaved(listSavedResults())
  }

  function handleDelete(id: string) {
    deleteSavedResult(id)
    setSaved(listSavedResults())
  }

  function handleClear() {
    clearSavedResults()
    setSaved(listSavedResults())
  }

  return (
    <div className="app">
      <DisclaimerBanner />
      <header className="app-header">
        <h1>로또번호생성기</h1>
        <p className="data-note">
          샘플 데이터 {draws.length}회차 (실제 당첨번호 아님)
        </p>
      </header>

      <GeneratorPanel
        mode={mode}
        onModeChange={setMode}
        onGenerate={handleGenerate}
        onSave={handleSave}
        current={current}
        hasData={hasData}
      />
      <FrequencyTable frequencies={frequencies} hasData={hasData} />
      <SavedResults
        items={saved}
        onDelete={handleDelete}
        onClear={handleClear}
      />
    </div>
  )
}
