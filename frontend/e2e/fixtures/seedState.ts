import { readFileSync } from 'node:fs'
import path from 'node:path'
import { SEED_STATE_PATH, type SeedState } from './testData'

let cached: SeedState | null = null

/** globalSetup が書き出したシード結果（ユーザーID・投稿ID）を読む。 */
export function seedState(): SeedState {
  if (!cached) {
    cached = JSON.parse(readFileSync(path.resolve(SEED_STATE_PATH), 'utf-8')) as SeedState
  }
  return cached
}

export function userId(username: string): number {
  const id = seedState().userIds[username]
  if (id == null) {
    throw new Error(`シードされていないユーザーです: ${username}`)
  }
  return id
}
