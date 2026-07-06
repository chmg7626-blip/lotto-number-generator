// 동행복권 공식 회차 조회 API에서 당첨번호·최신 회차 당첨금을 받아 src/data/ JSON을 갱신한다.
// 실행: node scripts/update-draws.ts [--full]   (Node 23.6+ 타입 제거 실행, 새 의존성 없음)
// 파이프라인: fetch → normalize → validate → compare → atomic write (확정 설계 real-data-deploy.md).
// 취득·검증 실패 시 기존 파일을 건드리지 않고 0이 아닌 코드로 종료한다.

import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import type { DrawsFile } from '../src/domain/types'
import {
  validateDraws,
  validateLatestPrize,
} from '../src/domain/drawsValidation.ts'
import {
  buildLatestPrize,
  mergeDraws,
  serialize,
  type ApiDrawItem,
} from './updateDrawsCore.ts'

const API_BASE = 'https://www.dhlottery.co.kr/lt645/selectPstLt645Info.do'
const CHUNK_SIZE = 500
const dataDir = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'data',
)
const DRAWS_PATH = join(dataDir, 'draws.json')
const PRIZE_PATH = join(dataDir, 'latestPrize.json')

function fail(message: string): never {
  console.error(`갱신 실패: ${message}`)
  process.exit(1)
}

async function fetchChunk(start: number, end: number): Promise<ApiDrawItem[]> {
  const url = `${API_BASE}?srchStrLtEpsd=${start}&srchEndLtEpsd=${end}`
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
  })
  if (!response.ok) fail(`API 응답 ${response.status} (${start}~${end}회 요청)`)
  const body = (await response.json()) as { data?: { list?: ApiDrawItem[] } }
  if (!Array.isArray(body.data?.list))
    fail('응답에 data.list 배열이 없다 (형식 변경 의심)')
  return body.data.list
}

// startRound부터 최신 회차까지 CHUNK_SIZE 단위로 나눠 받는다.
// API는 최신 회차 초과 범위를 잘라서 주고, 전부 초과면 빈 리스트를 준다 (WP-001 확인).
async function fetchFrom(startRound: number): Promise<ApiDrawItem[]> {
  const items: ApiDrawItem[] = []
  let cursor = startRound
  for (;;) {
    const chunk = await fetchChunk(cursor, cursor + CHUNK_SIZE - 1)
    items.push(...chunk)
    if (chunk.length < CHUNK_SIZE) return items
    cursor += CHUNK_SIZE
  }
}

function readExistingDraws(): DrawsFile | null {
  if (!existsSync(DRAWS_PATH)) return null
  return JSON.parse(readFileSync(DRAWS_PATH, 'utf8')) as DrawsFile
}

// 임시 파일에 쓴 뒤 rename으로 바꿔치기 — 쓰다 만 파일이 남지 않는다.
// 내용이 이미 같으면 쓰지 않는다(멱등). 썼는지 여부를 돌려준다.
function writeIfChanged(path: string, content: string): boolean {
  if (existsSync(path) && readFileSync(path, 'utf8') === content) return false
  const tmpPath = `${path}.tmp`
  writeFileSync(tmpPath, content, 'utf8')
  renameSync(tmpPath, path)
  return true
}

const full = process.argv.includes('--full')
const existing = full ? null : readExistingDraws()
const existingDraws = existing?.draws ?? []
const maxExisting =
  existingDraws.length > 0 ? existingDraws[existingDraws.length - 1].round : 0

// 기존 최신 회차부터 다시 받는다 — 새 회차가 없어도 최신 당첨금을 재구성할 수 있다.
const items = await fetchFrom(Math.max(maxExisting, 1))
if (items.length === 0)
  fail('응답 회차가 0건이다 (기존 최신 회차 조회도 비어 있음 — 형식 변경 의심)')

const draws = mergeDraws(existingDraws, items)
const latestItem = items.reduce((a, b) => (a.ltEpsd >= b.ltEpsd ? a : b))
const drawsFile: DrawsFile = { draws }
const latestPrize = buildLatestPrize(latestItem)

const drawsResult = validateDraws(drawsFile)
if (!drawsResult.ok)
  fail(`당첨번호 검증 실패:\n- ${drawsResult.errors.slice(0, 20).join('\n- ')}`)
const prizeResult = validateLatestPrize(
  latestPrize,
  draws[draws.length - 1].round,
)
if (!prizeResult.ok)
  fail(`당첨금 검증 실패:\n- ${prizeResult.errors.join('\n- ')}`)

const drawsChanged = writeIfChanged(DRAWS_PATH, serialize(drawsFile))
const prizeChanged = writeIfChanged(PRIZE_PATH, serialize(latestPrize))

const addedCount = draws.length - existingDraws.length
if (drawsChanged || prizeChanged) {
  console.log(
    `갱신 완료: ${draws.length}회차 (추가 ${addedCount}건), 최신 ${draws[draws.length - 1].round}회 당첨금 반영`,
  )
} else {
  console.log(`변경 없음: 이미 최신 (${draws[draws.length - 1].round}회까지)`)
}
