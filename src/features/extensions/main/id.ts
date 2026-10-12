/** Chrome Web Store ids are 32 letters a-p; accept a bare id or any web store URL. */
export function parseExtensionId(input: string): string | null {
  return input.match(/[a-p]{32}/)?.[0] ?? null
}
