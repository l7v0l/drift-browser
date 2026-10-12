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

contextBridge.exposeInMainWorld('drift', api)
