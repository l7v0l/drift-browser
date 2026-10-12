import { resolve } from 'node:path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

const shared = { '@shared': resolve('src/shared'), '@features': resolve('src/features') }

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: { alias: shared }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: { alias: shared },
    build: { rollupOptions: { output: { format: 'cjs', entryFileNames: '[name].js' } } }
  },
  renderer: {
    plugins: [react()],
    resolve: { alias: { ...shared, '@renderer': resolve('src/renderer') } },
    build: {
      rollupOptions: {
        // index.html = browser chrome, pages.html = drift:// internal pages (lazy per page)
        input: {
          index: resolve('src/renderer/index.html'),
          pages: resolve('src/renderer/pages.html')
        }
      }
    }
  }
})
