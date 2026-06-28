import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { Post } from '../api/posts'
import { deletePost, updatePost } from '../api/posts'
import type { UserProfile } from '../api/users'
import {
  followUser,
  getUserPosts,
  getUserProfile,
  unfollowUser,
  updateUserProfile,
} from '../api/users'
import PostCard from '../components/PostCard'
import ProfileEditModal from '../components/ProfileEditModal'
import { useAuth } from '../context/useAuth'

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { user, updateDisplayName, updateAvatarUrl } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [showEdit, setShowEdit] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const userId = Number(id)
  const isMe = user?.userId === userId

  useEffect(() => {
    if (!id) return
    getUserProfile(userId)
      .then(setProfile)
      .catch(() => setNotFound(true))
    getUserPosts(userId).then(setPosts).catch(() => {})
  }, [id, userId])

  const handleFollow = async () => {
    if (!profile) return
    try {
      if (profile.followedByMe) {
        await unfollowUser(userId)
        setProfile({ ...profile, followedByMe: false, followerCount: profile.followerCount - 1 })
      } else {
        await followUser(userId)
        setProfile({ ...profile, followedByMe: true, followerCount: profile.followerCount + 1 })
      }
    } catch {
      // no-op
    }
  }

  const handleSaveProfile = async (displayName: string, bio: string, avatar?: File) => {
    const updated = await updateUserProfile(userId, displayName, bio, avatar)
    setProfile(updated)
    updateDisplayName(updated.displayName)
    updateAvatarUrl(updated.avatarUrl)
    setShowEdit(false)
  }

  const handleUpdate = async (postId: number, content: string, image?: File, removeImage?: boolean) => {
    const updated = await updatePost(postId, content, image, removeImage)
    setPosts(posts.map((p) => (p.id === postId ? updated : p)))
  }

  const handleDelete = async (postId: number) => {
    await deletePost(postId)
    setPosts(posts.filter((p) => p.id !== postId))
  }

  if (notFound) {
    return (
      <div className="container">
        <p className="empty-msg">ユーザーが見つかりません。</p>
      </div>
    )
  }

  if (!profile) return null

  const initial = profile.displayName.charAt(0).toUpperCase()

  return (
    <>
      <div className="container">
        <div style={{ marginBottom: '12px' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← 戻る</button>
        </div>

        <div className="card profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.displayName} />
              ) : (
                initial
              )}
            </div>
            <div className="profile-info">
              <h2 className="profile-name">{profile.displayName}</h2>
              <p className="profile-bio">{profile.bio ?? '自己紹介はまだありません'}</p>
              <div className="profile-stats">
                <Link to={`/users/${userId}/following`} className="stat-link">
                  <span className="stat-num">{profile.followingCount}</span> フォロー中
                </Link>
                <Link to={`/users/${userId}/followers`} className="stat-link">
                  <span className="stat-num">{profile.followerCount}</span> フォロワー
                </Link>
                <span className="stat-link">
                  <span className="stat-num">{profile.postCount}</span> 投稿
                </span>
              </div>
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                {isMe ? (
                  <button className="btn btn-ghost" onClick={() => setShowEdit(true)}>
                    ✏️ プロフィールを編集
                  </button>
                ) : (
                  <button
                    className={`btn ${profile.followedByMe ? 'btn-ghost' : 'btn-primary'}`}
                    onClick={handleFollow}
                  >
                    {profile.followedByMe ? 'フォロー中' : 'フォロー'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '16px' }}>
          <h3 style={{ padding: '0 4px', marginBottom: '8px' }}>投稿一覧</h3>
          {posts.length === 0 ? (
            <p className="empty-msg">投稿がまだありません。</p>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={user?.userId ?? 0}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </div>

      {showEdit && (
        <ProfileEditModal
          profile={profile}
          onSave={handleSaveProfile}
          onClose={() => setShowEdit(false)}
        />
      )}
    </>
  )
}
