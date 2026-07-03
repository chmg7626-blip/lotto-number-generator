import type { CSSProperties } from 'react'
import { zoneOf } from './zones'

// 추첨기 안에서 작은 원을 그리며 도는 장식용 공 12개(구간색 골고루).
// 위치는 구 중심(170,170) 기준 안쪽에만 둔다: 중심 1개 + 안쪽 링(r≈67) 5개 + 바깥 링(r≈107) 6개.
// 구 지름 340·공 52라 구 내반경 166(테두리 4 제외) — 바깥 링 107 + 궤도 ≤20(히어로) 또는
// 요동 ≤26(오버레이 turbo) + 공 반지름 26이 안전 반경 안에 있어 공이 구 밖으로 잘리지 않는다.
// overflow:hidden은 안전망. (2026-07-03 사이즈업 — 구 280→340, 공 48→52 좌표 재계산)
const MACHINE_BALLS: { n: number; style: CSSProperties }[] = [
  {
    n: 7,
    style: {
      top: '144px',
      left: '144px',
      animation: 'orbit2 11s ease-in-out infinite',
    },
  },
  {
    n: 3,
    style: {
      top: '144px',
      left: '211px',
      animation: 'orbit1 10s ease-in-out infinite -2s',
    },
  },
  {
    n: 12,
    style: {
      top: '207px',
      left: '165px',
      animation: 'orbit3 13s ease-in-out infinite -5s',
    },
  },
  {
    n: 17,
    style: {
      top: '183px',
      left: '91px',
      animation: 'orbit2 12s ease-in-out infinite -7s',
    },
  },
  {
    n: 23,
    style: {
      top: '105px',
      left: '91px',
      animation: 'orbit4 14s ease-in-out infinite -3s',
    },
  },
  {
    n: 28,
    style: {
      top: '81px',
      left: '165px',
      animation: 'orbit1 11s ease-in-out infinite -9s',
    },
  },
  {
    n: 31,
    style: {
      top: '197px',
      left: '236px',
      animation: 'orbit3 15s ease-in-out infinite -1s',
    },
  },
  {
    n: 34,
    style: {
      top: '251px',
      left: '144px',
      animation: 'orbit2 13s ease-in-out infinite -6s',
    },
  },
  {
    n: 38,
    style: {
      top: '197px',
      left: '52px',
      animation: 'orbit4 16s ease-in-out infinite -8s',
    },
  },
  {
    n: 42,
    style: {
      top: '91px',
      left: '52px',
      animation: 'orbit1 12s ease-in-out infinite -4s',
    },
  },
  {
    n: 44,
    style: {
      top: '37px',
      left: '144px',
      animation: 'orbit3 14s ease-in-out infinite -10s',
    },
  },
  {
    n: 8,
    style: {
      top: '91px',
      left: '236px',
      animation: 'orbit4 15s ease-in-out infinite -11s',
    },
  },
]

export function LottoMachine() {
  return (
    <div className="lotto-machine" aria-hidden="true">
      <div className="cap"></div>
      <div className="sphere">
        <div className="blower"></div>
        <div className="drum">
          {MACHINE_BALLS.map((b, i) => (
            <div key={i} className={`mball ${zoneOf(b.n)}`} style={b.style}>
              {b.n}
            </div>
          ))}
        </div>
      </div>
      <div className="stand"></div>
    </div>
  )
}
