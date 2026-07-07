import type { Draw, DrawsFile, LatestPrizeFile } from '../src/domain/types'

// 동행복권 회차 조회 API(/lt645/selectPstLt645Info.do) 응답 항목 중 스크립트가 쓰는 필드만 적는다.
// 필드가 빠지거나 형식이 바뀌면 여기서 만든 결과가 drawsValidation 검증에 걸려 갱신이 중단된다.
export type ApiDrawItem = {
  ltEpsd: number
  ltRflYmd: string
  tm1WnNo: number
  tm2WnNo: number
  tm3WnNo: number
  tm4WnNo: number
  tm5WnNo: number
  tm6WnNo: number
  bnsWnNo: number
  rnk1WnNope: number
  rnk1WnAmt: number
  rnk2WnNope: number
  rnk2WnAmt: number
  rnk3WnNope: number
  rnk3WnAmt: number
  rnk4WnNope: number
  rnk4WnAmt: number
  rnk5WnNope: number
  rnk5WnAmt: number
}

// API 항목 → Draw. 날짜 YYYYMMDD → YYYY-MM-DD, 본번호는 오름차순 정렬(결정적 포맷).
export function toDraw(item: ApiDrawItem): Draw {
  const numbers = [
    item.tm1WnNo,
    item.tm2WnNo,
    item.tm3WnNo,
    item.tm4WnNo,
    item.tm5WnNo,
    item.tm6WnNo,
  ].sort((a, b) => a - b)
  const ymd = String(item.ltRflYmd)
  return {
    round: item.ltEpsd,
    date: `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`,
    numbers,
    bonus: item.bnsWnNo,
  }
}

// 기존 회차에 새 항목을 이어 붙인다. 증분 요청은 기존 최신 회차부터 다시 받으므로
// (당첨금 데이터 확보 목적) 겹치는 회차는 버리고 그 이후만 추가한다.
export function mergeDraws(existing: Draw[], items: ApiDrawItem[]): Draw[] {
  const maxExisting =
    existing.length > 0 ? existing[existing.length - 1].round : 0
  const added = items
    .filter((item) => item.ltEpsd > maxExisting)
    .map(toDraw)
    .sort((a, b) => a.round - b.round)
  return [...existing, ...added]
}

// 최신 회차 항목에서 등수별 당첨금 파일을 만든다.
export function buildLatestPrize(item: ApiDrawItem): LatestPrizeFile {
  return {
    round: item.ltEpsd,
    tiers: [
      { rank: 1, winners: item.rnk1WnNope, prizePerGame: item.rnk1WnAmt },
      { rank: 2, winners: item.rnk2WnNope, prizePerGame: item.rnk2WnAmt },
      { rank: 3, winners: item.rnk3WnNope, prizePerGame: item.rnk3WnAmt },
      { rank: 4, winners: item.rnk4WnNope, prizePerGame: item.rnk4WnAmt },
      { rank: 5, winners: item.rnk5WnNope, prizePerGame: item.rnk5WnAmt },
    ],
  }
}

// 결정적 직렬화: 같은 데이터면 바이트 단위로 같은 파일이 나온다 (이미 최신이면 diff 없음).
export function serialize(data: DrawsFile | LatestPrizeFile): string {
  return JSON.stringify(data, null, 2) + '\n'
}
