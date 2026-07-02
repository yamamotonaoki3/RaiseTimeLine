import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import FollowListPage from '../../pages/FollowListPage'
import { AuthContext } from '../../context/auth-context'
import type { AuthContextType } from '../../context/auth-context'

vi.mock('../../api/users', () => ({
  getUserProfile: vi.fn().mockResolvedValue({
    id: 1,
    displayName: '対象ユーザー',
    avatarUrl: null,
    bio: null,
    followerCount: 3,
    followingCount: 5,
    postCount: 0,
    followedByMe: false,
  }),
  getFollowers: vi.fn(),
  getFollowing: vi.fn(),
}))

import { getFollowers, getFollowing } from '../../api/users'

const contextValue: AuthContextType = {
  user: { userId: 99, displayName: '自分', email: 'me@example.com', avatarUrl: null },
  login: vi.fn(),
  logout: vi.fn().mockResolvedValue(undefined),
  updateDisplayName: vi.fn(),
  updateAvatarUrl: vi.fn(),
}

const renderFollowListPage = (mode: 'followers' | 'following') =>
  render(
    <MemoryRouter initialEntries={[`/users/1/${mode}`]}>
      <AuthContext.Provider value={contextValue}>
        <Routes>
          <Route path={`/users/:id/${mode}`} element={<FollowListPage mode={mode} />} />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>,
  )

describe('FollowListPage', () => {
  // --- 同値分割：一覧の有無 ---

  it('フォロワーが0件（境界値）→ 「まだいません」が表示される', async () => {
    vi.mocked(getFollowers).mockResolvedValue([])

    renderFollowListPage('followers')

    await waitFor(() => {
      expect(screen.getByText('まだいません。')).toBeInTheDocument()
    })
  })

  it('フォロワーがいる → 一覧に表示される', async () => {
    vi.mocked(getFollowers).mockResolvedValue([
      { id: 5, displayName: 'フォロワー太郎', avatarUrl: null, bio: null, followedByMe: false },
    ])

    renderFollowListPage('followers')

    await waitFor(() => {
      expect(screen.getByText('フォロワー太郎')).toBeInTheDocument()
    })
  })

  it('mode=following → フォロー中一覧の API が呼ばれる', async () => {
    vi.mocked(getFollowing).mockResolvedValue([])

    renderFollowListPage('following')

    await waitFor(() => {
      expect(getFollowing).toHaveBeenCalledWith(1)
    })
  })
})
