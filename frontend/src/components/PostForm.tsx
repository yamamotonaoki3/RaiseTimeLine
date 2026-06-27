import { useState } from 'react'

interface Props {
  onSubmit: (content: string) => Promise<void>
}

const MAX_LENGTH = 280

export default function PostForm({ onSubmit }: Props) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const remaining = MAX_LENGTH - content.length

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || loading) return
    setLoading(true)
    try {
      await onSubmit(content.trim())
      setContent('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="post-form" onSubmit={handleSubmit}>
      <textarea
        className="post-textarea"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="いまどうしてる？"
        maxLength={MAX_LENGTH}
        rows={3}
      />
      <div className="post-form-footer">
        <span className={`char-count${remaining < 20 ? ' char-count--warn' : ''}`}>
          {remaining}
        </span>
        <button
          className="btn-primary post-submit-btn"
          type="submit"
          disabled={loading || !content.trim() || remaining < 0}
        >
          {loading ? '投稿中...' : '投稿する'}
        </button>
      </div>
    </form>
  )
}
