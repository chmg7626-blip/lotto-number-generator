// 한국 로또 공의 번호 구간별 색(실제 동행복권 색 기반 — 정확성은 확인 필요).
// 이 프로젝트의 시각 시그니처: 번호 공·빈도 막대에 구간 색을 입힌다.
export function zoneColor(n: number): string {
  if (n <= 10) return 'var(--zone-yellow)'
  if (n <= 20) return 'var(--zone-blue)'
  if (n <= 30) return 'var(--zone-red)'
  if (n <= 40) return 'var(--zone-gray)'
  return 'var(--zone-green)'
}

// 공에는 class를 준다 — 구간 배경색과 가독성 있는 글자색(노랑은 어두운 글자)을 CSS에서 함께 정한다.
export function zoneClass(n: number): string {
  if (n <= 10) return 'zone-yellow'
  if (n <= 20) return 'zone-blue'
  if (n <= 30) return 'zone-red'
  if (n <= 40) return 'zone-gray'
  return 'zone-green'
}
