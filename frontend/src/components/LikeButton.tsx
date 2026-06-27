import { useState } from 'react'
import { likePost, unlikePost } from '../api/likes'

interface Props {
  postId: number
  initialCount: number
  initialLiked: boolean
}

export default function LikeButton({ postId, initialCount, initialLiked }: Props) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    if (loading) return
    setLoading(true)
    try {
      if (liked) {
        await unlikePost(postId)
        setLiked(false)
        setCount((c) => c - 1)
      } else {
        await likePost(postId)
        setLiked(true)
        setCount((c) => c + 1)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      className={`like-btn${liked ? ' liked' : ''}`}
      onClick={handleToggle}
      disabled={loading}
      aria-label={liked ? 'いいねを取り消す' : 'いいねする'}
    >
      ♥ {count}
    </button>
  )
}
