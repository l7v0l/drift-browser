import { useState } from 'react'
import { Icon } from './Icon'

/** Site icon with a globe fallback when there is no icon or it fails to load. */
export function Favicon({ src, size = 16 }: { src: string | null; size?: number }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) return <Icon name="globe" size={size} className="shrink-0 text-muted" />
  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-sm"
      onError={() => setFailed(true)}
    />
  )
}
