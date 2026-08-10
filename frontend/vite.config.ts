/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // e2e/ は Playwright が実行する。Vitest の既定の include に
    // *.spec.ts が含まれるため、明示的に除外しないと拾われてしまう。
    exclude: ['node_modules/**', 'dist/**', 'e2e/**'],
  },
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
