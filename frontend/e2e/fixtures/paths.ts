/**
 * 未認証状態（ログイン・新規登録のテスト用）。
 *
 * ログイン済み状態はファイルに保存せず、auth.ts がテストごとに用意する。
 */
export const NO_STORAGE_STATE = { cookies: [], origins: [] }
