import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import SearchPage from '../../pages/SearchPage'
import { AuthContext } from '../../context/auth-context'
import type { AuthContextType } from '../../context/auth-context'

const renderSearchPage = () => {
  const contextValue: AuthContextType = {
    user: { userId: 1, displayName: '自分', email: 'me@example.com', avatarUrl: null },
    login: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined),
    updateDisplayName: vi.fn(),
    updateAvatarUrl: vi.fn(),
  }
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={contextValue}>
        <SearchPage />
      </AuthContext.Provider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('SearchPage', () => {
  // --- 同値分割・境界値：検索トリガー ---

  it('空欄（境界値：最小-1）→ API 呼び出しなし・アイドル状態', async () => {
    let apiCalled = false
    server.use(
      http.get('/api/users/search', () => {
        apiCalled = true
        return HttpResponse.json([])
      }),
    )
    renderSearchPage()
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '' } })
    await act(async () => {
      vi.advanceTimersByTime(400)
      await Promise.resolve()
    })
    expect(apiCalled).toBe(false)
    expect(screen.getByText(/表示名または読み仮名で検索/)).toBeInTheDocument()
  })

  it('1 文字入力（境界値：最小）→ 300ms 後に API が呼ばれる', async () => {
    let apiCalled = false
    server.use(
      http.get('/api/users/search', () => {
        apiCalled = true
        return HttpResponse.json([])
      }),
    )
    renderSearchPage()
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'テ' } })
    await act(async () => {
      vi.advanceTimersByTime(300)
      await Promise.resolve()
    })
    await waitFor(() => expect(apiCalled).toBe(true), { timeout: 2000 })
  })

  it('結果あり → ユーザーカードが表示される', async () => {
    renderSearchPage()
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'テスト' } })
    await act(async () => {
      vi.advanceTimersByTime(300)
      await Promise.resolve()
    })
    await waitFor(() => {
      expect(screen.getByText('検索結果ユーザー')).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('結果なし → 「見つかりませんでした」が表示される', async () => {
    server.use(http.get('/api/users/search', () => HttpResponse.json([])))
    renderSearchPage()
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'zzzzz' } })
    await act(async () => {
      vi.advanceTimersByTime(300)
      await Promise.resolve()
    })
    await waitFor(() => {
      expect(screen.getByText(/ユーザーが見つかりませんでした/)).toBeInTheDocument()
    }, { timeout: 2000 })
  })
})
