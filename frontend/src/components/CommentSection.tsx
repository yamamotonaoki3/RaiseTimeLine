import { useEffect, useState } from 'react'
import type { Comment } from '../api/comments'
import { createComment, deleteComment, getComments } from '../api/comments'

interface Props {
  postId: number
  currentUserId: number
  onCommentAdded?: () => void
}

export default function CommentSection({ postId, currentUserId, onCommentAdded }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getComments(postId).then(setComments)
  }, [postId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return
    setLoading(true)
    try {
      const comment = await createComment(postId, input.trim())
      setComments((prev) => [...prev, comment])
      setInput('')
      onCommentAdded?.()
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (commentId: number) => {
    await deleteComment(postId, commentId)
    setComments((prev) => prev.filter((c) => c.id !== commentId))
  }

  return (
    <div className="comment-section">
      <ul className="comment-list">
        {comments.map((c) => (
          <li key={c.id} className="comment-item">
            <span className="comment-author">{c.displayName}</span>
            <span className="comment-content">{c.content}</span>
            {c.userId === currentUserId && (
              <button
                className="comment-delete-btn"
                onClick={() => handleDelete(c.id)}
                aria-label="コメントを削除"
              >
                ✕
              </button>
            )}
          </li>
        ))}
      </ul>
      <form className="comment-form" onSubmit={handleSubmit}>
        <input
          className="comment-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="コメントを入力..."
          maxLength={280}
        />
        <button className="comment-submit-btn" type="submit" disabled={loading || !input.trim()}>
          送信
        </button>
      </form>
    </div>
  )
}
