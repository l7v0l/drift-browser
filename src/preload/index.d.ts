import type { DriftApi } from '@shared/ipc-types'

declare global {
  interface Window {
    drift: DriftApi
  }
}
