import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CreatePostModal from '../../components/CreatePostModal'

describe('CreatePostModal', () => {
  // --- 状態遷移テスト ---

  it('キャンセルボタン押下 → onClose が呼ばれる', () => {
    const onClose = vi.fn()
    render(<CreatePostModal onSubmit={vi.fn()} onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }))

    expect(onClose).toHaveBeenCalled()
  })

  it('空文字（無効クラス）→ 投稿するボタンが無効化される', () => {
    render(<CreatePostModal onSubmit={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByRole('button', { name: '投稿する' })).toBeDisabled()
  })

  it('有効な内容を投稿 → onSubmit が呼ばれ、成功後に onClose が呼ばれる', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const onClose = vi.fn()
    render(<CreatePostModal onSubmit={onSubmit} onClose={onClose} />)

    fireEvent.change(screen.getByPlaceholderText('いまどうしてる？'), {
      target: { value: '投稿内容' },
    })
    fireEvent.click(screen.getByRole('button', { name: '投稿する' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith('投稿内容', undefined)
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('投稿失敗（無効クラス：APIエラー）→ エラーメッセージが表示される', async () => {
    const onSubmit = vi.fn().mockRejectedValue({
      response: { data: { message: '投稿に失敗しました' } },
    })
    render(<CreatePostModal onSubmit={onSubmit} onClose={vi.fn()} />)

    fireEvent.change(screen.getByPlaceholderText('いまどうしてる？'), {
      target: { value: '投稿内容' },
    })
    fireEvent.click(screen.getByRole('button', { name: '投稿する' }))

    await waitFor(() => {
      expect(screen.getByText('投稿に失敗しました')).toBeInTheDocument()
    })
  })

  it('許可されない画像形式（無効クラス）→ エラーメッセージが表示される', () => {
    render(<CreatePostModal onSubmit={vi.fn()} onClose={vi.fn()} />)
    const file = new File(['dummy'], 'test.txt', { type: 'text/plain' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    fireEvent.change(input, { target: { files: [file] } })

    expect(
      screen.getByText('画像はJPEG・PNG・GIF形式、5MB以内でアップロードしてください'),
    ).toBeInTheDocument()
  })

  it('モーダル外側（オーバーレイ）クリック → onClose が呼ばれる', () => {
    const onClose = vi.fn()
    const { container } = render(<CreatePostModal onSubmit={vi.fn()} onClose={onClose} />)

    fireEvent.click(container.querySelector('.modal-overlay')!)

    expect(onClose).toHaveBeenCalled()
  })
})
