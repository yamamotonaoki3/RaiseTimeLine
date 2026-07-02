import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import RegisterPage from '../../pages/RegisterPage'
import { AuthContext } from '../../context/auth-context'
import type { AuthContextType } from '../../context/auth-context'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockLogin = vi.fn()

beforeEach(() => {
  mockLogin.mockClear()
})

const renderRegisterPage = () => {
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
        <RegisterPage />
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

const fillValidForm = () => {
  fireEvent.change(screen.getByLabelText('メールアドレス'), { target: { value: 'new@example.com' } })
  fireEvent.change(screen.getByLabelText('ユーザー名'), { target: { value: 'newuser' } })
  fireEvent.change(screen.getByLabelText('表示名'), { target: { value: '新規太郎' } })
  fireEvent.change(screen.getByLabelText('パスワード'), { target: { value: 'Pass1234' } })
  fireEvent.change(screen.getByLabelText('パスワード確認'), { target: { value: 'Pass1234' } })
}

describe('RegisterPage', () => {
  // --- 同値分割：フォーム送信 ---

  it('有効クラス（正常入力）→ 登録処理が実行され login が呼ばれる', async () => {
    renderRegisterPage()
    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: '登録する' }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        'test-access-token',
        expect.objectContaining({ email: 'test@example.com' }),
      )
    })
  })

  it('パスワード不一致（無効クラス）→ エラーメッセージが表示され API は呼ばれない', async () => {
    renderRegisterPage()
    fillValidForm()
    fireEvent.change(screen.getByLabelText('パスワード確認'), { target: { value: 'Different1' } })
    fireEvent.click(screen.getByRole('button', { name: '登録する' }))

    await waitFor(() => {
      expect(screen.getByText('パスワードが一致しません')).toBeInTheDocument()
    })
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('無効クラス（API がフィールドエラーを返す）→ フィールドごとのエラーが表示される', async () => {
    server.use(
      http.post('/api/auth/register', () =>
        HttpResponse.json(
          { errors: [{ field: 'email', message: 'このメールアドレスは既に使用されています' }] },
          { status: 400 },
        ),
      ),
    )
    renderRegisterPage()
    fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: '登録する' }))

    await waitFor(() => {
      expect(screen.getByText('このメールアドレスは既に使用されています')).toBeInTheDocument()
    })
  })
})
