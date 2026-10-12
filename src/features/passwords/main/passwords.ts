import { randomUUID } from 'node:crypto'
import { safeStorage } from 'electron'
import type { PasswordSummary, StoredPassword } from '@shared/types'
import { store } from '../../../main/store'
import type { Credentials, ExistingLogin } from './decide'

/** Passwords are encrypted with the OS key store (DPAPI on Windows) before they touch the disk. */
export const encryptionAvailable = (): boolean => safeStorage.isEncryptionAvailable()

const encrypt = (plain: string): string => safeStorage.encryptString(plain).toString('base64')
const decrypt = (enc: string): string => safeStorage.decryptString(Buffer.from(enc, 'base64'))

const all = (): StoredPassword[] => store.get('passwords')

const summary = ({ id, origin, username, updatedAt }: StoredPassword): PasswordSummary => ({
  id,
  origin,
  username,
  updatedAt
})

export const listPasswords = (): PasswordSummary[] =>
  all()
    .map(summary)
    .sort((a, b) => a.origin.localeCompare(b.origin) || a.username.localeCompare(b.username))

export function revealPassword(id: string): string {
  const entry = all().find((p) => p.id === id)
  if (!entry) throw new Error('not-found')
  return decrypt(entry.passwordEnc)
}

export function removePassword(id: string): PasswordSummary[] {
  store.set(
    'passwords',
    all().filter((p) => p.id !== id)
  )
  return listPasswords()
}

/** Compare a submitted login with what is saved for the site. */
export function existingFor(origin: string, password: string): ExistingLogin[] {
  return all()
    .filter((p) => p.origin === origin)
    .map((p) => {
      let same = false
      try {
        same = decrypt(p.passwordEnc) === password
      } catch {
        // Unreadable (e.g. profile copied to another machine): treat as different.
      }
      return { username: p.username, samePassword: same }
    })
}

export function savePassword(origin: string, username: string, password: string): void {
  const now = Date.now()
  const list = all()
  const at = list.findIndex((p) => p.origin === origin && p.username === username)
  if (at >= 0) {
    list[at] = { ...list[at], passwordEnc: encrypt(password), updatedAt: now }
  } else {
    list.push({
      id: randomUUID(),
      origin,
      username,
      passwordEnc: encrypt(password),
      createdAt: now,
      updatedAt: now
    })
  }
  store.set('passwords', list)
}

/** Logins to offer for autofill on this exact origin, most recently updated first. */
export function credentialsFor(origin: string): Credentials[] {
  const out: Credentials[] = []
  for (const p of [...all()]
    .filter((x) => x.origin === origin)
    .sort((a, b) => b.updatedAt - a.updatedAt)) {
    try {
      out.push({ username: p.username, password: decrypt(p.passwordEnc) })
    } catch {
      // skip unreadable entries
    }
  }
  return out
}

export const neverSaveList = (): string[] => store.get('neverSavePasswords')
export const isNeverSaved = (origin: string): boolean => neverSaveList().includes(origin)

export function addNeverSave(origin: string): void {
  if (!isNeverSaved(origin)) store.set('neverSavePasswords', [...neverSaveList(), origin])
}

export function removeNeverSave(origin: string): string[] {
  store.set(
    'neverSavePasswords',
    neverSaveList().filter((o) => o !== origin)
  )
  return neverSaveList()
}
