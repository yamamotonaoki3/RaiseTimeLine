import { useState } from 'react'

interface Props {
  onSubmit: (content: string) => Promise<void>
  onClose: () => void
}

const MAX_LENGTH = 280

export default function CreatePostModal({ onSubmit, onClose }: Props) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const remaining = MAX_LENGTH - content.length

  const handleSubmit = async () => {
    if (!content.trim() || loading) return
    setLoading(true)
    try {
      await onSubmit(content.trim())
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <div className="modal-header">
          <h2 className="modal-title">投稿を作成</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <textarea
            className="post-textarea"
            rows={4}
            maxLength={MAX_LENGTH}
            placeholder="いまどうしてる？"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            autoFocus
          />
          <p className={`char-count${remaining < 20 ? ' char-count--warn' : ''}`}>
            {content.length}/{MAX_LENGTH}
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>キャンセル</button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading || !content.trim() || remaining < 0}
          >
            {loading ? '投稿中...' : '投稿する'}
          </button>
        </div>
      </div>
    </div>
  )
}
