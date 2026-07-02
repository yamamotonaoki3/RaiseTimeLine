import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import EditPostModal from '../../components/EditPostModal'
import type { Post } from '../../api/posts'

const post: Post = {
  id: 1,
  userId: 1,
  displayName: '投稿者',
  avatarUrl: null,
  content: '元の内容',
  imageUrl: null,
  createdAt: '2026-01-01T00:00:00',
  updatedAt: '2026-01-01T00:00:00',
  likeCount: 0,
  commentCount: 0,
  likedByMe: false,
}

describe('EditPostModal', () => {
  // --- 初期状態 ---

  it('初期表示で投稿内容が入力欄にセットされる', () => {
    render(<EditPostModal post={post} onSave={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByDisplayValue('元の内容')).toBeInTheDocument()
  })

  // --- 状態遷移テスト ---

  it('キャンセルボタン押下 → onClose が呼ばれる', () => {
    const onClose = vi.fn()
    render(<EditPostModal post={post} onSave={vi.fn()} onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }))

    expect(onClose).toHaveBeenCalled()
  })

  it('内容を空にする（無効クラス）→ 保存するボタンが無効化される', () => {
    render(<EditPostModal post={post} onSave={vi.fn()} onClose={vi.fn()} />)
    fireEvent.change(screen.getByDisplayValue('元の内容'), { target: { value: '' } })

    expect(screen.getByRole('button', { name: '保存する' })).toBeDisabled()
  })

  it('内容を変更して保存 → onSave が新しい内容で呼ばれる', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<EditPostModal post={post} onSave={onSave} onClose={vi.fn()} />)

    fireEvent.change(screen.getByDisplayValue('元の内容'), { target: { value: '更新後の内容' } })
    fireEvent.click(screen.getByRole('button', { name: '保存する' }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('更新後の内容', undefined, false)
    })
  })

  it('保存失敗（無効クラス：APIエラー）→ エラーメッセージが表示される', async () => {
    const onSave = vi.fn().mockRejectedValue({
      response: { data: { message: '保存に失敗しました' } },
    })
    render(<EditPostModal post={post} onSave={onSave} onClose={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: '保存する' }))

    await waitFor(() => {
      expect(screen.getByText('保存に失敗しました')).toBeInTheDocument()
    })
  })
})
