import { test as base } from '@playwright/test'
import { USER_A, USER_B, type SeedUser } from './testData'

/**
 * ログイン済みの状態でテストを始めるための拡張。
 *
 * このアプリはリフレッシュトークンを**ローテーション**する
 * （AuthService.refreshSession が古いトークンを削除して新しいものを発行する）。
 * そのため、ログイン結果をファイルに保存して全テストで使い回す一般的な
 * storageState の手順は使えない。保存したトークンは最初の1回で失効し、
 * 2番目以降のテストは 401 → /login にリダイレクトされてしまう。
 *
 * ここでは storageState フィクスチャ自体を上書きし、**テストごとにAPIでログインして
 * そのテスト専用のリフレッシュトークン（Cookie）を渡す**。
 * ブラウザ側はページ読み込み時に AuthContext が /api/auth/refresh を呼び、
 * そのCookieからログイン状態を復元する。
 */
function loggedInAs(user: SeedUser) {
  return base.extend({
    storageState: async ({ playwright, baseURL }, use) => {
      const context = await playwright.request.newContext({ baseURL })
      const res = await context.post('/api/auth/login', {
        data: { email: user.email, password: user.password },
      })
      if (!res.ok()) {
        throw new Error(
          `${user.username} のログインに失敗しました（${res.status()}）: ${await res.text()}\n` +
            'シードが実行されているか、バックエンドが起動しているか確認してください。',
        )
      }
      const state = await context.storageState()
      await context.dispose()
      await use(state)
    },
  })
}

/** 主役ユーザーAでログイン済みの test。ほとんどのシナリオはこれを使う。 */
export const test = loggedInAs(USER_A)

/** 「他人」役のユーザーBでログイン済みの test。 */
export const testAsUserB = loggedInAs(USER_B)

export { expect } from '@playwright/test'
