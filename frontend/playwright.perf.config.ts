import { defineConfig } from '@playwright/test'

/**
 * ブラウザパフォーマンステスト（Lighthouse）の設定。
 *
 * E2E（playwright.config.ts）とは目的が違うため設定を分けている。
 *   - E2E   : devサーバ（5173）に対して機能の正しさを検証する
 *   - こちら: **本番ビルド成果物**（vite preview / 4173）に対して性能を計測する
 *
 * 前提: DB（docker compose）とバックエンド（gradlew bootRun）は別途起動しておくこと。
 * ここで自動起動するのは build + preview のみ。
 *
 * 実行: npm run perf:browser
 */
/**
 * preview の待ち受けポート。
 * vite preview の既定（4173）は他プロジェクトと衝突しやすいため、ここでは 4183 を使う。
 */
const PORT = Number(process.env.PERF_PORT ?? 4183)
const BASE_URL = process.env.PERF_BASE_URL ?? `http://localhost:${PORT}`

export default defineConfig({
  testDir: './perf-browser',
  testMatch: '**/*.perf.spec.ts',
  // 計測は他プロセスの負荷に影響されるため、必ず1件ずつ直列で実行する。
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 180_000,
  reporter: [['list']],

  // シード（e2euser_a/b/c と投稿）はE2Eと同じものを使う。
  // baseURL が preview 側になるため、API呼び出しは preview のプロキシ経由で通る。
  globalSetup: './e2e/fixtures/globalSetup.ts',
  globalTeardown: './e2e/fixtures/globalTeardown.ts',

  use: {
    baseURL: BASE_URL,
  },

  webServer: {
    // 古い dist/ を計測する事故を防ぐため、毎回ビルドしてから preview を起動する。
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    // 常に作りたてのビルドを測るため、既存サーバは再利用しない。
    reuseExistingServer: false,
    timeout: 180_000,
  },
})
