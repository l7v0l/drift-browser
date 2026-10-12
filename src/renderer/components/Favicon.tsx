import { useState } from 'react'
import { DriftMark } from './DriftMark'
import { Icon } from './Icon'

/** Site icon. Internal drift:// pages show the Drift logo; other sites fall back to a globe. */
export function Favicon({
  src,
  url,
  size = 16
}: {
  src: string | null | undefined
  url?: string
  size?: number
}) {
  const [failed, setFailed] = useState(false)
  if (url?.startsWith('drift://')) return <DriftMark size={size} />
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
