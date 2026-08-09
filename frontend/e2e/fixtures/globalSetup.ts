import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { FullConfig } from '@playwright/test'
import { request } from '@playwright/test'
import {
  assertDbRunning,
  assertLocalTarget,
  assertMinioRunning,
  deleteMinioObjectsForE2E,
  runSqlFile,
} from './db'
import {
  E2E_TAG,
  SEED_STATE_PATH,
  SEED_USERS,
  USER_A,
  USER_B,
  USER_B_POST_CONTENT,
  USER_C,
  USER_C_POST_COUNT,
  type SeedState,
  type SeedUser,
} from './testData'

/**
 * E2Eテスト全体の前処理。
 *
 * 1. 接続先がローカルであることを確認する（本番を壊さないためのガード）
 * 2. 前回の残骸を削除する（異常終了しても再実行できるようにするため）
 * 3. API経由でテストユーザーと投稿を作成する
 *
 * シードをSQLではなくAPI経由で行うのは、登録・投稿APIそのものも通ることを
 * 確認できるうえ、パスワードハッシュ化などの実装を二重に持たずに済むため。
 */
async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL ?? 'http://localhost:5173'

  assertLocalTarget(baseURL)
  assertDbRunning()
  assertMinioRunning()

  console.log('[e2e] 前回のテストデータを削除します')
  // DBの行を消す前に、対応する画像をMinIOから削除する（順序が逆だとkeyを辿れない）
  deleteMinioObjectsForE2E()
  runSqlFile('e2e-cleanup.sql')

  const api = await request.newContext({ baseURL })

  const userIds: Record<string, number> = {}
  const tokens: Record<string, string> = {}

  for (const user of SEED_USERS) {
    const { id, accessToken } = await register(api, baseURL, user)
    userIds[user.username] = id
    tokens[user.username] = accessToken
  }

  // A が C をフォローした状態にする。
  // 「フォロー中」タイムラインの検証用。follow.spec.ts は B を使うため、
  // フォローの出し入れがタイムラインのテストに影響しない。
  await api.post(`/api/users/${userIds[USER_C.username]}/follows`, {
    headers: authHeader(tokens[USER_A.username]),
  })

  // C の投稿（1ページ20件を超える件数）。追加読み込みの検証に使う。
  for (let i = 1; i <= USER_C_POST_COUNT; i++) {
    await createPost(
      api,
      tokens[USER_C.username],
      `${E2E_TAG} C さんの投稿 ${String(i).padStart(2, '0')}`,
    )
  }

  // B の投稿。いいね・コメントの対象。
  const userBPostId = await createPost(api, tokens[USER_B.username], USER_B_POST_CONTENT)

  // C にアバターを設定する。
  // フォロー中一覧・検索結果（UserSummaryResponse）でアバターのpresigned URLが
  // 正しく発行されているかを検証するため、「自分以外のユーザーがアバターを持つ」状態が要る。
  await setAvatar(api, tokens[USER_C.username], userIds[USER_C.username])

  await api.dispose()

  const state: SeedState = { userIds, userBPostId }
  const statePath = path.resolve(SEED_STATE_PATH)
  mkdirSync(path.dirname(statePath), { recursive: true })
  writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf-8')

  console.log(
    `[e2e] シード完了: ユーザー${SEED_USERS.length}名 / C の投稿${USER_C_POST_COUNT}件 / B の投稿1件`,
  )
}

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` }
}

async function register(
  api: Awaited<ReturnType<typeof request.newContext>>,
  baseURL: string,
  user: SeedUser,
): Promise<{ id: number; accessToken: string }> {
  const res = await api.post('/api/auth/register', {
    data: {
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      password: user.password,
      yomi: user.yomi,
    },
  })
  if (!res.ok()) {
    throw new Error(
      `テストユーザー ${user.username} の作成に失敗しました（${res.status()}）: ${await res.text()}\n` +
        `バックエンドが ${baseURL} 経由で起動しているか確認してください。`,
    )
  }
  const body = await res.json()
  return { id: body.userId, accessToken: body.accessToken }
}

/** プロフィール更新APIでアバターを設定する。 */
async function setAvatar(
  api: Awaited<ReturnType<typeof request.newContext>>,
  token: string,
  userId: number,
): Promise<void> {
  const avatarPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'avatar.png')
  const res = await api.put(`/api/users/${userId}`, {
    headers: authHeader(token),
    multipart: {
      displayName: USER_C.displayName,
      bio: `${E2E_TAG} 一覧表示の検証用`,
      avatar: {
        name: 'avatar.png',
        mimeType: 'image/png',
        buffer: readFileSync(avatarPath),
      },
    },
  })
  if (!res.ok()) {
    throw new Error(`アバターの設定に失敗しました（${res.status()}）: ${await res.text()}`)
  }
}

async function createPost(
  api: Awaited<ReturnType<typeof request.newContext>>,
  token: string,
  content: string,
): Promise<number> {
  const res = await api.post('/api/posts', {
    headers: authHeader(token),
    multipart: { content },
  })
  if (!res.ok()) {
    throw new Error(`投稿の作成に失敗しました（${res.status()}）: ${await res.text()}`)
  }
  return (await res.json()).id
}

export default globalSetup
