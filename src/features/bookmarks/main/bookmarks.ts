import type { Suggestion } from '@shared/types'

// Phase 4: real bookmark storage. This stub keeps the suggestion pipeline wired.
export const searchBookmarks = (query: string, limit?: number): Suggestion[] => {
  void query
  void limit
  return []
}
