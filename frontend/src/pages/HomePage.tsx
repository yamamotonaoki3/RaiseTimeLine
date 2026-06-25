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
import PostCard from '../components/PostCard'
import PostForm from '../components/PostForm'
import { useAuth } from '../context/useAuth'

const POLL_INTERVAL = 30000

export default function HomePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [posts, setPosts] = useState<Post[]>([])
  const [cursor, setCursor] = useState<number | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [newCount, setNewCount] = useState(0)
  const topIdRef = useRef<number>(0)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)
    try {
      const params = cursor != null ? { cursor } : undefined
      const fetched = await getPosts(params)
      if (fetched.length === 0) {
        setHasMore(false)
        return
      }
      setPosts((prev) => {
        const merged = cursor == null ? fetched : [...prev, ...fetched]
        if (merged.length > 0 && topIdRef.current === 0) {
          topIdRef.current = merged[0].id
        }
        return merged
      })
      setCursor(fetched[fetched.length - 1].id)
      if (fetched.length < 20) setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [cursor, hasMore, loading])

  useEffect(() => {
    loadMore()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
      setNewCount(count)
    }, POLL_INTERVAL)
    return () => clearInterval(timer)
  }, [])

  const handleShowNew = async () => {
    const newer = await getNewerPosts(topIdRef.current)
    if (newer.length === 0) return
    topIdRef.current = newer[0].id
    setPosts((prev) => [...newer, ...prev])
    setNewCount(0)
  }

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

  return (
    <div className="timeline-layout">
      <header className="timeline-header">
        <h1>RaiseTimeLine</h1>
        <button className="btn-secondary" onClick={handleLogout}>
          ログアウト
        </button>
      </header>

      <main className="timeline-main">
        {newCount > 0 && (
          <button className="new-posts-banner" onClick={handleShowNew}>
            {newCount}件の新しい投稿があります — クリックして表示
          </button>
        )}

        <PostForm onSubmit={handleCreate} />

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
      </main>
    </div>
  )
}
