import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PostForm from '../../components/PostForm'

describe('PostForm', () => {
  // --- 同値分割・境界値 ---

  it('空文字（無効クラス）→ 送信ボタンが無効化される', () => {
    render(<PostForm onSubmit={vi.fn()} />)
    expect(screen.getByRole('button', { name: '投稿する' })).toBeDisabled()
  })

  it('有効な文字列（有効クラス）→ 送信ボタンが有効になる', () => {
    render(<PostForm onSubmit={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText('いまどうしてる？'), {
      target: { value: '投稿テスト' },
    })
    expect(screen.getByRole('button', { name: '投稿する' })).not.toBeDisabled()
  })

  it('280文字ちょうど（境界値：最大）→ 送信できる', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<PostForm onSubmit={onSubmit} />)
    const content = 'あ'.repeat(280)
    fireEvent.change(screen.getByPlaceholderText('いまどうしてる？'), {
      target: { value: content },
    })
    fireEvent.click(screen.getByRole('button', { name: '投稿する' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(content))
  })

  // --- 状態遷移テスト ---

  it('送信成功後、入力欄がクリアされる', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<PostForm onSubmit={onSubmit} />)
    const textarea = screen.getByPlaceholderText('いまどうしてる？') as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: '投稿内容' } })
    fireEvent.click(screen.getByRole('button', { name: '投稿する' }))

    await waitFor(() => expect(textarea.value).toBe(''))
  })

  it('送信中はボタンが無効化される（二重送信防止）', async () => {
    let resolveSubmit: () => void = () => {}
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve
        }),
    )
    render(<PostForm onSubmit={onSubmit} />)
    fireEvent.change(screen.getByPlaceholderText('いまどうしてる？'), {
      target: { value: '投稿内容' },
    })
    fireEvent.click(screen.getByRole('button', { name: '投稿する' }))

    expect(screen.getByRole('button', { name: '投稿中...' })).toBeDisabled()

    resolveSubmit()
    await waitFor(() => expect(screen.getByRole('button', { name: '投稿する' })).toBeDisabled())
  })
})
