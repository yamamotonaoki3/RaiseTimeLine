import api from './auth'
import type { Post } from './posts'

export interface UserProfile {
  id: number
  displayName: string
  avatarUrl: string | null
  bio: string | null
  followerCount: number
  followingCount: number
  postCount: number
  followedByMe: boolean
}

export interface UserSummary {
  id: number
  displayName: string
  avatarUrl: string | null
  bio: string | null
  followedByMe: boolean
}

export interface UpdateProfileRequest {
  displayName: string
  bio: string
}

export async function getUserProfile(userId: number): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>(`/api/users/${userId}`)
  return data
}

export async function updateUserProfile(
  userId: number,
  body: UpdateProfileRequest,
): Promise<UserProfile> {
  const { data } = await api.put<UserProfile>(`/api/users/${userId}`, body)
  return data
}

export async function getUserPosts(userId: number): Promise<Post[]> {
  const { data } = await api.get<Post[]>(`/api/users/${userId}/posts`)
  return data
}

export async function followUser(userId: number): Promise<void> {
  await api.post(`/api/users/${userId}/follows`)
}

export async function unfollowUser(userId: number): Promise<void> {
  await api.delete(`/api/users/${userId}/follows`)
}

export async function getFollowers(userId: number): Promise<UserSummary[]> {
  const { data } = await api.get<UserSummary[]>(`/api/users/${userId}/followers`)
  return data
}

export async function getFollowing(userId: number): Promise<UserSummary[]> {
  const { data } = await api.get<UserSummary[]>(`/api/users/${userId}/following`)
  return data
}
