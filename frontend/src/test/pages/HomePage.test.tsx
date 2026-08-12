import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HomePage from '../../pages/HomePage'
import { AuthContext } from '../../context/auth-context'
import type { AuthContextType } from '../../context/auth-context'

vi.mock('../../api/posts', () => ({
  getPosts: vi.fn().mockResolvedValue([]),
  getNewCount: vi.fn().mockResolvedValue(0),
  getNewerPosts: vi.fn().mockResolvedValue([]),
  createPost: vi.fn(),
  updatePost: vi.fn(),
  deletePost: vi.fn(),
}))

vi.mock('../../api/users', () => ({
  getUserProfile: vi.fn().mockResolvedValue({
    id: 1,
    displayName: '自分',
    avatarUrl: null,
    bio: null,
    followerCount: 0,
    followingCount: 0,
    postCount: 0,
    followedByMe: false,
  }),
  updateUserProfile: vi.fn(),
}))

import { getPosts, createPost } from '../../api/posts'

class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)

const contextValue: AuthContextType = {
  user: { userId: 1, displayName: '自分', email: 'me@example.com', avatarUrl: null },
  login: vi.fn(),
  logout: vi.fn().mockResolvedValue(undefined),
  updateDisplayName: vi.fn(),
  updateAvatarUrl: vi.fn(),
}

const renderHomePage = () =>
  render(
    <MemoryRouter>
      <AuthContext.Provider value={contextValue}>
        <HomePage />
      </AuthContext.Provider>
    </MemoryRouter>,
  )

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
  vi.mocked(getPosts).mockResolvedValue([])
})

describe('HomePage', () => {
  // --- 同値分割：投稿の有無 ---

  it('投稿が0件（境界値）→ 空メッセージが表示される', async () => {
    renderHomePage()
    await waitFor(() => {
      expect(
        screen.getByText('フォロー中のユーザーの投稿がありません。誰かをフォローしてみましょう！'),
      ).toBeInTheDocument()
    })
  })

  it('投稿がある → 一覧に表示される', async () => {
    vi.mocked(getPosts).mockResolvedValue([
      {
        id: 1,
        userId: 2,
        displayName: '投稿者',
        avatarUrl: null,
        content: 'テスト投稿',
        imageUrl: null,
        createdAt: '2026-01-01T00:00:00',
        updatedAt: '2026-01-01T00:00:00',
        likeCount: 0,
        likedByMe: false,
        commentCount: 0,
      },
    ])
    renderHomePage()
    await waitFor(() => {
      expect(screen.getByText('テスト投稿')).toBeInTheDocument()
    })
  })

  // --- 状態遷移テスト ---

  it('タブ切り替え（全体）→ フィードが切り替わり空メッセージも切り替わる', async () => {
    renderHomePage()
    await waitFor(() =>
      expect(
        screen.getByText('フォロー中のユーザーの投稿がありません。誰かをフォローしてみましょう！'),
      ).toBeInTheDocument(),
    )

    fireEvent.click(screen.getByRole('button', { name: '全体' }))

    await waitFor(() => {
      expect(screen.getByText('まだ投稿がありません。最初の投稿をしてみましょう！')).toBeInTheDocument()
    })
  })

  it('投稿するボタン押下 → 投稿作成モーダルが開く', async () => {
    renderHomePage()
    await waitFor(() => expect(getPosts).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: '✏️ 投稿する' }))

    expect(screen.getByText('投稿を作成')).toBeInTheDocument()
  })

  it('投稿作成 → createPost が呼ばれ一覧の先頭に追加される（全体タブ）', async () => {
    vi.mocked(createPost).mockResolvedValue({
      id: 99,
      userId: 1,
      displayName: '自分',
      avatarUrl: null,
      content: '新規投稿',
      imageUrl: null,
      createdAt: '2026-01-01T00:00:00',
      updatedAt: '2026-01-01T00:00:00',
      likeCount: 0,
      likedByMe: false,
      commentCount: 0,
    })
    renderHomePage()
    await waitFor(() => expect(getPosts).toHaveBeenCalled())
    fireEvent.click(screen.getByRole('button', { name: '全体' }))
    await waitFor(() => expect(screen.getByRole('button', { name: '全体' })).toHaveClass('active'))

    fireEvent.click(screen.getByRole('button', { name: '✏️ 投稿する' }))
    fireEvent.change(screen.getByPlaceholderText('いまどうしてる？'), {
      target: { value: '新規投稿' },
    })
    fireEvent.click(screen.getByRole('button', { name: '投稿する' }))

    await waitFor(() => {
      expect(screen.getByText('新規投稿')).toBeInTheDocument()
    })
  })

  // --- フィード切替時の競合（#69） ---

  it('フォロー中の読み込み中に全体へ切り替えても、遅れて届いたフォロー中の応答で上書きされない', async () => {
    let resolveFollowing!: (posts: Awaited<ReturnType<typeof getPosts>>) => void
    const followingPromise = new Promise<Awaited<ReturnType<typeof getPosts>>>((resolve) => {
      resolveFollowing = resolve
    })

    const followingOnlyPost = {
      id: 1,
      userId: 2,
      displayName: 'フォロー中の相手',
      avatarUrl: null,
      content: 'フォロー中限定の投稿',
      imageUrl: null,
      createdAt: '2026-01-01T00:00:00',
      updatedAt: '2026-01-01T00:00:00',
      likeCount: 0,
      likedByMe: false,
      commentCount: 0,
    }
    const allFeedPost = {
      id: 2,
      userId: 3,
      displayName: '全体の相手',
      avatarUrl: null,
      content: '全体投稿',
      imageUrl: null,
      createdAt: '2026-01-01T00:00:00',
      updatedAt: '2026-01-01T00:00:00',
      likeCount: 0,
      likedByMe: false,
      commentCount: 0,
    }

    vi.mocked(getPosts).mockImplementation((params) => {
      if (params?.feed === 'following') return followingPromise
      return Promise.resolve([allFeedPost])
    })

    renderHomePage()

    // 初回（フォロー中）の応答が返る前に「全体」へ切り替える
    fireEvent.click(screen.getByRole('button', { name: '全体' }))
    await waitFor(() => {
      expect(screen.getByText('全体投稿')).toBeInTheDocument()
    })

    // 遅れてフォロー中の応答が届く
    resolveFollowing(followingOnlyPost ? [followingOnlyPost] : [])

    // 「全体」タブの表示が、遅れて届いたフォロー中のデータで上書きされていないこと
    await waitFor(() => {
      expect(screen.queryByText('フォロー中限定の投稿')).not.toBeInTheDocument()
      expect(screen.getByText('全体投稿')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '全体' })).toHaveClass('active')
    })
  })

  // --- 取得失敗時のエラー表示・再試行（#89） ---

  it('投稿取得に失敗 → エラーメッセージが表示され、空メッセージは出ない', async () => {
    vi.mocked(getPosts).mockRejectedValueOnce(new Error('network error'))
    renderHomePage()

    await waitFor(() => {
      expect(screen.getByText('投稿の取得に失敗しました。')).toBeInTheDocument()
      expect(
        screen.queryByText('フォロー中のユーザーの投稿がありません。誰かをフォローしてみましょう！'),
      ).not.toBeInTheDocument()
    })
  })

  it('取得失敗後に再試行 → 成功すればエラーが消え投稿が表示される', async () => {
    vi.mocked(getPosts).mockRejectedValueOnce(new Error('network error'))
    vi.mocked(getPosts).mockResolvedValueOnce([
      {
        id: 1,
        userId: 2,
        displayName: '投稿者',
        avatarUrl: null,
        content: '再試行後の投稿',
        imageUrl: null,
        createdAt: '2026-01-01T00:00:00',
        updatedAt: '2026-01-01T00:00:00',
        likeCount: 0,
        likedByMe: false,
        commentCount: 0,
      },
    ])
    renderHomePage()
    await waitFor(() => expect(screen.getByText('投稿の取得に失敗しました。')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: '再試行' }))

    await waitFor(() => {
      expect(screen.queryByText('投稿の取得に失敗しました。')).not.toBeInTheDocument()
      expect(screen.getByText('再試行後の投稿')).toBeInTheDocument()
    })
  })
})
