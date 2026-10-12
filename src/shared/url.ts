import type { SearchEngine } from './types'

const SEARCH_URLS: Record<SearchEngine, string> = {
  google: 'https://www.google.com/search?q=',
  bing: 'https://www.bing.com/search?q=',
  duckduckgo: 'https://duckduckgo.com/?q='
}

const SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i
const HOST_LIKE = /^(localhost|(\d{1,3}\.){3}\d{1,3}|([a-z0-9-]+\.)+[a-z]{2,})(:\d+)?(\/.*)?$/i
const LOCAL_HOST = /^(localhost|127\.|\d{1,3}(\.\d{1,3}){3})/

/** Turn address-bar input into a navigable URL, or a search URL for plain text. */
export function resolveInput(input: string, engine: SearchEngine): string {
  const text = input.trim()
  if (!text) return ''
  if (SCHEME.test(text)) return text
  if (!/\s/.test(text) && HOST_LIKE.test(text)) {
    return `${LOCAL_HOST.test(text) ? 'http' : 'https'}://${text}`
  }
  return SEARCH_URLS[engine] + encodeURIComponent(text)
}
