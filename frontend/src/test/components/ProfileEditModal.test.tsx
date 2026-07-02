import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ProfileEditModal from '../../components/ProfileEditModal'
import type { UserProfile } from '../../api/users'

const profile: UserProfile = {
  id: 1,
  displayName: '太郎',
  avatarUrl: null,
  bio: '自己紹介文',
  followerCount: 0,
  followingCount: 0,
  postCount: 0,
  followedByMe: false,
}

describe('ProfileEditModal', () => {
  // --- 初期状態 ---

  it('初期表示で表示名・自己紹介が入力欄にセットされる', () => {
    render(<ProfileEditModal profile={profile} onSave={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByDisplayValue('太郎')).toBeInTheDocument()
    expect(screen.getByDisplayValue('自己紹介文')).toBeInTheDocument()
  })

  // --- 状態遷移テスト ---

  it('キャンセルボタン押下 → onClose が呼ばれる', () => {
    const onClose = vi.fn()
    render(<ProfileEditModal profile={profile} onSave={vi.fn()} onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }))

    expect(onClose).toHaveBeenCalled()
  })

  it('表示名を空にする（無効クラス）→ 保存するボタンが無効化される', () => {
    render(<ProfileEditModal profile={profile} onSave={vi.fn()} onClose={vi.fn()} />)
    fireEvent.change(screen.getByDisplayValue('太郎'), { target: { value: '' } })

    expect(screen.getByRole('button', { name: '保存する' })).toBeDisabled()
  })

  it('表示名・自己紹介を変更して保存 → onSave が呼ばれる', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<ProfileEditModal profile={profile} onSave={onSave} onClose={vi.fn()} />)

    fireEvent.change(screen.getByDisplayValue('太郎'), { target: { value: '次郎' } })
    fireEvent.click(screen.getByRole('button', { name: '保存する' }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('次郎', '自己紹介文', undefined)
    })
  })

  it('保存失敗（無効クラス）→ エラーメッセージが表示される', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('failed'))
    render(<ProfileEditModal profile={profile} onSave={onSave} onClose={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: '保存する' }))

    await waitFor(() => {
      expect(screen.getByText('保存に失敗しました')).toBeInTheDocument()
    })
  })
})
