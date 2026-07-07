import type { Draw, DrawsFile, LatestPrizeFile } from './types'
import { MAIN_COUNT, MAX_NUMBER, MIN_NUMBER } from './lotto.ts'

// 실데이터(외부 API 응답 → 생성 파일)의 시스템 경계 검증이다 (확정 설계 real-data-deploy.md).
// 갱신 스크립트가 파일을 쓰기 전에 실행하고, 앱 테스트가 커밋된 데이터에 같은 규칙을 실행한다.
// lotto.ts를 .ts 확장자로 import하는 이유: 갱신 스크립트가 Node 타입 제거 실행(node scripts/*.ts)으로
// 이 모듈을 쓰는데, Node ESM은 런타임 import에 확장자를 요구한다 (type import는 제거되므로 무관).

export type ValidationResult = {
  ok: boolean
  errors: string[]
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function validateDraw(draw: Draw, errors: string[]): void {
  const label = `${draw.round}회`

  if (draw.numbers.length !== MAIN_COUNT) {
    errors.push(
      `${label}: 본번호가 ${MAIN_COUNT}개가 아니다 (${draw.numbers.length}개)`,
    )
  }
  for (const n of draw.numbers) {
    if (!Number.isInteger(n) || n < MIN_NUMBER || n > MAX_NUMBER) {
      errors.push(
        `${label}: 본번호 ${n}이(가) ${MIN_NUMBER}~${MAX_NUMBER} 범위 밖이다`,
      )
    }
  }
  if (new Set(draw.numbers).size !== draw.numbers.length) {
    errors.push(`${label}: 본번호에 중복이 있다`)
  }
  for (let i = 1; i < draw.numbers.length; i++) {
    if (draw.numbers[i - 1] >= draw.numbers[i]) {
      errors.push(`${label}: 본번호가 오름차순이 아니다`)
      break
    }
  }
  if (
    !Number.isInteger(draw.bonus) ||
    draw.bonus < MIN_NUMBER ||
    draw.bonus > MAX_NUMBER
  ) {
    errors.push(`${label}: 보너스 ${draw.bonus}이(가) 범위 밖이다`)
  } else if (draw.numbers.includes(draw.bonus)) {
    // 실제 추첨에서 보너스는 남은 공에서 뽑혀 본번호와 겹칠 수 없다 — 겹치면 데이터 손상이다.
    errors.push(`${label}: 보너스가 본번호와 중복된다`)
  }
  if (draw.date !== undefined && !DATE_PATTERN.test(draw.date)) {
    errors.push(`${label}: 날짜 형식이 YYYY-MM-DD가 아니다 (${draw.date})`)
  }
}

// 전체 회차 파일 검증: 1회부터 누락 없이 오름차순 연속하고 각 회차가 스키마를 지키는지 확인한다.
export function validateDraws(file: DrawsFile): ValidationResult {
  const errors: string[] = []
  const draws = file.draws

  if (draws.length === 0) {
    return { ok: false, errors: ['회차가 하나도 없다'] }
  }
  if (draws[0].round !== 1) {
    errors.push(`첫 회차가 1회가 아니다 (${draws[0].round}회)`)
  }
  for (let i = 1; i < draws.length; i++) {
    if (draws[i].round !== draws[i - 1].round + 1) {
      errors.push(
        `${draws[i - 1].round}회 다음이 ${draws[i].round}회다 (연속이 아님)`,
      )
    }
  }
  for (const draw of draws) validateDraw(draw, errors)

  return { ok: errors.length === 0, errors }
}

// 최신 회차 당첨금 검증: 회차가 당첨번호 최신 회차와 일치하고 1~5등이 순서대로 한 번씩 있는지 확인한다.
export function validateLatestPrize(
  file: LatestPrizeFile,
  latestRound: number,
): ValidationResult {
  const errors: string[] = []

  if (file.round !== latestRound) {
    errors.push(
      `당첨금 회차(${file.round})가 당첨번호 최신 회차(${latestRound})와 다르다`,
    )
  }
  const ranks = file.tiers.map((tier) => tier.rank)
  if (ranks.join(',') !== '1,2,3,4,5') {
    errors.push(`등수가 1~5등 순서 그대로가 아니다 (${ranks.join(',')})`)
  }
  for (const tier of file.tiers) {
    if (!Number.isInteger(tier.winners) || tier.winners < 0) {
      errors.push(
        `${tier.rank}등: 당첨 게임 수가 0 이상 정수가 아니다 (${tier.winners})`,
      )
    }
    if (!Number.isInteger(tier.prizePerGame) || tier.prizePerGame < 0) {
      errors.push(
        `${tier.rank}등: 1게임당 당첨금이 0 이상 정수가 아니다 (${tier.prizePerGame})`,
      )
    }
  }

  return { ok: errors.length === 0, errors }
}
