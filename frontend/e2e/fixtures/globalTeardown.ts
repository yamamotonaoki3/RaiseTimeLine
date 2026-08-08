import type { FullConfig } from '@playwright/test'
import { assertLocalTarget, runSqlFile } from './db'

/**
 * E2Eテスト全体の後処理。
 *
 * シードしたデータに加え、テスト中にUI経由で作成されたデータ（投稿・コメント・
 * いいね・フォロー）も、すべて e2euser_ ユーザー起因か [E2E_TEST] タグ付きのため、
 * 同じ e2e-cleanup.sql でまとめて削除される。
 * 最後に残存件数（すべて0であること）を出力する。
 */
async function globalTeardown(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL ?? 'http://localhost:5173'
  assertLocalTarget(baseURL)

  const output = runSqlFile('e2e-cleanup.sql')
  console.log('[e2e] テストデータを削除しました（残存件数は0であること）')
  console.log(output.trim())
}

export default globalTeardown
