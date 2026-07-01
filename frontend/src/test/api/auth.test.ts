import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import { login, register, setAccessToken, getAccessToken } from '../../api/auth'

describe('auth API', () => {
  // --- login() の同値分割 ---

  it('login: 有効クラス（200）→ AuthResponse が返る', async () => {
    const result = await login('test@example.com', 'Pass1234')
    expect(result.accessToken).toBe('test-access-token')
    expect(result.email).toBe('test@example.com')
  })

  it('login: 無効クラス（401）→ 例外がスローされる', async () => {
    server.use(http.post('/api/auth/login', () => HttpResponse.json({ message: '認証失敗' }, { status: 401 })))
    await expect(login('bad@example.com', 'wrongpass')).rejects.toThrow()
  })

  // --- register() の同値分割 ---

  it('register: 有効クラス（201）→ AuthResponse が返る', async () => {
    const result = await register('new@example.com', 'new_user', '新規ユーザー', 'Pass1234')
    expect(result.accessToken).toBe('test-access-token')
  })

  it('register: 無効クラス（400: 重複）→ 例外がスローされる', async () => {
    server.use(
      http.post('/api/auth/register', () =>
        HttpResponse.json({ message: 'メールアドレスが重複' }, { status: 400 }),
      ),
    )
    await expect(register('dup@example.com', 'dup_user', '重複', 'Pass1234')).rejects.toThrow()
  })

  // --- setAccessToken / getAccessToken の状態管理 ---

  beforeEach(() => {
    setAccessToken(null)
  })

  it('setAccessToken: セット後に getAccessToken で同じ値が返る', () => {
    setAccessToken('my-token')
    expect(getAccessToken()).toBe('my-token')
  })

  it('setAccessToken: null をセットすると getAccessToken が null を返す', () => {
    setAccessToken('some-token')
    setAccessToken(null)
    expect(getAccessToken()).toBeNull()
  })
})
