import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PostCard from '../../components/PostCard'
import type { Post } from '../../api/posts'

vi.mock('../../api/likes', () => ({
  likePost: vi.fn().mockResolvedValue(undefined),
  unlikePost: vi.fn().mockResolvedValue(undefined),
}))

const makePost = (overrides: Partial<Post> = {}): Post => ({
  id: 1,
  userId: 1,
  displayName: '投稿者',
  avatarUrl: null,
  content: 'テスト投稿内容',
  imageUrl: null,
  createdAt: '2024-01-01T00:00:00',
  updatedAt: '2024-01-01T00:00:00',
  likeCount: 0,
  likedByMe: false,
  commentCount: 0,
  ...overrides,
})

const noop = async () => {}

const renderPostCard = (post: Post, currentUserId: number) => {
  return render(
    <MemoryRouter>
      <PostCard post={post} currentUserId={currentUserId} onUpdate={noop} onDelete={noop} />
    </MemoryRouter>,
  )
}

describe('PostCard', () => {
  // --- デシジョンテーブル：ボタン表示/非表示 ---

  it('投稿者 == 閲覧者 → 編集・削除ボタンが表示される', () => {
    renderPostCard(makePost({ userId: 1 }), 1)
    expect(screen.getByText(/編集/)).toBeInTheDocument()
    expect(screen.getByText(/削除/)).toBeInTheDocument()
  })

  it('投稿者 != 閲覧者 → 編集・削除ボタンが非表示', () => {
    renderPostCard(makePost({ userId: 1 }), 2)
    expect(screen.queryByText(/編集/)).toBeNull()
    expect(screen.queryByText(/削除/)).toBeNull()
  })

  // --- 状態遷移テスト：削除モーダル ---

  it('削除ボタンクリック → 削除確認ダイアログが表示される', () => {
    renderPostCard(makePost({ userId: 1 }), 1)
    fireEvent.click(screen.getByText(/削除/))
    expect(screen.getByText(/この投稿を削除しますか/)).toBeInTheDocument()
  })

  it('削除モーダルの「キャンセル」クリック → モーダルが閉じる', async () => {
    renderPostCard(makePost({ userId: 1 }), 1)
    fireEvent.click(screen.getByText(/削除/))
    expect(screen.getByText(/この投稿を削除しますか/)).toBeInTheDocument()
    fireEvent.click(screen.getByText(/キャンセル/))
    await waitFor(() => expect(screen.queryByText(/本当に削除/)).toBeNull())
  })
})
