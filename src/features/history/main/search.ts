import type { HistoryEntry, Suggestion } from '@shared/types'

/** Newest-first match on url/title, one result per URL. */
export function filterHistory(entries: HistoryEntry[], query: string, limit = 6): Suggestion[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const seen = new Set<string>()
  const out: Suggestion[] = []
  for (let i = entries.length - 1; i >= 0 && out.length < limit; i--) {
    const e = entries[i]
    if (seen.has(e.url)) continue
    if (e.url.toLowerCase().includes(q) || e.title.toLowerCase().includes(q)) {
      seen.add(e.url)
      out.push({ url: e.url, title: e.title, source: 'history' })
    }
  }
  return out
}
