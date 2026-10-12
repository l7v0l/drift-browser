import { useTranslation } from 'react-i18next'

/** Animated Drift logo: squircle pops in, the wave draws itself, the arrow springs forward. */
export function Splash({ leaving }: { leaving: boolean }) {
  const { t } = useTranslation()
  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-surface transition-opacity duration-500 ${
        leaving ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <svg viewBox="0 0 512 512" width="168" height="168" aria-hidden="true">
        <defs>
          <linearGradient id="sp-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#16656B" />
            <stop offset="1" stopColor="#0A3F43" />
          </linearGradient>
          <linearGradient
            id="sp-wave"
            x1="80"
            y1="0"
            x2="400"
            y2="0"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#FEF9F1" />
            <stop offset="1" stopColor="#F4BE4E" />
          </linearGradient>
        </defs>
        <rect className="splash-squircle" width="512" height="512" rx="124" fill="url(#sp-bg)" />
        <path
          className="splash-wave"
          pathLength="1"
          d="M96 316 C146 212 222 212 258 276 C294 340 340 338 372 296"
          fill="none"
          stroke="url(#sp-wave)"
          strokeWidth="52"
          strokeLinecap="round"
        />
        <g className="splash-arrow">
          <path
            d="M352 262 L430 262 L430 340 Z"
            fill="#FF7A59"
            stroke="#FF7A59"
            strokeWidth="20"
            strokeLinejoin="round"
            transform="rotate(-56 372 296) translate(-14 34)"
          />
        </g>
      </svg>
      <div className="flex flex-col items-center gap-1">
        <span className="splash-title font-display text-5xl font-semibold tracking-tight">
          Drift
        </span>
        <span className="splash-tag text-lg text-muted">{t('app.tagline')}</span>
      </div>
    </div>
  )
}
