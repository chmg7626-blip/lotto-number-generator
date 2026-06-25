import drawsData from './data/draws.sample.json'
import type { DrawsFile } from './domain/types'
import { calculateFrequencies } from './domain/lotto'

// 샘플 데이터(실제 당첨번호 아님 — src/data/README.md). 배포 전 실데이터로 교체한다.
const draws = (drawsData as DrawsFile).draws

export default function App() {
  const frequencies = calculateFrequencies(draws)
  const top = [...frequencies].sort((a, b) => b.count - a.count).slice(0, 5)

  return (
    <main>
      <h1>로또번호생성기</h1>
      <p>샘플 데이터 {draws.length}회차 (실제 당첨번호 아님)</p>
      <ul>
        {top.map((entry) => (
          <li key={entry.number}>
            {entry.number}번: {entry.count}회
          </li>
        ))}
      </ul>
    </main>
  )
}
