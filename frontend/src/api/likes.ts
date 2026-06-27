import api from './auth'

export async function likePost(postId: number): Promise<void> {
  await api.post(`/api/posts/${postId}/like`)
}

export async function unlikePost(postId: number): Promise<void> {
  await api.delete(`/api/posts/${postId}/like`)
}
