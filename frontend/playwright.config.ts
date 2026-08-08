import { defineConfig, devices } from '@playwright/test'

/**
 * E2Eテスト設定。
 *
 * 前提: DB（docker compose）とバックエンド（gradlew bootRun）は別途起動しておくこと。
 * ここで自動起動するのは Vite（フロントエンド）のみ。
 *
 * 実行:
 *   npm run e2e             … chromium で実行
 *   npm run e2e:ui          … UIモード（ステップを巻き戻して確認できる）
 *   npx playwright test --project=firefox
 *   npx playwright test --project=msedge
 */
export default defineConfig({
  testDir: './e2e',
  // シードした共有ユーザー（e2euser_a/b/c）をテスト間で使い回すため、
  // 並列実行するとフォロー状態などが互いに干渉する。逐次実行で安定性を優先する。
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [['html', { open: 'never' }], ['list']],

  globalSetup: './e2e/fixtures/globalSetup.ts',
  globalTeardown: './e2e/fixtures/globalTeardown.ts',

  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // ログイン状態は e2e/fixtures/auth.ts がテストごとにAPIログインで用意する。
  // （リフレッシュトークンがローテーションされるため、storageState をファイルに
  //   保存して使い回すことはできない。詳細は同ファイルのコメントを参照）
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // 要件定義書の移植性要件（Chrome / Firefox / Edge 最新版）に対応する。
    // 日常の実行時間を抑えるため、既定では chromium のみ回し、
    // 以下は --project=firefox / --project=msedge で明示的に実行する。
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'msedge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
