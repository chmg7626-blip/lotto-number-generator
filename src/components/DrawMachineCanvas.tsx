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

// 물리 튜닝 상수 (논리 좌표계 px 기준. 육안으로 조정)
const SIZE = 520
const CENTER = SIZE / 2
const DRUM_RADIUS = 244
const RIM = 5 // 드럼 테두리 두께 — 공은 테두리 안쪽에서만 반사
const BALL_RADIUS = 21
const GRAVITY = 0.25
const RESTITUTION = 0.85
const MAX_SPEED = 16

type SimBall = {
  n: number
  x: number
  y: number
  vx: number
  vy: number
  extracting: boolean
}

// 45개 공을 드럼 안에 겹치지 않게 대략적으로 흩뿌린다(초기 겹침은 첫 프레임 충돌 보정이 푼다).
function createBalls(): SimBall[] {
  const balls: SimBall[] = []
  for (let n = 1; n <= 45; n++) {
    const angle = Math.random() * Math.PI * 2
    const dist =
      Math.sqrt(Math.random()) * (DRUM_RADIUS - RIM - BALL_RADIUS - 2)
    balls.push({
      n,
      x: CENTER + Math.cos(angle) * dist,
      y: CENTER + Math.sin(angle) * dist,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.5) * 12,
      extracting: false,
    })
  }
  return balls
}

function stepPhysics(balls: SimBall[]) {
  const inner = DRUM_RADIUS - RIM - BALL_RADIUS

  for (const ball of balls) {
    if (ball.extracting) {
      // 뽑힌 공: 경계를 무시하고 출구(상단 중앙)로 빨려 올라간다.
      ball.vx += (CENTER - ball.x) * 0.02
      ball.vy -= 1.1
      ball.x += ball.vx
      ball.y += ball.vy
      continue
    }

    ball.vy += GRAVITY
    // 에어젯: 바닥 근처 공을 무작위로 세게 쳐올려 계속 요동하게 한다(가라앉음 방지).
    if (ball.y > CENTER + inner * 0.45 && Math.random() < 0.09) {
      ball.vy -= 7 + Math.random() * 6
      ball.vx += (Math.random() - 0.5) * 5
    }
    // 약한 난류
    ball.vx += (Math.random() - 0.5) * 0.35

    const speed = Math.hypot(ball.vx, ball.vy)
    if (speed > MAX_SPEED) {
      ball.vx = (ball.vx / speed) * MAX_SPEED
      ball.vy = (ball.vy / speed) * MAX_SPEED
    }

    ball.x += ball.vx
    ball.y += ball.vy

    // 원형 경계 반사
    const dx = ball.x - CENTER
    const dy = ball.y - CENTER
    const dist = Math.hypot(dx, dy)
    if (dist > inner && dist > 0) {
      const nx = dx / dist
      const ny = dy / dist
      ball.x = CENTER + nx * inner
      ball.y = CENTER + ny * inner
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

function drawFrame(ctx: CanvasRenderingContext2D, balls: SimBall[]) {
  ctx.clearRect(0, 0, SIZE, SIZE)

  // 유리 드럼: 은은한 채움 + 금색 테두리 + 상단 하이라이트
  const glass = ctx.createRadialGradient(
    CENTER - 70,
    CENTER - 90,
    40,
    CENTER,
    CENTER,
    DRUM_RADIUS,
  )
  glass.addColorStop(0, 'rgba(255, 255, 255, 0.16)')
  glass.addColorStop(0.55, 'rgba(110, 150, 230, 0.08)')
  glass.addColorStop(1, 'rgba(20, 30, 60, 0.28)')
  ctx.fillStyle = glass
  ctx.beginPath()
  ctx.arc(CENTER, CENTER, DRUM_RADIUS, 0, Math.PI * 2)
  ctx.fill()
  ctx.lineWidth = RIM
  ctx.strokeStyle = 'rgba(255, 212, 94, 0.55)'
  ctx.stroke()

  // 바닥 송풍구 힌트
  ctx.fillStyle = 'rgba(255, 212, 94, 0.16)'
  ctx.beginPath()
  ctx.moveTo(CENTER - 55, CENTER + DRUM_RADIUS - 8)
  ctx.lineTo(CENTER + 55, CENTER + DRUM_RADIUS - 8)
  ctx.lineTo(CENTER + 26, CENTER + DRUM_RADIUS - 62)
  ctx.lineTo(CENTER - 26, CENTER + DRUM_RADIUS - 62)
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
    ctx.font = "bold 17px 'Jua', 'Pretendard', sans-serif"
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(ball.n), 0, 1)

    ctx.restore()
  }

  // 상단 출구 캡(드럼 위 뚜껑)
  ctx.fillStyle = 'rgba(255, 212, 94, 0.9)'
  ctx.beginPath()
  ctx.roundRect(CENTER - 30, CENTER - DRUM_RADIUS - 12, 60, 18, 8)
  ctx.fill()
}

type DrawMachineCanvasProps = {
  // 게임 A의 공개 순서와 지금까지 공개된 수. 번호는 도메인에서 이미 확정 — 물리는 표시 전용이고,
  // 공개된 번호의 공을 출구로 내보내는 연출만 담당한다.
  revealOrder: number[]
  revealedCount: number
}

export function DrawMachineCanvas({
  revealOrder,
  revealedCount,
}: DrawMachineCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ballsRef = useRef<SimBall[]>([])

  // 새로 공개된 번호의 공을 '뽑히는 중'으로 표시한다.
  useEffect(() => {
    const revealed = new Set(revealOrder.slice(0, revealedCount))
    for (const ball of ballsRef.current) {
      if (revealed.has(ball.n) && !ball.extracting) {
        ball.extracting = true
        ball.vx = (CENTER - ball.x) * 0.05
        ball.vy = -10
      }
    }
  }, [revealOrder, revealedCount])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    // jsdom(테스트)에는 canvas 2D가 없다 — getContext를 호출하면 'Not implemented' 로그가
    // 시끄럽게 찍히므로, 인터페이스 존재부터 확인하고 시뮬레이션 없이 조용히 건너뛴다.
    if (typeof window.CanvasRenderingContext2D === 'undefined') return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = SIZE * dpr
    canvas.height = SIZE * dpr
    ctx.scale(dpr, dpr)

    ballsRef.current = createBalls()

    let frameId = 0
    const loop = () => {
      stepPhysics(ballsRef.current)
      // 출구 위로 완전히 빠져나간 공은 드럼에서 제거한다.
      ballsRef.current = ballsRef.current.filter(
        (ball) =>
          !(ball.extracting && ball.y < CENTER - DRUM_RADIUS - BALL_RADIUS * 2),
      )
      drawFrame(ctx, ballsRef.current)
      frameId = window.requestAnimationFrame(loop)
    }
    frameId = window.requestAnimationFrame(loop)

    return () => window.cancelAnimationFrame(frameId)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="draw-canvas"
      width={SIZE}
      height={SIZE}
      aria-hidden="true"
    />
  )
}
