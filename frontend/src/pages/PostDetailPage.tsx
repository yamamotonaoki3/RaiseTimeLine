import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { type Post, deletePost, getPostById, updatePost } from '../api/posts'
import CommentSection from '../components/CommentSection'
import PostCard from '../components/PostCard'
import { useAuth } from '../context/useAuth'

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [post, setPost] = useState<Post | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    getPostById(Number(id))
      .then(setPost)
      .catch(() => setNotFound(true))
  }, [id])

  const handleUpdate = async (postId: number, content: string) => {
    const updated = await updatePost(postId, content)
    setPost(updated)
  }

  const handleDelete = async (postId: number) => {
    await deletePost(postId)
    navigate('/')
  }

  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <span className="nav-logo">RaiseTimeLine</span>
        </div>
      </nav>

      <main className="main">
        <div className="container">
          <div style={{ marginBottom: '12px' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
              ← 戻る
            </button>
          </div>

          {notFound && <p className="timeline-status">投稿が見つかりません。</p>}

          {!notFound && !post && <p className="timeline-status">読み込み中...</p>}

          {post && (
            <>
              <PostCard
                post={post}
                currentUserId={user?.userId ?? 0}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
              <div className="card" style={{ marginTop: '16px', padding: '16px' }}>
                <h3 style={{ marginBottom: '12px' }}>コメント</h3>
                <CommentSection
                  postId={post.id}
                  currentUserId={user?.userId ?? 0}
                />
              </div>
            </>
          )}
        </div>
      </main>
    </>
  )
}
