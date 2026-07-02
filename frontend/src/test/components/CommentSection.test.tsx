import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CommentSection from '../../components/CommentSection'

vi.mock('../../api/comments', () => ({
  getComments: vi.fn().mockResolvedValue([
    { id: 1, postId: 1, userId: 1, displayName: '自分', content: '自分のコメント', createdAt: '', updatedAt: '' },
    { id: 2, postId: 1, userId: 2, displayName: '他人', content: '他人のコメント', createdAt: '', updatedAt: '' },
  ]),
  createComment: vi.fn(),
  deleteComment: vi.fn().mockResolvedValue(undefined),
}))

import { createComment, deleteComment } from '../../api/comments'

describe('CommentSection', () => {
  // --- 初期表示 ---

  it('マウント時にコメント一覧を取得して表示する', async () => {
    render(<CommentSection postId={1} currentUserId={1} />)

    await waitFor(() => {
      expect(screen.getByText('自分のコメント')).toBeInTheDocument()
      expect(screen.getByText('他人のコメント')).toBeInTheDocument()
    })
  })

  // --- 同値分割：削除ボタンの表示 ---

  it('自分のコメントには削除ボタンが表示される', async () => {
    render(<CommentSection postId={1} currentUserId={1} />)

    await waitFor(() => {
      expect(screen.getAllByLabelText('コメントを削除')).toHaveLength(1)
    })
  })

  // --- 状態遷移テスト ---

  it('コメント送信 → createComment が呼ばれ、一覧に追加される', async () => {
    const newComment = { id: 3, postId: 1, userId: 1, displayName: '自分', content: '新規コメント', createdAt: '', updatedAt: '' }
    vi.mocked(createComment).mockResolvedValueOnce(newComment)
    const onCommentAdded = vi.fn()
    render(<CommentSection postId={1} currentUserId={1} onCommentAdded={onCommentAdded} />)
    await waitFor(() => expect(screen.getByText('自分のコメント')).toBeInTheDocument())

    fireEvent.change(screen.getByPlaceholderText('コメントを入力...'), {
      target: { value: '新規コメント' },
    })
    fireEvent.click(screen.getByRole('button', { name: '送信' }))

    await waitFor(() => {
      expect(screen.getByText('新規コメント')).toBeInTheDocument()
      expect(onCommentAdded).toHaveBeenCalled()
    })
  })

  it('削除ボタン押下 → deleteComment が呼ばれ、一覧から消える', async () => {
    render(<CommentSection postId={1} currentUserId={1} />)
    await waitFor(() => expect(screen.getByText('自分のコメント')).toBeInTheDocument())

    fireEvent.click(screen.getByLabelText('コメントを削除'))

    await waitFor(() => {
      expect(deleteComment).toHaveBeenCalledWith(1, 1)
      expect(screen.queryByText('自分のコメント')).not.toBeInTheDocument()
    })
  })

  it('空文字（無効クラス）→ 送信ボタンが無効化される', async () => {
    render(<CommentSection postId={1} currentUserId={1} />)
    await waitFor(() => expect(screen.getByText('自分のコメント')).toBeInTheDocument())

    expect(screen.getByRole('button', { name: '送信' })).toBeDisabled()
  })
})
