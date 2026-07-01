import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import UserCard from '../../components/UserCard'
import type { UserSummary } from '../../api/users'

vi.mock('../../api/users', () => ({
  followUser: vi.fn().mockResolvedValue(undefined),
  unfollowUser: vi.fn().mockResolvedValue(undefined),
}))

import { followUser, unfollowUser } from '../../api/users'

const renderUserCard = (user: UserSummary, currentUserId: number) => {
  return render(
    <MemoryRouter>
      <UserCard user={user} currentUserId={currentUserId} />
    </MemoryRouter>,
  )
}

const makeUser = (overrides: Partial<UserSummary> = {}): UserSummary => ({
  id: 2,
  displayName: 'テストユーザー',
  avatarUrl: null,
  bio: null,
  followedByMe: false,
  ...overrides,
})

describe('UserCard', () => {
  // --- デシジョンテーブル：フォローボタン表示 ---

  it('自分自身の場合 → フォローボタン非表示', () => {
    renderUserCard(makeUser({ id: 1 }), 1)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('他ユーザー・未フォロー → 「フォロー」ボタンが表示される', () => {
    renderUserCard(makeUser({ followedByMe: false }), 1)
    expect(screen.getByRole('button')).toHaveTextContent('フォロー')
    expect(screen.getByRole('button')).not.toHaveTextContent('フォロー中')
  })

  it('他ユーザー・フォロー済み → 「フォロー中」ボタンが表示される', () => {
    renderUserCard(makeUser({ followedByMe: true }), 1)
    expect(screen.getByRole('button')).toHaveTextContent('フォロー中')
  })

  // --- フォロー操作の状態遷移 ---

  it('「フォロー」ボタンクリック → followUser が呼ばれ「フォロー中」になる', async () => {
    renderUserCard(makeUser({ followedByMe: false }), 1)
    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => expect(screen.getByRole('button')).toHaveTextContent('フォロー中'))
    expect(followUser).toHaveBeenCalledWith(2)
  })

  it('「フォロー中」ボタンクリック → unfollowUser が呼ばれ「フォロー」になる', async () => {
    renderUserCard(makeUser({ followedByMe: true }), 1)
    fireEvent.click(screen.getByRole('button'))
    await waitFor(() => expect(screen.getByRole('button')).toHaveTextContent('フォロー'))
    expect(unfollowUser).toHaveBeenCalledWith(2)
  })
})
