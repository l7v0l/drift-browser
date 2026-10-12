import type { ClearRange, HistoryEntry } from '@shared/types'

const RANGE_MS: Record<Exclude<ClearRange, 'all'>, number> = {
  hour: 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000
}

/** Entries that survive clearing the given range (older than the cutoff are kept). */
export function pruneHistory(
  entries: HistoryEntry[],
  range: ClearRange,
  now: number
): HistoryEntry[] {
  if (range === 'all') return []
  const cutoff = now - RANGE_MS[range]
  return entries.filter((e) => e.visitedAt < cutoff)
}

/** Newest first, optional text match on url/title, capped for the history page. */
export function listEntries(entries: HistoryEntry[], query = '', limit = 1000): HistoryEntry[] {
  const q = query.trim().toLowerCase()
  const out: HistoryEntry[] = []
  for (let i = entries.length - 1; i >= 0 && out.length < limit; i--) {
    const e = entries[i]
    if (!q || e.url.toLowerCase().includes(q) || e.title.toLowerCase().includes(q)) out.push(e)
  }
  return out
}
