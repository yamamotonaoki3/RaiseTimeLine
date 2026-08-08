import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))

/** backend/docker-compose.yml の container_name。 */
const DB_CONTAINER = 'raisetimeline-db'
const DB_USER = 'raisetimeline'
const DB_NAME = 'raisetimeline'

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
