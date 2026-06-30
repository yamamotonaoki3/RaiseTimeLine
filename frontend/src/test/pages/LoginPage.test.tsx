import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import LoginPage from '../../pages/LoginPage'
import { AuthContext } from '../../context/auth-context'
import type { AuthContextType } from '../../context/auth-context'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockLogin = vi.fn()

const renderLoginPage = () => {
  const contextValue: AuthContextType = {
    user: null,
    login: mockLogin,
    logout: vi.fn().mockResolvedValue(undefined),
    updateDisplayName: vi.fn(),
    updateAvatarUrl: vi.fn(),
  }
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={contextValue}>
        <LoginPage />
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  // --- 同値分割：フォーム送信 ---

  it('有効クラス（正常入力）→ API が呼ばれてログイン処理が実行される', async () => {
    renderLoginPage()
    fireEvent.change(screen.getByLabelText('メールアドレス'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByLabelText('パスワード'), {
      target: { value: 'Pass1234' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'ログイン' }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test-access-token', expect.objectContaining({
        email: 'test@example.com',
      }))
    })
  })

  it('無効クラス（API が 401）→ エラーメッセージが表示される', async () => {
    server.use(
      http.post('/api/auth/login', () =>
        HttpResponse.json(
          { message: 'メールアドレスまたはパスワードが正しくありません' },
          { status: 401 },
        ),
      ),
    )
    renderLoginPage()
    fireEvent.change(screen.getByLabelText('メールアドレス'), {
      target: { value: 'wrong@example.com' },
    })
    fireEvent.change(screen.getByLabelText('パスワード'), {
      target: { value: 'wrongpass' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'ログイン' }))

    await waitFor(() => {
      expect(screen.getByText(/メールアドレスまたはパスワードが正しくありません/)).toBeInTheDocument()
    })
  })
})
