import { Fragment, useState } from 'react'
import { Ball } from './Ball'
import type { GeneratedNumbers } from '../domain/types'

const LABELS = ['A', 'B', 'C', 'D', 'E']

type TicketProps = {
  games: GeneratedNumbers[]
  modeLabel: string
  // 전문가 훈수(패러디) 멘트 — 뽑기 시점에 확정된 값을 받는다(spec: expert-parody).
  quip: string
  // 단골 빈도 설명 — frequent 모드에서만 게임별 한 줄(spec: frequent-stat-note). 없으면 null.
  notes: string[] | null
}

function gameText(game: GeneratedNumbers): string {
  return game.numbers.join(', ')
}

// navigator.clipboard는 보안 컨텍스트(https/localhost)에서만 동작한다.
// 실패하거나 미지원이면 textarea+execCommand 폴백을 시도하고, 그마저 실패하면 false를 돌려준다.
async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // 폴백으로 넘어간다.
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

// 뽑은 A~E 게임을 로또 용지로 렌더하고 게임별/전체 복사를 제공한다. 보너스 없이 본번호 6개만.
export function Ticket({ games, modeLabel, quip, notes }: TicketProps) {
  // 복사 피드백: 성공한 키('all' | 'g0'…) 또는 실패한 키('all:fail' 등). 잠시 뒤 해제한다.
  const [copied, setCopied] = useState<string | null>(null)

  async function handleCopy(text: string, key: string) {
    const ok = await writeClipboard(text)
    setCopied(ok ? key : `${key}:fail`)
    window.setTimeout(() => setCopied(null), 1600)
  }

  const allText = games
    .map((game, i) => `${LABELS[i]}: ${gameText(game)}`)
    .join('\n')

  return (
    <>
      <div className="ticket">
        <div className="ticket-head">
          <span className="t">🎟 내가 뽑은 번호</span>
          <span className="s">
            {modeLabel} · {games.length}게임
          </span>
        </div>

        {games.map((game, i) => {
          const key = `g${i}`
          const state =
            copied === key ? 'done' : copied === `${key}:fail` ? 'fail' : ''
          return (
            <Fragment key={i}>
              <div className={`game${notes ? ' with-note' : ''}`}>
                <span className="glabel">{LABELS[i]}</span>
                <div className="game-balls">
                  {game.numbers.map((n) => (
                    <Ball key={n} number={n} size="tk" />
                  ))}
                </div>
                <button
                  type="button"
                  className="gcopy"
                  onClick={() => handleCopy(gameText(game), key)}
                >
                  {state === 'done'
                    ? '복사됨 ✓'
                    : state === 'fail'
                      ? '복사 실패'
                      : '📋 복사'}
                </button>
              </div>
              {notes && (
                <p className={`gnote${i === games.length - 1 ? ' nb' : ''}`}>
                  {notes[i]}
                </p>
              )}
            </Fragment>
          )
        })}

        <p className="quip">
          🧙 전문가 훈수{' '}
          <span className="quip-tag">패러디 · 과학적 근거 없음</span>
          <br />
          {quip}
        </p>
      </div>

      <button
        type="button"
        className="copyall"
        onClick={() => handleCopy(allText, 'all')}
      >
        {copied === 'all'
          ? '전체 복사됨 ✓'
          : copied === 'all:fail'
            ? '복사 실패'
            : '📋 전체 복사'}
      </button>
      <a
        className="buylink"
        href="https://dhlottery.co.kr"
        target="_blank"
        rel="noopener noreferrer"
      >
        🎫 동행복권에서 구매하기
      </a>
    </>
  )
}
