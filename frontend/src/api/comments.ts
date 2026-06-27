import api from './auth'

export interface Comment {
  id: number
  postId: number
  userId: number
  displayName: string
  content: string
  createdAt: string
  updatedAt: string
}

export async function getComments(postId: number): Promise<Comment[]> {
  const { data } = await api.get<Comment[]>(`/api/posts/${postId}/comments`)
  return data
}

export async function createComment(postId: number, content: string): Promise<Comment> {
  const { data } = await api.post<Comment>(`/api/posts/${postId}/comments`, { content })
  return data
}

export async function deleteComment(postId: number, commentId: number): Promise<void> {
  await api.delete(`/api/posts/${postId}/comments/${commentId}`)
}
