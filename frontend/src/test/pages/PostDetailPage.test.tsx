import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PostDetailPage from '../../pages/PostDetailPage'
import { AuthContext } from '../../context/auth-context'
import type { AuthContextType } from '../../context/auth-context'

vi.mock('../../api/posts', () => ({
  getPostById: vi.fn(),
  updatePost: vi.fn(),
  deletePost: vi.fn(),
}))

vi.mock('../../api/comments', () => ({
  getComments: vi.fn().mockResolvedValue([]),
  createComment: vi.fn(),
  deleteComment: vi.fn(),
}))

import { getPostById } from '../../api/posts'

const contextValue: AuthContextType = {
  user: { userId: 1, displayName: '自分', email: 'me@example.com', avatarUrl: null },
  login: vi.fn(),
  logout: vi.fn().mockResolvedValue(undefined),
  updateDisplayName: vi.fn(),
  updateAvatarUrl: vi.fn(),
}

const renderPostDetailPage = (postId = '1') =>
  render(
    <MemoryRouter initialEntries={[`/posts/${postId}`]}>
      <AuthContext.Provider value={contextValue}>
        <Routes>
          <Route path="/posts/:id" element={<PostDetailPage />} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>,
  )

describe('PostDetailPage', () => {
  // --- 同値分割：取得結果の有無 ---

  it('投稿取得成功（有効クラス）→ 投稿内容とコメント欄が表示される', async () => {
    vi.mocked(getPostById).mockResolvedValue({
      id: 1,
      userId: 2,
      displayName: '投稿者',
      avatarUrl: null,
      content: '詳細ページの投稿',
      imageUrl: null,
      createdAt: '2026-01-01T00:00:00',
      updatedAt: '2026-01-01T00:00:00',
      likeCount: 0,
      likedByMe: false,
      commentCount: 0,
    })

    renderPostDetailPage()

    await waitFor(() => {
      expect(screen.getByText('詳細ページの投稿')).toBeInTheDocument()
      expect(screen.getByText('コメント')).toBeInTheDocument()
    })
  })

  it('投稿が存在しない（無効クラス）→ 「投稿が見つかりません」が表示される', async () => {
    vi.mocked(getPostById).mockRejectedValue({
      isAxiosError: true,
      response: { status: 404 },
    })

    renderPostDetailPage('999')

    await waitFor(() => {
      expect(screen.getByText('投稿が見つかりません。')).toBeInTheDocument()
    })
  })
})
