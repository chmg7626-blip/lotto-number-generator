// 번호 1~45를 실제 로또 5구간색(z1~z5)에 매핑한다.
// 1-10 노랑 / 11-20 파랑 / 21-30 빨강 / 31-40 회색 / 41-45 초록.
export type Zone = 'z1' | 'z2' | 'z3' | 'z4' | 'z5'

export function zoneOf(n: number): Zone {
  if (n <= 10) return 'z1'
  if (n <= 20) return 'z2'
  if (n <= 30) return 'z3'
  if (n <= 40) return 'z4'
  return 'z5'
}
