import { useState } from 'react'
import type { UserProfile } from '../api/users'

interface Props {
  profile: UserProfile
  onSave: (displayName: string, bio: string) => Promise<void>
  onClose: () => void
}

const MAX_BIO = 160
const MAX_NAME = 50

export default function ProfileEditModal({ profile, onSave, onClose }: Props) {
  const [displayName, setDisplayName] = useState(profile.displayName)
  const [bio, setBio] = useState(profile.bio ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!displayName.trim() || saving) return
    setSaving(true)
    setError(null)
    try {
      await onSave(displayName.trim(), bio)
    } catch {
      setError('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <div className="modal-header">
          <h2 className="modal-title">プロフィールを編集</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <label className="form-label">表示名</label>
          <input
            className="form-input"
            type="text"
            maxLength={MAX_NAME}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <p className="char-count">{displayName.length}/{MAX_NAME}</p>

          <label className="form-label">自己紹介</label>
          <textarea
            className="post-textarea"
            rows={3}
            maxLength={MAX_BIO}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
          <p className={`char-count${bio.length > MAX_BIO - 20 ? ' char-count--warn' : ''}`}>
            {bio.length}/{MAX_BIO}
          </p>

          {error && <p className="error-msg">{error}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>キャンセル</button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || !displayName.trim()}
          >
            {saving ? '保存中...' : '保存する'}
          </button>
        </div>
      </div>
    </div>
  )
}
