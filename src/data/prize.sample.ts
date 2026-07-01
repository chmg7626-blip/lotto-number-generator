// 당첨금액 샘플(정적 — 실제 당첨금이 아니다). UI에 "샘플"로 명시한다.
// 실데이터 확보(출처·이용약관 확인)는 배포 전 외부 조사로 교체한다(docs/research).

export type PrizeTier = {
  rank: string
  amount: string
  count: string
}

export type PrizeSample = {
  first: { amount: string; per: string; meta: string }
  rest: PrizeTier[]
}

export const prizeSample: PrizeSample = {
  first: {
    amount: '21억 4,538만원',
    per: '1게임당',
    meta: '당첨 14게임 · 총 300억 5,338만원',
  },
  rest: [
    { rank: '2등', amount: '5,842만원', count: '89게임' },
    { rank: '3등', amount: '152만원', count: '3,480게임' },
    { rank: '4등', amount: '5만원', count: '174,200게임' },
    { rank: '5등', amount: '5천원', count: '2,890,000게임' },
  ],
}
