import { http, HttpResponse } from 'msw'

const DUMMY_AUTH = {
  accessToken: 'test-access-token',
  userId: 1,
  displayName: 'テストユーザー',
  email: 'test@example.com',
  avatarUrl: null,
}

const DUMMY_USERS = [
  { id: 2, displayName: '検索結果ユーザー', avatarUrl: null, bio: null, followedByMe: false },
]

export const handlers = [
  http.post('/api/auth/login', () => HttpResponse.json(DUMMY_AUTH)),
  http.post('/api/auth/register', () => HttpResponse.json(DUMMY_AUTH, { status: 201 })),
  http.get('/api/users/search', () => HttpResponse.json(DUMMY_USERS)),
]
