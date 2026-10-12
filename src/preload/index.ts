import { contextBridge, ipcRenderer } from 'electron'
import { EVENT_CHANNELS, INVOKE_CHANNELS, type DriftApi } from '@shared/ipc-types'

const api: DriftApi = {
  invoke: (channel, ...args) => {
    if (!INVOKE_CHANNELS.includes(channel)) return Promise.reject(new Error(`Blocked: ${channel}`))
    return ipcRenderer.invoke(channel, ...args)
  },
  on: (channel, listener) => {
    if (!EVENT_CHANNELS.includes(channel)) throw new Error(`Blocked: ${channel}`)
    const wrapped = (_e: unknown, payload: Parameters<typeof listener>[0]): void =>
      listener(payload)
    ipcRenderer.on(channel, wrapped)
    return () => ipcRenderer.removeListener(channel, wrapped)
  }
}

// Every tab view loads this preload, but the bridge exists only in the chrome UI (flagged by
// main) and on drift:// pages. Ordinary websites never see it; main re-checks the sender anyway.
if (process.argv.includes('--drift-ui') || location.protocol === 'drift:') {
  contextBridge.exposeInMainWorld('drift', api)
}
