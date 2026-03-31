import { cn, ragColour } from '@/lib/utils'

interface ScoreGaugeProps {
  pct: number
  label?: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

const sizeMap = {
  sm: { outer: 'h-2 w-24', text: 'text-xs' },
  md: { outer: 'h-3 w-36', text: 'text-sm' },
  lg: { outer: 'h-4 w-48', text: 'text-base' },
}

const colourMap = {
  red:   'bg-red-500',
  amber: 'bg-amber-400',
  green: 'bg-green-500',
}

/**
 * Reused for MEDDPICC total score and per-element scores.
 */
export function ScoreGauge({ pct, label, size = 'md', showLabel = true }: ScoreGaugeProps) {
  const colour = ragColour(pct)
  const { outer, text } = sizeMap[size]

  return (
    <div className="flex items-center gap-2">
      <div className={cn('rounded-full bg-gray-200 overflow-hidden', outer)}>
        <div
          className={cn('h-full rounded-full transition-all duration-300', colourMap[colour])}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      {showLabel && (
        <span className={cn('font-semibold tabular-nums', text, {
          'text-red-600': colour === 'red',
          'text-amber-600': colour === 'amber',
          'text-green-600': colour === 'green',
        })}>
          {pct}%{label ? ` ${label}` : ''}
        </span>
      )}
    </div>
  )
}
