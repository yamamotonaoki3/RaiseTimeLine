import axios from 'axios'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { type Post, deletePost, getPostById, updatePost } from '../api/posts'
import CommentSection from '../components/CommentSection'
import ErrorMessage from '../components/ErrorMessage'
import PostCard from '../components/PostCard'
import { useAuth } from '../context/useAuth'

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [post, setPost] = useState<Post | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPost = useCallback(async () => {
    if (!id) return
    setNotFound(false)
    setError(null)
    try {
      setPost(await getPostById(Number(id)))
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 404) {
        setNotFound(true)
      } else {
        setError('投稿の取得に失敗しました。')
      }
    }
  }, [id])

  useEffect(() => {
    void loadPost()
  }, [loadPost])

  const handleUpdate = async (postId: number, content: string, image?: File, removeImage?: boolean) => {
    const updated = await updatePost(postId, content, image, removeImage)
    setPost(updated)
  }

  const handleDelete = async (postId: number) => {
    await deletePost(postId)
    void navigate('/')
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

          {error && <ErrorMessage message={error} onRetry={loadPost} />}

          {!notFound && !error && !post && <p className="timeline-status">読み込み中...</p>}

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
