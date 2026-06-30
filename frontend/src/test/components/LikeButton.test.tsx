import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LikeButton from '../../components/LikeButton'

vi.mock('../../api/likes', () => ({
  likePost: vi.fn().mockResolvedValue(undefined),
  unlikePost: vi.fn().mockResolvedValue(undefined),
}))

import { likePost, unlikePost } from '../../api/likes'

describe('LikeButton', () => {
  // --- 同値分割：初期状態 ---

  it('初期状態：未いいね（initialLiked=false）→ 通常スタイル・カウント表示', () => {
    render(<LikeButton postId={1} initialCount={5} initialLiked={false} />)
    const btn = screen.getByRole('button')
    expect(btn).not.toHaveClass('liked')
    expect(btn).toHaveTextContent('5')
    expect(btn).toHaveAttribute('aria-label', 'いいねする')
  })

  it('初期状態：いいね済み（initialLiked=true）→ アクティブスタイル', () => {
    render(<LikeButton postId={1} initialCount={5} initialLiked={true} />)
    const btn = screen.getByRole('button')
    expect(btn).toHaveClass('liked')
    expect(btn).toHaveAttribute('aria-label', 'いいねを取り消す')
  })

  // --- 状態遷移テスト ---

  it('クリック（未いいね）→ カウント +1・アクティブスタイルになる', async () => {
    render(<LikeButton postId={1} initialCount={5} initialLiked={false} />)
    const btn = screen.getByRole('button')
    fireEvent.click(btn)
    await waitFor(() => {
      expect(btn).toHaveClass('liked')
      expect(btn).toHaveTextContent('6')
    })
    expect(likePost).toHaveBeenCalledWith(1)
  })

  it('クリック（いいね済み）→ カウント -1・非アクティブになる', async () => {
    render(<LikeButton postId={1} initialCount={5} initialLiked={true} />)
    const btn = screen.getByRole('button')
    fireEvent.click(btn)
    await waitFor(() => {
      expect(btn).not.toHaveClass('liked')
      expect(btn).toHaveTextContent('4')
    })
    expect(unlikePost).toHaveBeenCalledWith(1)
  })

  it('loading 中はボタンが無効化される（二重送信防止）', async () => {
    render(<LikeButton postId={1} initialCount={5} initialLiked={false} />)
    const btn = screen.getByRole('button')
    fireEvent.click(btn)
    expect(btn).toBeDisabled()
    await waitFor(() => expect(btn).not.toBeDisabled())
  })
})
