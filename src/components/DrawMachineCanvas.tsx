import { useEffect, useRef } from 'react'
import { zoneOf } from './zones'

// canvas는 CSS 변수를 직접 못 읽어 구간색 토큰(styles.css :root)을 복제한다. 값이 어긋나면 안 된다.
const ZONE_FILL: Record<string, string> = {
  z1: '#ffcd3c',
  z2: '#5fb7f0',
  z3: '#ff6e6e',
  z4: '#c2ccde',
  z5: '#a8d84a',
}
const ZONE_TEXT: Record<string, string> = {
  z1: '#1a1500',
  z2: '#06324d',
  z3: '#5e0d0d',
  z4: '#2a3140',
  z5: '#33470a',
}

// 캔버스 논리 좌표계(px). 드럼 위에 튜브(출구) 공간을 두려고 세로가 더 길다.
const WIDTH = 520
const HEIGHT = 600
const DRUM_CX = 260
const DRUM_CY = 330
const DRUM_RADIUS = 220
const RIM = 5 // 드럼 테두리 두께 — 공은 테두리 안쪽에서만 반사
const TUBE_HALF = 34
const TUBE_TOP = 14
const BALL_RADIUS = 28

// 물리 튜닝(육안 조정): 차분하게 부글거리는 배경 믹싱.
// 2026-07-04 재설계 — 믹싱은 배경이고 주인공은 컷인이라, 요동을 낮게 유지한다.
const BALL_COUNT = 24 // 2026-07-04 사용자 피드백 — 드럼이 더 차 보이게(꽉 끼지 않는 선)
const GRAVITY = 0.2
const RESTITUTION = 0.75
const MAX_SPEED = 9

type SimBall = {
  n: number
  x: number
  y: number
  vx: number
  vy: number
  extracting: boolean
}

// 표시할 공 BALL_COUNT개를 고른다. 뽑힐 6개(revealOrder)는 반드시 포함하고 나머지는 무작위 —
// 공이 적어도 추첨 결과와 어긋나지 않는다(번호는 도메인에서 이미 확정, 여기는 표시 전용).
function pickVisibleNumbers(revealOrder: number[]): number[] {
  const rest: number[] = []
  for (let n = 1; n <= 45; n++) {
    if (!revealOrder.includes(n)) rest.push(n)
  }
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[rest[i], rest[j]] = [rest[j], rest[i]]
  }
  return [...revealOrder, ...rest.slice(0, BALL_COUNT - revealOrder.length)]
}

// 공들을 드럼 안에 겹치지 않게 대략적으로 흩뿌린다(초기 겹침은 첫 프레임 충돌 보정이 푼다).
function createBalls(revealOrder: number[]): SimBall[] {
  return pickVisibleNumbers(revealOrder).map((n) => {
    const angle = Math.random() * Math.PI * 2
    const dist =
      Math.sqrt(Math.random()) * (DRUM_RADIUS - RIM - BALL_RADIUS - 2)
    return {
      n,
      x: DRUM_CX + Math.cos(angle) * dist,
      y: DRUM_CY + Math.sin(angle) * dist,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.5) * 5,
      extracting: false,
    }
  })
}

function stepPhysics(balls: SimBall[], agitation: number) {
  const inner = DRUM_RADIUS - RIM - BALL_RADIUS

  for (const ball of balls) {
    if (ball.extracting) {
      // 뽑힌 공: 경계를 무시하고 튜브 중심선으로 정렬되며 위로 빨려 올라간다.
      ball.vx += (DRUM_CX - ball.x) * 0.06
      ball.vy -= 1.3
      ball.x += ball.vx
      ball.y += ball.vy
      continue
    }

    ball.vy += GRAVITY
    // 에어젯: 바닥 근처 공을 가끔 쳐올려 가라앉지 않게 한다. agitation(서스펜스)에서 세진다.
    if (ball.y > DRUM_CY + inner * 0.5 && Math.random() < 0.04 * agitation) {
      ball.vy -= (4.5 + Math.random() * 3) * agitation
      ball.vx += (Math.random() - 0.5) * 3 * agitation
    }
    // 약한 난류
    ball.vx += (Math.random() - 0.5) * 0.12 * agitation
    ball.vy += (Math.random() - 0.5) * 0.08 * agitation

    const speed = Math.hypot(ball.vx, ball.vy)
    if (speed > MAX_SPEED) {
      ball.vx = (ball.vx / speed) * MAX_SPEED
      ball.vy = (ball.vy / speed) * MAX_SPEED
    }

    ball.x += ball.vx
    ball.y += ball.vy

    // 원형 경계 반사
    const dx = ball.x - DRUM_CX
    const dy = ball.y - DRUM_CY
    const dist = Math.hypot(dx, dy)
    if (dist > inner && dist > 0) {
      const nx = dx / dist
      const ny = dy / dist
      ball.x = DRUM_CX + nx * inner
      ball.y = DRUM_CY + ny * inner
      const outward = ball.vx * nx + ball.vy * ny
      if (outward > 0) {
        ball.vx -= (1 + RESTITUTION) * outward * nx
        ball.vy -= (1 + RESTITUTION) * outward * ny
      }
    }
  }

  // 공끼리 충돌: 겹침 보정 + 법선 방향 속도 교환(동일 질량 탄성 근사)
  for (let i = 0; i < balls.length; i++) {
    const a = balls[i]
    if (a.extracting) continue
    for (let j = i + 1; j < balls.length; j++) {
      const b = balls[j]
      if (b.extracting) continue
      const dx = b.x - a.x
      const dy = b.y - a.y
      const dist = Math.hypot(dx, dy)
      const minDist = BALL_RADIUS * 2
      if (dist === 0 || dist >= minDist) continue

      const nx = dx / dist
      const ny = dy / dist
      const overlap = (minDist - dist) / 2
      a.x -= nx * overlap
      a.y -= ny * overlap
      b.x += nx * overlap
      b.y += ny * overlap

      const approach = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny
      if (approach > 0) {
        a.vx -= approach * nx
        a.vy -= approach * ny
        b.vx += approach * nx
        b.vy += approach * ny
      }
    }
  }
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  balls: SimBall[],
  suspense: boolean,
) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT)
  ctx.save()
  // 서스펜스: 장면 전체가 미세하게 떨린다(두구두구).
  if (suspense) {
    ctx.translate((Math.random() - 0.5) * 7, (Math.random() - 0.5) * 5)
  }

  // 출구 튜브: 드럼 상단에서 캔버스 위 끝까지.
  const tubeBottom = DRUM_CY - DRUM_RADIUS + 26
  ctx.fillStyle = 'rgba(120, 160, 255, 0.1)'
  ctx.fillRect(
    DRUM_CX - TUBE_HALF,
    TUBE_TOP,
    TUBE_HALF * 2,
    tubeBottom - TUBE_TOP,
  )
  ctx.strokeStyle = 'rgba(255, 212, 94, 0.45)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(DRUM_CX - TUBE_HALF, TUBE_TOP)
  ctx.lineTo(DRUM_CX - TUBE_HALF, tubeBottom)
  ctx.moveTo(DRUM_CX + TUBE_HALF, TUBE_TOP)
  ctx.lineTo(DRUM_CX + TUBE_HALF, tubeBottom)
  ctx.stroke()

  // 유리 드럼: 은은한 채움 + 금색 테두리
  const glass = ctx.createRadialGradient(
    DRUM_CX - 70,
    DRUM_CY - 90,
    40,
    DRUM_CX,
    DRUM_CY,
    DRUM_RADIUS,
  )
  glass.addColorStop(0, 'rgba(255, 255, 255, 0.16)')
  glass.addColorStop(0.55, 'rgba(110, 150, 230, 0.08)')
  glass.addColorStop(1, 'rgba(20, 30, 60, 0.28)')
  ctx.fillStyle = glass
  ctx.beginPath()
  ctx.arc(DRUM_CX, DRUM_CY, DRUM_RADIUS, 0, Math.PI * 2)
  ctx.fill()
  ctx.lineWidth = RIM
  ctx.strokeStyle = 'rgba(255, 212, 94, 0.55)'
  ctx.stroke()

  // 바닥 송풍구 힌트
  ctx.fillStyle = 'rgba(255, 212, 94, 0.16)'
  ctx.beginPath()
  ctx.moveTo(DRUM_CX - 55, DRUM_CY + DRUM_RADIUS - 8)
  ctx.lineTo(DRUM_CX + 55, DRUM_CY + DRUM_RADIUS - 8)
  ctx.lineTo(DRUM_CX + 26, DRUM_CY + DRUM_RADIUS - 62)
  ctx.lineTo(DRUM_CX - 26, DRUM_CY + DRUM_RADIUS - 62)
  ctx.closePath()
  ctx.fill()

  for (const ball of balls) {
    const zone = zoneOf(ball.n)
    ctx.save()
    ctx.translate(ball.x, ball.y)

    const body = ctx.createRadialGradient(
      -BALL_RADIUS * 0.35,
      -BALL_RADIUS * 0.4,
      BALL_RADIUS * 0.2,
      0,
      0,
      BALL_RADIUS,
    )
    body.addColorStop(0, 'rgba(255, 255, 255, 0.85)')
    body.addColorStop(0.25, ZONE_FILL[zone])
    body.addColorStop(1, ZONE_FILL[zone])
    ctx.fillStyle = body
    ctx.beginPath()
    ctx.arc(0, 0, BALL_RADIUS, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = ZONE_TEXT[zone]
    ctx.font = "bold 22px 'Jua', 'Pretendard', sans-serif"
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(ball.n), 0, 1)

    ctx.restore()
  }

  ctx.restore()
}

type DrawMachineCanvasProps = {
  // 게임 A의 공개 순서와 드럼에서 나간 공 수(shotCount). 번호는 도메인에서 이미 확정 —
  // 물리는 표시 전용이고, 나간 번호의 공을 튜브로 내보내는 연출만 담당한다.
  revealOrder: number[]
  shotCount: number
  // 마지막 공 직전 서스펜스: 장면 떨림 + 요동 강화.
  suspense: boolean
}

export function DrawMachineCanvas({
  revealOrder,
  shotCount,
  suspense,
}: DrawMachineCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ballsRef = useRef<SimBall[]>([])
  const suspenseRef = useRef(suspense)
  suspenseRef.current = suspense

  // 나간 번호의 공을 '뽑히는 중'으로 표시한다.
  useEffect(() => {
    const shot = new Set(revealOrder.slice(0, shotCount))
    for (const ball of ballsRef.current) {
      if (shot.has(ball.n) && !ball.extracting) {
        ball.extracting = true
        ball.vx = (DRUM_CX - ball.x) * 0.05
        ball.vy = -9
      }
    }
  }, [revealOrder, shotCount])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    // jsdom(테스트)에는 canvas 2D가 없다 — getContext를 호출하면 'Not implemented' 로그가
    // 시끄럽게 찍히므로, 인터페이스 존재부터 확인하고 시뮬레이션 없이 조용히 건너뛴다.
    if (typeof window.CanvasRenderingContext2D === 'undefined') return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = WIDTH * dpr
    canvas.height = HEIGHT * dpr
    ctx.scale(dpr, dpr)

    ballsRef.current = createBalls(revealOrder)

    let frameId = 0
    const loop = () => {
      // 서스펜스 중엔 요동을 키워 "곧 나온다"는 긴장을 만든다.
      stepPhysics(ballsRef.current, suspenseRef.current ? 3 : 1)
      // 튜브 위로 완전히 빠져나간 공은 드럼에서 제거한다.
      ballsRef.current = ballsRef.current.filter(
        (ball) => !(ball.extracting && ball.y < -BALL_RADIUS),
      )
      drawFrame(ctx, ballsRef.current, suspenseRef.current)
      frameId = window.requestAnimationFrame(loop)
    }
    frameId = window.requestAnimationFrame(loop)

    return () => window.cancelAnimationFrame(frameId)
  }, [revealOrder])

  return (
    <canvas
      ref={canvasRef}
      className="draw-canvas"
      width={WIDTH}
      height={HEIGHT}
      aria-hidden="true"
    />
  )
}
