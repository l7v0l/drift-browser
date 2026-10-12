import type { Settings } from './types'

/**
 * Single source of truth for IPC.
 * - `IpcInvokeMap`: renderer -> main request/response.
 * - `IpcEventMap`: main -> renderer push.
 * Add a channel here first; main handlers and the preload bridge are typed from it.
 */
export interface IpcInvokeMap {
  'settings:get': { args: []; result: Settings }
  'settings:set': { args: [patch: Partial<Settings>]; result: Settings }
  'app:info': { args: []; result: { name: string; version: string } }
}

export interface IpcEventMap {
  'settings:changed': Settings
}

export type InvokeChannel = keyof IpcInvokeMap
export type EventChannel = keyof IpcEventMap

export interface DriftApi {
  invoke<C extends InvokeChannel>(
    channel: C,
    ...args: IpcInvokeMap[C]['args']
  ): Promise<IpcInvokeMap[C]['result']>
  on<C extends EventChannel>(channel: C, listener: (payload: IpcEventMap[C]) => void): () => void
}

export const INVOKE_CHANNELS: InvokeChannel[] = ['settings:get', 'settings:set', 'app:info']
export const EVENT_CHANNELS: EventChannel[] = ['settings:changed']
