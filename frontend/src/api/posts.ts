import api from './auth'

export interface Post {
  id: number
  userId: number
  displayName: string
  avatarUrl: string | null
  content: string
  imageUrl: string | null
  createdAt: string
  updatedAt: string
  likeCount: number
  likedByMe: boolean
  commentCount: number
}

export async function getPostById(id: number): Promise<Post> {
  const { data } = await api.get<Post>(`/api/posts/${id}`)
  return data
}

export type FeedType = 'all' | 'following'

export async function getPosts(params?: { cursor?: number; feed?: FeedType }): Promise<Post[]> {
  const { data } = await api.get<Post[]>('/api/posts', { params })
  return data
}

export async function getNewCount(sinceId: number, feed: FeedType = 'all'): Promise<number> {
  const { data } = await api.get<{ count: number }>('/api/posts/new-count', {
    params: { sinceId, feed },
  })
  return data.count
}

export async function getNewerPosts(sinceId: number, feed: FeedType = 'all'): Promise<Post[]> {
  const { data } = await api.get<Post[]>('/api/posts/newer', { params: { sinceId, feed } })
  return data
}

export async function createPost(content: string, image?: File): Promise<Post> {
  const form = new FormData()
  form.append('content', content)
  if (image) form.append('image', image)
  const { data } = await api.post<Post>('/api/posts', form)
  return data
}

export async function updatePost(
  id: number,
  content: string,
  image?: File,
  removeImage?: boolean,
): Promise<Post> {
  const form = new FormData()
  form.append('content', content)
  if (image) form.append('image', image)
  if (removeImage) form.append('removeImage', 'true')
  const { data } = await api.patch<Post>(`/api/posts/${id}`, form)
  return data
}

export async function deletePost(id: number): Promise<void> {
  await api.delete(`/api/posts/${id}`)
}
