import type {
  FrequencyEntry,
  GeneratedNumbers,
  GenerateMode,
} from '../domain/types'
import { withComma } from './prizeFormat.ts'

// 은/는 주격 조사: 번호의 한국어 읽기 끝음절 받침으로 정한다. 1~45에서 끝음절은
// 마지막 자리 숫자가 결정한다 — 10·20·30·40은 '십'(받침 있음), 2·4·5·9만 받침이 없다.
export function subjectParticle(n: number): '은' | '는' {
  const lastDigit = n % 10
  return lastDigit !== 0 && [2, 4, 5, 9].includes(lastDigit) ? '는' : '은'
}

type NumberStat = { number: number; count: number; rank: number }

// 공동 순위: 자기보다 많이 나온 번호 수 + 1 (동률은 같은 순위).
function buildStats(frequencies: FrequencyEntry[]): Map<number, NumberStat> {
  const stats = new Map<number, NumberStat>()
  for (const entry of frequencies) {
    const rank =
      frequencies.filter((other) => other.count > entry.count).length + 1
    stats.set(entry.number, { number: entry.number, count: entry.count, rank })
  }
  return stats
}

// "단골 빈도 설명": frequent 모드로 뽑은 게임마다 출현 횟수 상위 2개를 문장 한 줄로 만든다
// (spec: frequent-stat-note — 목업 B안). 예측이 아니라 과거 집계 사실만 말한다.
// 다른 모드이거나 데이터가 없으면(도메인이 랜덤 폴백) null — 설명 줄을 표시하지 않는다.
export function buildFrequentNotes(
  mode: GenerateMode,
  games: GeneratedNumbers[],
  frequencies: FrequencyEntry[],
  totalDraws: number,
): string[] | null {
  if (mode !== 'frequent' || totalDraws <= 0) return null

  const stats = buildStats(frequencies)
  return games.map((game) => {
    // 횟수 내림차순, 동률이면 번호가 작은 쪽 먼저(결정적 규칙 — spec 요구 3).
    const ordered = game.numbers
      .map((n) => stats.get(n)!)
      .sort((a, b) => b.count - a.count || a.number - b.number)
    const [first, second] = ordered

    return (
      `🔥 ${first.number}${subjectParticle(first.number)} 역대 ${withComma(totalDraws)}번 추첨에서 ` +
      `${withComma(first.count)}번 나온 단골 ${first.rank}위, ` +
      `${second.number}${subjectParticle(second.number)} ${withComma(second.count)}번(${second.rank}위) 나왔어요`
    )
  })
}
