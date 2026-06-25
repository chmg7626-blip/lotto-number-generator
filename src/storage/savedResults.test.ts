import { describe, it, expect, beforeEach } from 'vitest'
import type { GeneratedNumbers } from '../domain/types'
import {
  clearSavedResults,
  deleteSavedResult,
  listSavedResults,
  saveResult,
} from './savedResults'

const STORAGE_KEY = 'lotto:savedResults'

const sample: GeneratedNumbers = { numbers: [1, 2, 3, 4, 5, 6], bonus: 7 }

beforeEach(() => {
  localStorage.clear()
})

describe('savedResults', () => {
  it('저장이 없으면 빈 목록이다 (경계값)', () => {
    expect(listSavedResults()).toEqual([])
  })

  it('저장하면 목록에 나타나고 다시 읽어도 유지된다', () => {
    const saved = saveResult('random', sample)

    expect(saved.id).toBeTruthy()
    expect(typeof saved.createdAt).toBe('number')
    expect(saved.mode).toBe('random')
    expect(saved.numbers).toEqual([1, 2, 3, 4, 5, 6])
    expect(saved.bonus).toBe(7)

    const list = listSavedResults()
    expect(list).toHaveLength(1)
    expect(list[0]).toEqual(saved)
  })

  it('개별 삭제하면 그 항목만 사라진다', () => {
    const a = saveResult('random', sample)
    const b = saveResult('frequent', {
      numbers: [10, 11, 12, 13, 14, 15],
      bonus: 20,
    })

    deleteSavedResult(a.id)

    const list = listSavedResults()
    expect(list).toHaveLength(1)
    expect(list[0].id).toBe(b.id)
  })

  it('전체 비우기를 하면 목록과 저장소가 모두 비워진다', () => {
    saveResult('random', sample)
    saveResult('rare', sample)

    clearSavedResults()

    expect(listSavedResults()).toEqual([])
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('손상된 데이터에서는 빈 목록으로 복구한다 (오류 경계)', () => {
    localStorage.setItem(STORAGE_KEY, '{ not valid json ]')
    expect(listSavedResults()).toEqual([])
  })
})
