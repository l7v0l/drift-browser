import type { ShortcutItem } from '@shared/types'
import { store } from '../../../main/store'

const MAX_SHORTCUTS = 12

export const listShortcuts = (): ShortcutItem[] => store.get('shortcuts')

export function setShortcuts(items: ShortcutItem[]): ShortcutItem[] {
  const clean = items
    .filter((i) => i && typeof i.url === 'string' && /^https?:\/\//i.test(i.url))
    .slice(0, MAX_SHORTCUTS)
    .map((i) => ({ id: String(i.id), title: String(i.title).slice(0, 60), url: i.url }))
  store.set('shortcuts', clean)
  return clean
}
