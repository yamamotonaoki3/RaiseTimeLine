import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { UserSummary } from '../api/users'
import { getFollowers, getFollowing, getUserProfile } from '../api/users'
import UserCard from '../components/UserCard'
import { useAuth } from '../context/useAuth'

interface Props {
  mode: 'followers' | 'following'
}

export default function FollowListPage({ mode }: Props) {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [list, setList] = useState<UserSummary[]>([])
  const [displayName, setDisplayName] = useState('')
  const [counts, setCounts] = useState({ followerCount: 0, followingCount: 0 })
  const [notFound, setNotFound] = useState(false)

  const userId = Number(id)

  useEffect(() => {
    if (!id) return
    getUserProfile(userId)
      .then((p) => {
        setDisplayName(p.displayName)
        setCounts({ followerCount: p.followerCount, followingCount: p.followingCount })
      })
      .catch(() => setNotFound(true))

    const fetch = mode === 'followers' ? getFollowers : getFollowing
    fetch(userId).then(setList).catch(() => {})
  }, [id, userId, mode])

  if (notFound) {
    return (
      <div className="container">
        <p className="empty-msg">ユーザーが見つかりません。</p>
      </div>
    )
  }

  return (
    <div className="container">
      <div style={{ marginBottom: '12px' }}>
        <Link to={`/users/${userId}`} className="btn btn-ghost btn-sm">
          ← {displayName} さんのプロフィールに戻る
        </Link>
      </div>

      <div className="tabs">
        <Link
          to={`/users/${userId}/followers`}
          className={`tab-btn${mode === 'followers' ? ' active' : ''}`}
        >
          フォロワー ({counts.followerCount})
        </Link>
        <Link
          to={`/users/${userId}/following`}
          className={`tab-btn${mode === 'following' ? ' active' : ''}`}
        >
          フォロー中 ({counts.followingCount})
        </Link>
      </div>

      <div style={{ marginTop: '16px' }}>
        {list.length === 0 ? (
          <p className="empty-msg">まだいません。</p>
        ) : (
          list.map((u) => (
            <UserCard key={u.id} user={u} currentUserId={user?.userId ?? 0} />
          ))
        )}
      </div>
    </div>
  )
}
