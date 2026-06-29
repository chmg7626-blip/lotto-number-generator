import { zoneOf } from './zones'

type BallSize = 'md' | 'tk' | 'sm'

type BallProps = {
  number: number
  size?: BallSize
}

export function Ball({ number, size = 'md' }: BallProps) {
  const sizeClass = size === 'md' ? '' : ` ${size}`
  return <span className={`ball${sizeClass} ${zoneOf(number)}`}>{number}</span>
}
