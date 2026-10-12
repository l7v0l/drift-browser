/** Hostname of a URL, or '' when it is not a valid URL. */
export function hostOf(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}

/** True when `host` is on the allowlist, either exactly or as a subdomain of an entry. */
export function isAllowlisted(host: string, allowlist: string[]): boolean {
  if (!host) return false
  return allowlist.some((entry) => host === entry || host.endsWith('.' + entry))
}

/** Add or remove a host, keeping the list unique and sorted. */
export function setAllowed(allowlist: string[], host: string, allowed: boolean): string[] {
  const without = allowlist.filter((h) => h !== host)
  return allowed ? [...without, host].sort() : without
}
