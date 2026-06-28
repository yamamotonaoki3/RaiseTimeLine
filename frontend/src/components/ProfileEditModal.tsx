import { useRef, useState } from 'react'
import type { UserProfile } from '../api/users'

interface Props {
  profile: UserProfile
  onSave: (displayName: string, bio: string, avatar?: File) => Promise<void>
  onClose: () => void
}

const MAX_BIO = 160
const MAX_NAME = 50

export default function ProfileEditModal({ profile, onSave, onClose }: Props) {
  const [displayName, setDisplayName] = useState(profile.displayName)
  const [bio, setBio] = useState(profile.bio ?? '')
  const [avatarFile, setAvatarFile] = useState<File | undefined>(undefined)
  const [previewUrl, setPreviewUrl] = useState<string | null>(profile.avatarUrl)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('画像は5MB以内でアップロードしてください')
      return
    }
    setAvatarFile(file)
    setError(null)
    const reader = new FileReader()
    reader.onload = () => setPreviewUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!displayName.trim() || saving) return
    setSaving(true)
    setError(null)
    try {
      await onSave(displayName.trim(), bio, avatarFile)
    } catch {
      setError('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const initial = profile.displayName.charAt(0).toUpperCase()

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <div className="modal-header">
          <h2 className="modal-title">プロフィールを編集</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="avatar-edit-row">
            <div className="profile-avatar avatar-lg">
              {previewUrl ? (
                <img src={previewUrl} alt="アバター" />
              ) : (
                initial
              )}
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => fileInputRef.current?.click()}
            >
              画像を変更
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>

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
