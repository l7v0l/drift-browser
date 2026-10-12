import type { WebContents } from 'electron'
import type { EventChannel, IpcEventMap } from '@shared/ipc-types'

export function send<C extends EventChannel>(
  wc: WebContents,
  channel: C,
  payload: IpcEventMap[C]
): void {
  if (!wc.isDestroyed()) wc.send(channel, payload)
}
