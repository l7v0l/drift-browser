import type { ClearRange, HistoryEntry } from '@shared/types'
import { store } from '../../../main/store'
import { listEntries, pruneHistory } from './prune'
import { filterHistory } from './search'

const MAX_ENTRIES = 5000

export function recordVisit(url: string, title: string): void {
  if (!/^https?:\/\//i.test(url)) return
  const entries = store.get('history')
  entries.push({ url, title, visitedAt: Date.now() })
  store.set('history', entries.slice(-MAX_ENTRIES))
}

export const getHistory = (): HistoryEntry[] => store.get('history')
export const searchHistory = (query: string, limit?: number) =>
  filterHistory(getHistory(), query, limit)
export const listHistory = (query?: string) => listEntries(getHistory(), query)

export const removeEntry = (visitedAt: number): void =>
  store.set(
    'history',
    getHistory().filter((e) => e.visitedAt !== visitedAt)
  )

export const clearHistory = (range: ClearRange): void =>
  store.set('history', pruneHistory(getHistory(), range, Date.now()))
