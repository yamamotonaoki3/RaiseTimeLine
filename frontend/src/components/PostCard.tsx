import { useState } from 'react'
import type { Post } from '../api/posts'

interface Props {
  post: Post
  currentUserId: number
  onUpdate: (id: number, content: string) => Promise<void>
  onDelete: (id: number) => Promise<void>
}

export default function PostCard({ post, currentUserId, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [saving, setSaving] = useState(false)
  const isOwner = post.userId === currentUserId

  const handleSave = async () => {
    if (!editContent.trim() || saving) return
    setSaving(true)
    try {
      await onUpdate(post.id, editContent.trim())
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('この投稿を削除しますか？')) return
    await onDelete(post.id)
  }

  const formattedDate = new Date(post.createdAt).toLocaleString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="post-card">
      <div className="post-card-header">
        <span className="post-author">{post.displayName}</span>
        <span className="post-date">{formattedDate}</span>
      </div>
      {editing ? (
        <div className="post-edit">
          <textarea
            className="post-textarea"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            maxLength={280}
            rows={3}
          />
          <div className="post-edit-actions">
            <button className="btn-primary post-submit-btn" onClick={handleSave} disabled={saving}>
              {saving ? '保存中...' : '保存'}
            </button>
            <button
              className="btn-secondary"
              onClick={() => {
                setEditing(false)
                setEditContent(post.content)
              }}
            >
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        <p className="post-content">{post.content}</p>
      )}
      {isOwner && !editing && (
        <div className="post-actions">
          <button className="btn-text" onClick={() => setEditing(true)}>
            編集
          </button>
          <button className="btn-text btn-text--danger" onClick={handleDelete}>
            削除
          </button>
        </div>
      )}
    </div>
  )
}
