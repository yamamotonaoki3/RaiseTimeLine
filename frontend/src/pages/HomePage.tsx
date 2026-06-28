import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  type Post,
  createPost,
  deletePost,
  getNewCount,
  getNewerPosts,
  getPosts,
  updatePost,
} from '../api/posts'
import CreatePostModal from '../components/CreatePostModal'
import PostCard from '../components/PostCard'
import { useAuth } from '../context/useAuth'

const POLL_INTERVAL = 30000

export default function HomePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [posts, setPosts] = useState<Post[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [newCount, setNewCount] = useState(0)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const topIdRef = useRef<number>(0)
  const cursorRef = useRef<number | null>(null)
  const hasMoreRef = useRef(true)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const loadingRef = useRef(false)

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return
    loadingRef.current = true
    setLoading(true)
    try {
      const params = cursorRef.current != null ? { cursor: cursorRef.current } : undefined
      const fetched = await getPosts(params)
      if (fetched.length === 0) {
        hasMoreRef.current = false
        setHasMore(false)
        return
      }
      setPosts((prev) => {
        const merged = cursorRef.current == null ? fetched : [...prev, ...fetched]
        if (merged.length > 0 && topIdRef.current === 0) {
          topIdRef.current = merged[0].id
        }
        return merged
      })
      cursorRef.current = fetched[fetched.length - 1].id
      if (fetched.length < 20) {
        hasMoreRef.current = false
        setHasMore(false)
      }
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMore()
  }, [loadMore])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore()
      },
      { threshold: 0.1 },
    )
    const el = sentinelRef.current
    if (el) observer.observe(el)
    return () => {
      if (el) observer.unobserve(el)
    }
  }, [loadMore])

  useEffect(() => {
    const timer = setInterval(async () => {
      if (topIdRef.current === 0) return
      const count = await getNewCount(topIdRef.current)
      if (count > 0) {
        const newer = await getNewerPosts(topIdRef.current)
        if (newer.length > 0) {
          topIdRef.current = newer[0].id
          setPosts((prev) => [...newer, ...prev])
          setNewCount((prev) => prev + newer.length)
        }
      } else {
        const refreshed = await getPosts()
        setPosts((prev) =>
          prev.map((p) => {
            const updated = refreshed.find((r) => r.id === p.id)
            return updated
              ? { ...p, likeCount: updated.likeCount, likedByMe: updated.likedByMe, commentCount: updated.commentCount }
              : p
          }),
        )
      }
    }, POLL_INTERVAL)
    return () => clearInterval(timer)
  }, [])

  const handleCreate = async (content: string) => {
    const created = await createPost(content)
    topIdRef.current = created.id
    setPosts((prev) => [created, ...prev])
    setNewCount(0)
  }

  const handleUpdate = async (id: number, content: string) => {
    const updated = await updatePost(id, content)
    setPosts((prev) => prev.map((p) => (p.id === id ? updated : p)))
  }

  const handleDelete = async (id: number) => {
    await deletePost(id)
    setPosts((prev) => prev.filter((p) => p.id !== id))
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const initial = user?.displayName.charAt(0).toUpperCase() ?? '?'

  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <span className="nav-logo">RaiseTimeLine</span>
          <div className="nav-links">
            <button className="nav-link btn-ghost" onClick={handleLogout}>
              ログアウト
            </button>
          </div>
        </div>
      </nav>

      <main className="main">
        <div className="container">
          {newCount > 0 && (
            <div className="new-posts-banner" onClick={() => setNewCount(0)} style={{ cursor: 'pointer' }}>
              {newCount}件の新しい投稿を表示しました
            </div>
          )}

          <div className="compose-box">
            <div className="post-avatar">{initial}</div>
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={() => setShowCreateModal(true)}
            >
              ✏️ 投稿する
            </button>
          </div>

          <div className="post-list">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={user?.userId ?? 0}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
            <div ref={sentinelRef} className="sentinel" />
            {loading && <p className="timeline-status">読み込み中...</p>}
            {!hasMore && posts.length > 0 && (
              <p className="timeline-status">これ以上の投稿はありません</p>
            )}
            {!loading && posts.length === 0 && (
              <p className="timeline-status">まだ投稿がありません。最初の投稿をしてみましょう！</p>
            )}
          </div>
        </div>
      </main>

      {showCreateModal && (
        <CreatePostModal
          onSubmit={handleCreate}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </>
  )
}
