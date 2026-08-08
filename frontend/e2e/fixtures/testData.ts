/**
 * E2Eテストで使う架空データの定義。
 *
 * プロジェクトのCLAUDE.md「テストデータの取り扱い」に従い、
 * 実データ・実在の個人名・実在しうるメールアドレスは一切使わない。
 *   - メールは RFC 2606 の予約ドメイン example.com（誤送信しても誰にも届かない）
 *   - ユーザー名は e2euser_ 接頭辞、投稿本文は [E2E_TEST] タグで識別可能にする
 *   - パスワードはテスト専用の固定値
 * ここで定義した識別子だけを条件に e2e-cleanup.sql が削除する。
 */

export const E2E_TAG = '[E2E_TEST]'
export const E2E_PASSWORD = 'E2ETest123!'

export interface SeedUser {
  /** ログインID */
  email: string
  /** 英数字とアンダースコアのみ（RegisterRequest のバリデーション） */
  username: string
  /** users.display_name は UNIQUE 制約があるため他ユーザーと重複させない */
  displayName: string
  /** 検索（表示名 or 読み仮名）のテストで使う */
  yomi: string
  password: string
}

/** 主役。ほとんどのテストはこのユーザーでログインした状態から始まる。 */
export const USER_A: SeedUser = {
  email: 'e2e-test-user-a@example.com',
  username: 'e2euser_a',
  displayName: 'E2EUser A',
  yomi: 'いーつーいーゆーざーえー',
  password: E2E_PASSWORD,
}

/** 「他人」役。フォロー／いいね／コメントの相手として使う（初期状態では A にフォローされていない）。 */
export const USER_B: SeedUser = {
  email: 'e2e-test-user-b@example.com',
  username: 'e2euser_b',
  displayName: 'E2EUser B',
  yomi: 'いーつーいーゆーざーびー',
  password: E2E_PASSWORD,
}

/**
 * 「フォロー中」タイムライン用。シード時点で A がフォロー済みにする。
 * follow.spec.ts が B のフォロー状態を出し入れしても、
 * timeline.spec.ts の「フォロー中フィード」が影響を受けないようにするための分離。
 */
export const USER_C: SeedUser = {
  email: 'e2e-test-user-c@example.com',
  username: 'e2euser_c',
  displayName: 'E2EUser C',
  yomi: 'いーつーいーゆーざーしー',
  password: E2E_PASSWORD,
}

export const SEED_USERS = [USER_A, USER_B, USER_C]

/** タイムラインの1ページは20件。追加読み込みを検証するため、それを超える件数をシードする。 */
export const PAGE_SIZE = 20
export const USER_C_POST_COUNT = 25

/** いいね・コメントの対象にする B の投稿本文。 */
export const USER_B_POST_CONTENT = `${E2E_TAG} B さんの投稿（いいね・コメントの対象）`

/** シード結果（ユーザーIDなど）の受け渡しに使うファイル。 */
export const SEED_STATE_PATH = 'e2e/.auth/seed.json'

export interface SeedState {
  userIds: Record<string, number>
  /** いいね・コメントのテスト対象になる B の投稿ID */
  userBPostId: number
}
