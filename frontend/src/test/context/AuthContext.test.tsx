import { describe, it, expect } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import { AuthProvider } from '../../context/AuthContext'
import { useAuth } from '../../context/useAuth'

function TestConsumer() {
  const { user, login, logout, updateDisplayName, updateAvatarUrl } = useAuth()
  return (
    <div>
      <span data-testid="user">{user ? user.displayName : 'no-user'}</span>
      <button
        onClick={() =>
          login('new-token', {
            userId: 99,
            displayName: 'ログイン太郎',
            email: 'login@example.com',
            avatarUrl: null,
          })
        }
      >
        login
      </button>
      <button onClick={() => logout().catch(() => {})}>logout</button>
      <button onClick={() => updateDisplayName('更新済み名前')}>updateDisplayName</button>
      <button onClick={() => updateAvatarUrl('https://example.com/avatar.png')}>updateAvatarUrl</button>
    </div>
  )
}

describe('AuthContext', () => {
  // --- 初回マウント時の refresh 結果による分岐 ---

  it('refresh 成功（有効クラス）→ user がセットされる', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('テストユーザー')
    })
  })

  it('refresh 失敗（無効クラス：401）→ user は null のまま', async () => {
    server.use(http.post('/api/auth/refresh', () => HttpResponse.json({}, { status: 401 })))

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('no-user')
    })
  })

  // --- login/logout/updateDisplayName/updateAvatarUrl の状態遷移 ---

  it('login: 呼び出すと user が更新される', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('テストユーザー'))

    act(() => screen.getByRole('button', { name: 'login' }).click())

    expect(screen.getByTestId('user')).toHaveTextContent('ログイン太郎')
  })

  it('logout: 呼び出すと user が null になる', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('テストユーザー'))

    await act(async () => {
      screen.getByRole('button', { name: 'logout' }).click()
    })

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('no-user'))
  })

  it('updateDisplayName: user の displayName のみ更新される', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('テストユーザー'))

    act(() => screen.getByRole('button', { name: 'updateDisplayName' }).click())

    expect(screen.getByTestId('user')).toHaveTextContent('更新済み名前')
  })

  it('logout: API がエラーでも user は null になる（finally で必ずクリアされる）', async () => {
    server.use(http.post('/api/auth/logout', () => HttpResponse.json({}, { status: 500 })))
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('テストユーザー'))

    await act(async () => {
      screen.getByRole('button', { name: 'logout' }).click()
    })

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('no-user'))
  })
})
