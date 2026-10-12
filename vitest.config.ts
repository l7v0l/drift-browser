import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { alias: { '@shared': resolve('src/shared'), '@features': resolve('src/features') } },
  test: { include: ['tests/**/*.test.ts'] }
})
