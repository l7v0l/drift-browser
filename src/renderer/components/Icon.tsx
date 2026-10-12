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
  pin: 'M9 4h6l-1 6 3 3H7l3-3zM12 13v7',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  download: 'M12 4v11M7 11l5 5 5-5M5 20h14',
  menu: 'M12 5h.01M12 12h.01M12 19h.01',
  folder: 'M3 7h6l2 2h10v10H3z',
  trash: 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13',
  volume: 'M4 9v6h4l5 4V5L8 9zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11',
  'volume-off': 'M4 9v6h4l5 4V5L8 9zM17 9l5 6M22 9l-5 6',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
  printer: 'M7 9V4h10v5M6 17H4v-7h16v7h-2M7 14h10v6H7z',
  code: 'M9 7l-5 5 5 5M15 7l5 5-5 5',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v6M12 7.5h.01',
  gear: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM19 12l2-1-1-3-2 .5-1.5-1.5L17 5l-3-1-1 2h-2L10 4 7 5l.5 2L6 8.5 4 8l-1 3 2 1v1l-2 1 1 3 2-.5L7.5 18 7 20l3 1 1-2h2l1 2 3-1-.5-2 1.5-1.5 2 .5 1-3-2-1z',
  power: 'M12 3v9M6.5 6.5a8 8 0 1 0 11 0',
  window: 'M4 6h16v12H4zM4 10h16',
  expand: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  minus: 'M5 12h14',
  chevron: 'M9 6l6 6-6 6',
  split: 'M3 5h18v14H3zM12 5v14',
  puzzle:
    'M10 4a2 2 0 1 1 4 0v2h4v4h-2a2 2 0 1 0 0 4h2v4h-4v-2a2 2 0 1 0-4 0v2H6v-4h2a2 2 0 1 0 0-4H6V6h4z',
  key: 'M14 10a4 4 0 1 0-3.9 3.4L10 16H8v2H6v2H3v-3l7.1-7.1A4 4 0 0 1 14 10zM17 7h.01',
  user: 'M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 20c0-4 4-6 8-6s8 2 8 6',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'
} as const

export type IconName = keyof typeof PATHS

interface Props {
  name: IconName
  size?: number
  /** Mirror in RTL layouts (directional arrows). */
  flip?: boolean
  filled?: boolean
  className?: string
}

export function Icon({ name, size = 18, flip, filled, className = '' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
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
