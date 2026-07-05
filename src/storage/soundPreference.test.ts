import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { loadSoundOn, saveSoundOn } from './soundPreference'

describe('soundPreference', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('저장값이 없으면(첫 방문) 기본 ON이다', () => {
    expect(loadSoundOn()).toBe(true)
  })

  it('저장·복원이 왕복한다', () => {
    saveSoundOn(false)
    expect(loadSoundOn()).toBe(false)
    saveSoundOn(true)
    expect(loadSoundOn()).toBe(true)
  })

  it('읽기 실패 시 기본 ON이다', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    expect(loadSoundOn()).toBe(true)
  })

  it('저장 실패가 예외를 던지지 않는다', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    expect(() => saveSoundOn(false)).not.toThrow()
  })
})
