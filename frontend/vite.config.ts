/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * バックエンドへのプロキシ設定。
 *
 * dev（`vite dev`）と preview（`vite preview`）は別々の設定を参照するため、
 * 同じ内容を両方に渡す。preview 側が抜けていると、本番ビルド成果物に対する
 * 計測（perf-browser/）で /api が404になり、ログイン状態を復元できない。
 */
const apiProxy = {
  '/api': {
    target: 'http://localhost:8080',
    changeOrigin: true,
  },
}

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // e2e/ と perf-browser/ は Playwright が実行する。Vitest の既定の include に
    // *.spec.ts が含まれるため、明示的に除外しないと拾われてしまう
    // （拾われると「Playwright Test did not expect test() to be called here」で落ちる）。
    exclude: ['node_modules/**', 'dist/**', 'e2e/**', 'perf-browser/**'],
  },
  plugins: [react()],
  server: {
    proxy: apiProxy,
  },
  preview: {
    proxy: apiProxy,
  },
})
