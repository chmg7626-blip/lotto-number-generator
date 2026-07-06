// 당첨금 표시용 포맷. 목업의 요약 표기(억/만 단위)를 따르고 만원 미만 잔액은 버린다 —
// 정확한 원 단위가 아니라 규모를 보여주는 표기다.

export function withComma(value: number): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export function formatWon(amount: number): string {
  if (amount >= 100_000_000) {
    const eok = Math.floor(amount / 100_000_000)
    const man = Math.floor((amount % 100_000_000) / 10_000)
    return man > 0
      ? `${withComma(eok)}억${withComma(man)}만원`
      : `${withComma(eok)}억원`
  }
  if (amount >= 10_000) {
    return `${withComma(Math.floor(amount / 10_000))}만원`
  }
  if (amount >= 1_000 && amount % 1_000 === 0) {
    return `${amount / 1_000}천원`
  }
  return `${withComma(amount)}원`
}
