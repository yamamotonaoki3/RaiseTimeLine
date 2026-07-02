import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DeleteModal from '../../components/DeleteModal'

describe('DeleteModal', () => {
  // --- 状態遷移テスト ---

  it('キャンセルボタン押下 → onClose が呼ばれる', () => {
    const onClose = vi.fn()
    render(<DeleteModal onConfirm={vi.fn()} onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }))

    expect(onClose).toHaveBeenCalled()
  })

  it('削除するボタン押下 → onConfirm が呼ばれ、完了後にボタンが再度有効になる', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined)
    render(<DeleteModal onConfirm={onConfirm} onClose={vi.fn()} />)

    const btn = screen.getByRole('button', { name: '削除する' })
    fireEvent.click(btn)

    expect(onConfirm).toHaveBeenCalled()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '削除する' })).not.toBeDisabled()
    })
  })

  it('削除中（loading）はボタンが無効化される（二重送信防止）', async () => {
    let resolveConfirm: () => void = () => {}
    const onConfirm = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveConfirm = resolve
        }),
    )
    render(<DeleteModal onConfirm={onConfirm} onClose={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: '削除する' }))
    expect(screen.getByRole('button', { name: '削除中...' })).toBeDisabled()

    resolveConfirm()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '削除する' })).not.toBeDisabled()
    })
  })

  it('モーダル外側（オーバーレイ）クリック → onClose が呼ばれる', () => {
    const onClose = vi.fn()
    const { container } = render(<DeleteModal onConfirm={vi.fn()} onClose={onClose} />)

    fireEvent.click(container.querySelector('.modal-overlay')!)

    expect(onClose).toHaveBeenCalled()
  })
})
