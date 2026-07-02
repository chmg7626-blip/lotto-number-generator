// 출현 횟수를 최대 출현수 대비 막대 폭(%)으로 정규화한다.
// 빈도 통계 그리드에서 빈도 높낮이를 시각적으로 구분하기 위한 값이다.
// 최대가 0(빈 데이터)이면 0을 돌려 막대가 그려지지 않게 한다(0으로 나누기 방지).
export function barPercent(count: number, maxCount: number): number {
  if (maxCount <= 0) return 0
  return Math.round((count / maxCount) * 100)
}
