import { useState } from 'react'
import type { Post } from '../api/posts'
import DeleteModal from './DeleteModal'
import EditPostModal from './EditPostModal'

interface Props {
  post: Post
  currentUserId: number
  onUpdate: (id: number, content: string) => Promise<void>
  onDelete: (id: number) => Promise<void>
}

export default function PostCard({ post, currentUserId, onUpdate, onDelete }: Props) {
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const isOwner = post.userId === currentUserId
  const isEdited = post.updatedAt !== post.createdAt

  const formattedDate = new Date(post.createdAt).toLocaleString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const initial = post.displayName.charAt(0).toUpperCase()

  return (
    <>
      <div className="post-card">
        <div className="post-card-inner">
          <div className="post-avatar">{initial}</div>
          <div className="post-body">
            <div className="post-meta">
              <span className="post-author">{post.displayName}</span>
              <span className="post-date">{formattedDate}</span>
              {isEdited && <span className="edited-badge">編集済み</span>}
            </div>
            <p className="post-text">{post.content}</p>
            {isOwner && (
              <div className="post-actions">
                <button className="action-btn" onClick={() => setShowEdit(true)}>
                  ✏️ 編集
                </button>
                <button className="action-btn danger-btn" onClick={() => setShowDelete(true)}>
                  🗑️ 削除
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showEdit && (
        <EditPostModal
          post={post}
          onSave={async (content) => {
            await onUpdate(post.id, content)
            setShowEdit(false)
          }}
          onClose={() => setShowEdit(false)}
        />
      )}

      {showDelete && (
        <DeleteModal
          onConfirm={async () => {
            await onDelete(post.id)
            setShowDelete(false)
          }}
          onClose={() => setShowDelete(false)}
        />
      )}
    </>
  )
}
