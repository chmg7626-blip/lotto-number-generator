// 음소거 설정의 localStorage 캡슐화. 저장값 없음·읽기 실패 = 기본 ON(spec 요구 3 경계값).

const KEY = 'lotto.soundOn'

export function loadSoundOn(): boolean {
  try {
    return window.localStorage.getItem(KEY) !== 'off'
  } catch {
    return true
  }
}

export function saveSoundOn(on: boolean): void {
  try {
    window.localStorage.setItem(KEY, on ? 'on' : 'off')
  } catch {
    // 저장 실패(사파리 프라이빗 모드 등)는 무시 — 이번 세션 동작에는 영향 없다.
  }
}
