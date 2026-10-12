import { useEffect } from 'react'

let openCount = 0

/**
 * While any dropdown/menu is open the main process expands the chrome view over the whole
 * window (page views are native and would otherwise draw on top of the dropdown).
 */
export function useOverlay(active: boolean): void {
  useEffect(() => {
    if (!active) return
    if (openCount++ === 0) void window.drift.invoke('ui:set-overlay', true)
    return () => {
      if (--openCount === 0) void window.drift.invoke('ui:set-overlay', false)
    }
  }, [active])
}
