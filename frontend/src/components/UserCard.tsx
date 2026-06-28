import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { UserSummary } from '../api/users'
import { followUser, unfollowUser } from '../api/users'

interface Props {
  user: UserSummary
  currentUserId: number
}

export default function UserCard({ user, currentUserId }: Props) {
  const [followedByMe, setFollowedByMe] = useState(user.followedByMe)
  const isMe = user.id === currentUserId
  const initial = user.displayName.charAt(0).toUpperCase()

  const handleToggle = async () => {
    try {
      if (followedByMe) {
        await unfollowUser(user.id)
        setFollowedByMe(false)
      } else {
        await followUser(user.id)
        setFollowedByMe(true)
      }
    } catch {
      // no-op
    }
  }

  return (
    <div className="user-card">
      <Link to={`/users/${user.id}`} className="user-card-avatar">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.displayName} />
        ) : (
          initial
        )}
      </Link>
      <div className="user-card-body">
        <Link to={`/users/${user.id}`} className="user-card-name">
          {user.displayName}
        </Link>
        {user.bio && <p className="user-card-bio">{user.bio}</p>}
      </div>
      {!isMe && (
        <button
          className={`btn btn-sm ${followedByMe ? 'btn-ghost' : 'btn-primary'}`}
          onClick={handleToggle}
        >
          {followedByMe ? 'フォロー中' : 'フォロー'}
        </button>
      )}
    </div>
  )
}
