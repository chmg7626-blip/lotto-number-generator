import type { CSSProperties } from 'react'
import { zoneOf } from './zones'

// 추첨기 안에서 작은 원을 그리며 도는 장식용 공 12개(구간색 골고루).
// 위치는 구 중심(140,140) 기준 안쪽에만 둔다: 중심 1개 + 안쪽 링(r55) 5개 + 바깥 링(r88) 6개.
// 궤도 반경(orbit)이 20 이하라 base+궤도가 안전 반경(116) 안에 있어 공이 구 밖으로 잘리지 않는다.
// 실제 추첨 연출(공이 하나씩 뽑혀 공개)은 이번 범위 밖이다(별도 spec — lotto-draw-animation).
const MACHINE_BALLS: { n: number; style: CSSProperties }[] = [
  {
    n: 7,
    style: {
      top: '116px',
      left: '116px',
      animation: 'orbit2 11s ease-in-out infinite',
    },
  },
  {
    n: 3,
    style: {
      top: '116px',
      left: '171px',
      animation: 'orbit1 10s ease-in-out infinite -2s',
    },
  },
  {
    n: 12,
    style: {
      top: '168px',
      left: '133px',
      animation: 'orbit3 13s ease-in-out infinite -5s',
    },
  },
  {
    n: 17,
    style: {
      top: '148px',
      left: '72px',
      animation: 'orbit2 12s ease-in-out infinite -7s',
    },
  },
  {
    n: 23,
    style: {
      top: '84px',
      left: '72px',
      animation: 'orbit4 14s ease-in-out infinite -3s',
    },
  },
  {
    n: 28,
    style: {
      top: '64px',
      left: '133px',
      animation: 'orbit1 11s ease-in-out infinite -9s',
    },
  },
  {
    n: 31,
    style: {
      top: '160px',
      left: '192px',
      animation: 'orbit3 15s ease-in-out infinite -1s',
    },
  },
  {
    n: 34,
    style: {
      top: '204px',
      left: '116px',
      animation: 'orbit2 13s ease-in-out infinite -6s',
    },
  },
  {
    n: 38,
    style: {
      top: '160px',
      left: '40px',
      animation: 'orbit4 16s ease-in-out infinite -8s',
    },
  },
  {
    n: 42,
    style: {
      top: '72px',
      left: '40px',
      animation: 'orbit1 12s ease-in-out infinite -4s',
    },
  },
  {
    n: 44,
    style: {
      top: '28px',
      left: '116px',
      animation: 'orbit3 14s ease-in-out infinite -10s',
    },
  },
  {
    n: 8,
    style: {
      top: '72px',
      left: '192px',
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
