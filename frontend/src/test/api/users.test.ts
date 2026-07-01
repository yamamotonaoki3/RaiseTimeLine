import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import { searchUsers } from '../../api/users'

describe('users API', () => {
  // --- searchUsers() の同値分割 ---

  it('searchUsers: 結果あり（有効クラス）→ ユーザー配列が返る', async () => {
    const result = await searchUsers('検索結果')
    expect(result).toHaveLength(1)
    expect(result[0].displayName).toBe('検索結果ユーザー')
  })

  it('searchUsers: 結果なし（有効クラス：空）→ 空配列が返る', async () => {
    server.use(http.get('/api/users/search', () => HttpResponse.json([])))
    const result = await searchUsers('zzzzz')
    expect(result).toHaveLength(0)
  })

  it('searchUsers: クエリパラメータ q が正しく送信される', async () => {
    let capturedQ: string | null = null
    server.use(
      http.get('/api/users/search', ({ request }) => {
        const url = new URL(request.url)
        capturedQ = url.searchParams.get('q')
        return HttpResponse.json([])
      }),
    )
    await searchUsers('テスト検索')
    expect(capturedQ).toBe('テスト検索')
  })
})
