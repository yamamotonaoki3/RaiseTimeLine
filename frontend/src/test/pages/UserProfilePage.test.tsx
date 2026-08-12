import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import UserProfilePage from '../../pages/UserProfilePage'
import { AuthContext } from '../../context/auth-context'
import type { AuthContextType } from '../../context/auth-context'

vi.mock('../../api/posts', () => ({
  updatePost: vi.fn(),
  deletePost: vi.fn(),
}))

vi.mock('../../api/users', () => ({
  getUserProfile: vi.fn(),
  getUserPosts: vi.fn().mockResolvedValue([]),
  followUser: vi.fn().mockResolvedValue(undefined),
  unfollowUser: vi.fn().mockResolvedValue(undefined),
  updateUserProfile: vi.fn(),
}))

import { getUserProfile, followUser } from '../../api/users'

const meContext: AuthContextType = {
  user: { userId: 1, displayName: '自分', email: 'me@example.com', avatarUrl: null },
  login: vi.fn(),
  logout: vi.fn().mockResolvedValue(undefined),
  updateDisplayName: vi.fn(),
  updateAvatarUrl: vi.fn(),
}

const renderUserProfilePage = (userId: string, contextValue: AuthContextType = meContext) =>
  render(
    <MemoryRouter initialEntries={[`/users/${userId}`]}>
      <AuthContext.Provider value={contextValue}>
        <Routes>
          <Route path="/users/:id" element={<UserProfilePage />} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>,
  )

const otherProfile = {
  id: 2,
  displayName: '他人',
  avatarUrl: null,
  bio: null,
  followerCount: 0,
  followingCount: 0,
  postCount: 0,
  followedByMe: false,
}

describe('UserProfilePage', () => {
  // --- 同値分割：自分/他人のプロフィール ---

  it('自分のプロフィール（有効クラス）→ 編集ボタンが表示される', async () => {
    vi.mocked(getUserProfile).mockResolvedValue({ ...otherProfile, id: 1, displayName: '自分' })

    renderUserProfilePage('1')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '✏️ プロフィールを編集' })).toBeInTheDocument()
    })
  })

  it('他人のプロフィール（未フォロー）→ フォローボタンが表示される', async () => {
    vi.mocked(getUserProfile).mockResolvedValue(otherProfile)

    renderUserProfilePage('2')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'フォロー' })).toBeInTheDocument()
    })
  })

  it('フォローボタン押下 → followUser が呼ばれ「フォロー中」に変わる', async () => {
    vi.mocked(getUserProfile).mockResolvedValue(otherProfile)

    renderUserProfilePage('2')
    await waitFor(() => screen.getByRole('button', { name: 'フォロー' }))

    fireEvent.click(screen.getByRole('button', { name: 'フォロー' }))

    await waitFor(() => {
      expect(followUser).toHaveBeenCalledWith(2)
      expect(screen.getByRole('button', { name: 'フォロー中' })).toBeInTheDocument()
    })
  })

  it('ユーザーが存在しない（無効クラス）→ 「ユーザーが見つかりません」が表示される', async () => {
    vi.mocked(getUserProfile).mockRejectedValue({
      isAxiosError: true,
      response: { status: 404 },
    })

    renderUserProfilePage('999')

    await waitFor(() => {
      expect(screen.getByText('ユーザーが見つかりません。')).toBeInTheDocument()
    })
  })
})
