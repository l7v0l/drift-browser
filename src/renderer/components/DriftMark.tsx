/** The Drift logo (squircle + wave + arrow) at icon size, used where a page has no favicon. */
export function DriftMark({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" className="shrink-0" aria-hidden="true">
      <defs>
        <linearGradient id="dm-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#16656B" />
          <stop offset="1" stopColor="#0A3F43" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="124" fill="url(#dm-bg)" />
      <path
        d="M96 316 C146 212 222 212 258 276 C294 340 340 338 372 296"
        fill="none"
        stroke="#FEF9F1"
        strokeWidth="56"
        strokeLinecap="round"
      />
      <path
        d="M352 262 L430 262 L430 340 Z"
        fill="#FF7A59"
        stroke="#FF7A59"
        strokeWidth="20"
        strokeLinejoin="round"
        transform="rotate(-56 372 296) translate(-14 34)"
      />
    </svg>
  )
}
