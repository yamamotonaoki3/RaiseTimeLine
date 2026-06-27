import { useState } from 'react'
import type { Post } from '../api/posts'

interface Props {
  post: Post
  onSave: (content: string) => Promise<void>
  onClose: () => void
}

const MAX_LENGTH = 280

export default function EditPostModal({ post, onSave, onClose }: Props) {
  const [content, setContent] = useState(post.content)
  const [saving, setSaving] = useState(false)
  const remaining = MAX_LENGTH - content.length

  const handleSave = async () => {
    if (!content.trim() || saving) return
    setSaving(true)
    try {
      await onSave(content.trim())
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <div className="modal-header">
          <h2 className="modal-title">投稿を編集</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <textarea
            className="post-textarea"
            rows={4}
            maxLength={MAX_LENGTH}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <p className={`char-count${remaining < 20 ? ' char-count--warn' : ''}`}>
            {content.length}/{MAX_LENGTH}
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>キャンセル</button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || !content.trim() || remaining < 0}
          >
            {saving ? '保存中...' : '保存する'}
          </button>
        </div>
      </div>
    </div>
  )
}
