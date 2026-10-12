export const NEW_TAB_URL = 'drift://newtab'
export const TAB_STRIP_HEIGHT = 40
export const TOOLBAR_HEIGHT = 48
export const BOOKMARKS_BAR_HEIGHT = 36
export const FIND_BAR_HEIGHT = 44
export const CHROME_HEIGHT = TAB_STRIP_HEIGHT + TOOLBAR_HEIGHT
export const NORMAL_PARTITION = 'persist:drift'
export const DRIFT_PAGES = [
  'newtab',
  'settings',
  'history',
  'bookmarks',
  'downloads',
  'about'
] as const
export const DRIFT_SCHEME = 'drift:'
