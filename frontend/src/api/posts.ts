import api from './auth'

export interface Post {
  id: number
  userId: number
  displayName: string
  content: string
  createdAt: string
  updatedAt: string
  likeCount: number
  likedByMe: boolean
  commentCount: number
}

export async function getPosts(params?: { cursor?: number }): Promise<Post[]> {
  const { data } = await api.get<Post[]>('/api/posts', { params })
  return data
}

export async function getNewCount(sinceId: number): Promise<number> {
  const { data } = await api.get<{ count: number }>('/api/posts/new-count', {
    params: { sinceId },
  })
  return data.count
}

export async function getNewerPosts(sinceId: number): Promise<Post[]> {
  const { data } = await api.get<Post[]>('/api/posts/newer', { params: { sinceId } })
  return data
}

export async function createPost(content: string): Promise<Post> {
  const { data } = await api.post<Post>('/api/posts', { content })
  return data
}

export async function updatePost(id: number, content: string): Promise<Post> {
  const { data } = await api.patch<Post>(`/api/posts/${id}`, { content })
  return data
}

export async function deletePost(id: number): Promise<void> {
  await api.delete(`/api/posts/${id}`)
}
