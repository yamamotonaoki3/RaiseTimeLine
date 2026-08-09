import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))

/** backend/docker-compose.yml の container_name。 */
const DB_CONTAINER = 'raisetimeline-db'
const DB_USER = 'raisetimeline'
const DB_NAME = 'raisetimeline'

/** 投稿画像の保存先。backend/docker-compose.yml と application.yml の app.s3.bucket-name に対応。 */
const MINIO_CONTAINER = 'raisetimeline-minio'
const MINIO_BUCKET = 'raisetimeline-post-images'

/**
 * テストの接続先がローカルであることを検証する。
 *
 * シード投入とクリーンアップは DELETE を伴うため、接続先を誤ると
 * ステージング／本番のデータを破壊しうる。localhost 以外を向いていたら
 * 何もせずに落とす（CLAUDE.md「テストデータの識別と後始末」3.）。
 */
export function assertLocalTarget(baseURL: string): void {
  const host = new URL(baseURL).hostname
  const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1'
  if (!isLocal) {
    throw new Error(
      `E2Eテストの接続先が localhost ではありません（${baseURL}）。\n` +
        'シード投入とクリーンアップはデータを削除するため、ローカル以外に対しては実行できません。',
    )
  }
}

/**
 * DBコンテナ内の psql に SQL を流し込む。
 * SQLファイルはホスト側にあるためコンテナへマウントされていない。標準入力経由で渡す。
 */
export function runSqlFile(fileName: string): string {
  const sql = readFileSync(path.join(here, fileName), 'utf-8')
  return execFileSync(
    'docker',
    ['exec', '-i', DB_CONTAINER, 'psql', '-U', DB_USER, '-d', DB_NAME, '-v', 'ON_ERROR_STOP=1'],
    { input: sql, encoding: 'utf-8' },
  )
}

/** DBコンテナが起動しているかを確認する（起動していなければ理由の分かるエラーにする）。 */
export function assertDbRunning(): void {
  try {
    execFileSync('docker', ['exec', DB_CONTAINER, 'pg_isready', '-U', DB_USER], {
      stdio: 'pipe',
    })
  } catch {
    throw new Error(
      `DBコンテナ（${DB_CONTAINER}）に接続できません。\n` +
        '先に「docker compose -f backend/docker-compose.yml up -d」でDBを起動してください。',
    )
  }
}

/**
 * MinIOコンテナが起動しているかを確認する。
 *
 * 未起動のまま実行すると「画像を含むシナリオだけが失敗する」という
 * 原因の分かりにくい落ち方をするため、先に理由を明示して止める。
 */
export function assertMinioRunning(): void {
  try {
    execFileSync('docker', ['exec', MINIO_CONTAINER, 'ls', `/data/${MINIO_BUCKET}`], {
      stdio: 'pipe',
    })
  } catch {
    throw new Error(
      `MinIOコンテナ（${MINIO_CONTAINER}）またはバケット（${MINIO_BUCKET}）に接続できません。\n` +
        '先に「docker compose -f backend/docker-compose.yml up -d」でMinIOを起動してください。',
    )
  }
}

/** psql でクエリを実行し、値だけを1行1件で受け取る。 */
function querySingleColumn(sql: string): string[] {
  const output = execFileSync(
    'docker',
    [
      'exec', '-i', DB_CONTAINER,
      'psql', '-U', DB_USER, '-d', DB_NAME,
      '-v', 'ON_ERROR_STOP=1',
      '-t', '-A', '-c', sql,
    ],
    { encoding: 'utf-8' },
  )
  return output.split('\n').map((line) => line.trim()).filter((line) => line.length > 0)
}

/**
 * E2Eテストが作った投稿画像だけを MinIO から削除する。
 *
 * DBの行を消してしまうと対象のkeyが分からなくなるため、
 * **e2e-cleanup.sql より先に呼ぶ必要がある**。
 *
 * バケットを丸ごと空にしないのは、手動確認で作った画像まで消してしまわないため。
 * プロジェクトの「識別子ベースで対象だけ削除する」方針に合わせている。
 *
 * @returns 削除したオブジェクトの件数
 */
export function deleteMinioObjectsForE2E(): number {
  const keys = querySingleColumn(
    `SELECT image_key FROM posts
     WHERE image_key IS NOT NULL
       AND (content LIKE '[E2E_TEST]%'
            OR user_id IN (SELECT id FROM users WHERE username LIKE 'e2euser\\_%'))`,
  )

  for (const key of keys) {
    // MinIOは /data/<バケット>/<key> にオブジェクトを持つ（ディレクトリとして格納される）
    execFileSync(
      'docker',
      ['exec', MINIO_CONTAINER, 'rm', '-rf', `/data/${MINIO_BUCKET}/${key}`],
      { stdio: 'pipe' },
    )
  }
  return keys.length
}
