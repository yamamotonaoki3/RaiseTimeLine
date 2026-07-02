import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import NavBar from '../../components/NavBar'
import { AuthContext } from '../../context/auth-context'
import type { AuthContextType } from '../../context/auth-context'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const renderNavBar = (contextValue: AuthContextType) =>
  render(
    <MemoryRouter>
      <AuthContext.Provider value={contextValue}>
        <NavBar />
      </AuthContext.Provider>
    </MemoryRouter>,
  )

describe('NavBar', () => {
  // --- 同値分割：未ログイン/ログイン済み ---

  it('未ログイン（user=null）→ 検索リンク・ユーザー情報が表示されない', () => {
    renderNavBar({
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
      updateDisplayName: vi.fn(),
      updateAvatarUrl: vi.fn(),
    })

    expect(screen.queryByText('🔍 検索')).not.toBeInTheDocument()
  })

  it('ログイン済み → 表示名・検索リンクが表示される', () => {
    renderNavBar({
      user: { userId: 1, displayName: '太郎', email: 't@example.com', avatarUrl: null },
      login: vi.fn(),
      logout: vi.fn(),
      updateDisplayName: vi.fn(),
      updateAvatarUrl: vi.fn(),
    })

    expect(screen.getByText('🔍 検索')).toBeInTheDocument()
    expect(screen.getByText('太郎')).toBeInTheDocument()
  })

  // --- 状態遷移テスト ---

  it('ログアウトボタン押下 → logout が呼ばれてログイン画面に遷移する', async () => {
    const logout = vi.fn().mockResolvedValue(undefined)
    renderNavBar({
      user: { userId: 1, displayName: '太郎', email: 't@example.com', avatarUrl: null },
      login: vi.fn(),
      logout,
      updateDisplayName: vi.fn(),
      updateAvatarUrl: vi.fn(),
    })

    fireEvent.click(screen.getByRole('button', { name: 'ログアウト' }))

    await waitFor(() => {
      expect(logout).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })
})
