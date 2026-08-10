import { useCallback, useEffect, useRef, useState } from 'react'
import {
  type FeedType,
  type Post,
  createPost,
  deletePost,
  getNewCount,
  getNewerPosts,
  getPosts,
  updatePost,
} from '../api/posts'
import type { UserProfile } from '../api/users'
import { getUserProfile, updateUserProfile } from '../api/users'
import CreatePostModal from '../components/CreatePostModal'
import PostCard from '../components/PostCard'
import ProfileEditModal from '../components/ProfileEditModal'
import { useAuth } from '../context/useAuth'

const POLL_INTERVAL = 30000

export default function HomePage() {
  const { user, updateDisplayName, updateAvatarUrl } = useAuth()
  const [feed, setFeed] = useState<FeedType>('following')
  const [posts, setPosts] = useState<Post[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [newCount, setNewCount] = useState(0)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [myProfile, setMyProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    if (user?.userId) {
      getUserProfile(user.userId).then(setMyProfile).catch(() => {})
    }
  }, [user?.userId])

  const feedRef = useRef<FeedType>('following')
  const topIdRef = useRef<number>(0)
  const cursorRef = useRef<number | null>(null)
  const hasMoreRef = useRef(true)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const loadingRef = useRef(false)

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return
    // 応答が返った時点でフィードが切り替わっていないか確認するため、
    // リクエスト開始時点のフィードを控えておく。
    const requestedFeed = feedRef.current
    loadingRef.current = true
    setLoading(true)
    try {
      const params = cursorRef.current != null
        ? { cursor: cursorRef.current, feed: requestedFeed }
        : { feed: requestedFeed }
      const fetched = await getPosts(params)

      // 取得中にフィードが切り替わっていたら、この結果は古いので使わない。
      // switchFeed() が posts / cursor 等を既に新フィード用にリセットしているため、
      // ここで setPosts すると新しい表示が古いフィードのデータで上書きされてしまう。
      if (feedRef.current !== requestedFeed) return

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
      // 自分が古いフィードのリクエストだった場合、既に switchFeed() が
      // ガードを解除し、新フィードの loadMore() が別途進行中の可能性がある。
      // その場合はここでガードを触らない（新しい呼び出しの loadingRef を
      // 誤って false のまま放置してしまうのを防ぐ）。
      if (feedRef.current === requestedFeed) {
        loadingRef.current = false
      }
      setLoading(false)
    }
  }, [])

  const switchFeed = useCallback((f: FeedType) => {
    feedRef.current = f
    setFeed(f)
    setPosts([])
    setNewCount(0)
    topIdRef.current = 0
    cursorRef.current = null
    hasMoreRef.current = true
    setHasMore(true)
    // 前のフィードの読み込みがまだ進行中でも、新しいフィードの読み込みを
    // 即座に開始できるようガードを解除する。前の読み込みが後から解決しても、
    // loadMore() 側でフィードの不一致を検知して結果を捨てるため上書きされない。
    loadingRef.current = false
  }, [])

  useEffect(() => {
    loadMore()
  }, [feed, loadMore])

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
      const currentFeed = feedRef.current

      const refreshed = await getPosts({ feed: currentFeed })
      const refreshedMap = new Map(refreshed.map((p) => [p.id, p]))
      const minRefreshedId = refreshed.length > 0 ? Math.min(...refreshed.map((p) => p.id)) : 0

      const count = await getNewCount(topIdRef.current, currentFeed)
      if (count > 0) {
        const newer = await getNewerPosts(topIdRef.current, currentFeed)
        if (newer.length > 0) {
          topIdRef.current = newer[0].id
          setNewCount((prev) => prev + newer.length)
          setPosts((prev) => [...newer, ...prev])
        }
      }

      setPosts((prev) =>
        prev
          .filter((p) => p.id < minRefreshedId || refreshedMap.has(p.id))
          .map((p) => {
            const updated = refreshedMap.get(p.id)
            return updated
              ? { ...p, likeCount: updated.likeCount, likedByMe: updated.likedByMe, commentCount: updated.commentCount }
              : p
          }),
      )
    }, POLL_INTERVAL)
    return () => clearInterval(timer)
  }, [])

  const handleCreate = async (content: string, image?: File) => {
    const created = await createPost(content, image)
    if (feedRef.current === 'all') {
      topIdRef.current = created.id
      setPosts((prev) => [created, ...prev])
      setNewCount(0)
    }
  }

  const handleUpdate = async (id: number, content: string, image?: File, removeImage?: boolean) => {
    const updated = await updatePost(id, content, image, removeImage)
    setPosts((prev) => prev.map((p) => (p.id === id ? updated : p)))
  }

  const handleDelete = async (id: number) => {
    await deletePost(id)
    setPosts((prev) => prev.filter((p) => p.id !== id))
  }

  const handleSaveProfile = async (displayName: string, bio: string, avatar?: File) => {
    if (!user) return
    const updated = await updateUserProfile(user.userId, displayName, bio, avatar)
    setMyProfile(updated)
    updateDisplayName(updated.displayName)
    updateAvatarUrl(updated.avatarUrl)
    setShowEditModal(false)
  }

  const initial = user?.displayName.charAt(0).toUpperCase() ?? '?'

  const emptyMessage = feed === 'following'
    ? 'フォロー中のユーザーの投稿がありません。誰かをフォローしてみましょう！'
    : 'まだ投稿がありません。最初の投稿をしてみましょう！'

  return (
    <>
      <main className="main">
        <div className="container">
          {newCount > 0 && (
            <div className="new-posts-banner" onClick={() => setNewCount(0)} style={{ cursor: 'pointer' }}>
              {newCount}件の新しい投稿を表示しました
            </div>
          )}

          <div className="compose-box">
            <div className="post-avatar">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.displayName} />
              ) : (
                initial
              )}
            </div>
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={() => setShowCreateModal(true)}
            >
              ✏️ 投稿する
            </button>
          </div>

          <div className="tabs">
            <button
              className={`tab-btn${feed === 'following' ? ' active' : ''}`}
              onClick={() => switchFeed('following')}
            >
              フォロー中
            </button>
            <button
              className={`tab-btn${feed === 'all' ? ' active' : ''}`}
              onClick={() => switchFeed('all')}
            >
              全体
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
              <p className="timeline-status">{emptyMessage}</p>
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

      {showEditModal && myProfile && (
        <ProfileEditModal
          profile={myProfile}
          onSave={handleSaveProfile}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </>
  )
}
