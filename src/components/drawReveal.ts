import type { Rng } from '../domain/lotto'

// 연출용 공개 순서: 확정된 본번호(오름차순)를 섞어 "뽑힌 순서"를 만든다.
// 생성 알고리즘의 실제 추출 순서를 쓰지 않는 이유(확정 설계 docs/design/draw-animation.md):
// 도메인 반환 구조를 확장해야 하고, 행운수 고정은 고정 번호가 앞에 쌓여 결국 셔플 보정이
// 필요하다. 셔플이면 고정 번호도 자동으로 균등하게 취급된다. 결과 집합은 바뀌지 않는다.
export function revealSequence(
  numbers: number[],
  rng: Rng = Math.random,
): number[] {
  const sequence = [...numbers]
  for (let i = sequence.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[sequence[i], sequence[j]] = [sequence[j], sequence[i]]
  }
  return sequence
}
