import { createHash, randomBytes } from 'node:crypto'

const base64url = (buf: Buffer): string => buf.toString('base64url')

/** RFC 7636 code verifier: 43-128 unreserved characters. */
export const createVerifier = (): string => base64url(randomBytes(48))

export const createChallenge = (verifier: string): string =>
  base64url(createHash('sha256').update(verifier).digest())

/** Random value that ties the redirect back to this sign-in attempt (CSRF protection). */
export const createState = (): string => base64url(randomBytes(24))
