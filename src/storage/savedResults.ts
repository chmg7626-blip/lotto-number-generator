import type {
  GeneratedNumbers,
  GenerateMode,
  SavedResult,
} from '../domain/types'

const STORAGE_KEY = 'lotto:savedResults'

function newId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID()
  }
  // randomUUID 미지원 환경 fallback.
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function persist(results: SavedResult[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(results))
}

// 저장 목록을 읽는다. 값이 없거나 손상돼 파싱에 실패하면 빈 목록으로 복구한다(저장소 경계 방어).
export function listSavedResults(): SavedResult[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw === null) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as SavedResult[]) : []
  } catch {
    return []
  }
}

export function saveResult(
  mode: GenerateMode,
  generated: GeneratedNumbers,
): SavedResult {
  const record: SavedResult = {
    id: newId(),
    createdAt: Date.now(),
    mode,
    numbers: generated.numbers,
    bonus: generated.bonus,
  }
  persist([...listSavedResults(), record])
  return record
}

export function deleteSavedResult(id: string): void {
  persist(listSavedResults().filter((result) => result.id !== id))
}

export function clearSavedResults(): void {
  localStorage.removeItem(STORAGE_KEY)
}
