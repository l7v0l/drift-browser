export interface DiscardCandidate {
  id: number
  lastActive: number
  loaded: boolean
  /** Loading or playing audio: never unload these. */
  busy: boolean
}

/** Ids of loaded background tabs that have been idle longer than maxIdleMs. */
export function pickIdleTabs(
  tabs: DiscardCandidate[],
  activeId: number | null,
  now: number,
  maxIdleMs: number
): number[] {
  return tabs
    .filter((t) => t.loaded && !t.busy && t.id !== activeId && now - t.lastActive >= maxIdleMs)
    .map((t) => t.id)
}
