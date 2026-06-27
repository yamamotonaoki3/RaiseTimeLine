import { useEffect, useState } from 'react'
import type { Post } from '../api/posts'
import CommentSection from './CommentSection'
import DeleteModal from './DeleteModal'
import EditPostModal from './EditPostModal'
import LikeButton from './LikeButton'

interface Props {
  post: Post
  currentUserId: number
  onUpdate: (id: number, content: string) => Promise<void>
  onDelete: (id: number) => Promise<void>
}

export default function PostCard({ post, currentUserId, onUpdate, onDelete }: Props) {
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [commentCount, setCommentCount] = useState(post.commentCount)
  const isOwner = post.userId === currentUserId

  useEffect(() => {
    setCommentCount(post.commentCount)
  }, [post.commentCount])
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
            <div className="post-footer">
              <LikeButton
                postId={post.id}
                initialCount={post.likeCount}
                initialLiked={post.likedByMe}
              />
              <button
                className="comment-toggle-btn"
                onClick={() => setShowComments((v) => !v)}
                aria-label="コメントを表示"
              >
                💬 {commentCount}
              </button>
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
            {showComments && (
              <CommentSection
                postId={post.id}
                currentUserId={currentUserId}
                onCommentAdded={() => {
                  setCommentCount((c) => c + 1)
                  setShowComments(false)
                }}
              />
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
