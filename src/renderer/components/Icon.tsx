const PATHS = {
  back: 'M15 18l-6-6 6-6',
  forward: 'M9 6l6 6-6 6',
  reload: 'M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5',
  stop: 'M6 6l12 12M18 6L6 18',
  home: 'M4 11l8-7 8 7v9h-5v-6H9v6H4z',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z',
  warn: 'M12 4l9 16H3zM12 10v4M12 17h.01',
  close: 'M6 6l12 12M18 6L6 18',
  plus: 'M12 5v14M5 12h14',
  globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4',
  pin: 'M9 4h6l-1 6 3 3H7l3-3zM12 13v7'
} as const

export type IconName = keyof typeof PATHS

interface Props {
  name: IconName
  size?: number
  /** Mirror in RTL layouts (directional arrows). */
  flip?: boolean
  className?: string
}

export function Icon({ name, size = 18, flip, className = '' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${flip ? 'rtl:-scale-x-100' : ''} ${className}`}
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
