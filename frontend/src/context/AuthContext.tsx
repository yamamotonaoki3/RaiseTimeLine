import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { type RefreshResponse, logout as apiLogout, setAccessToken } from '../api/auth'
import { API_BASE_URL } from '../api/config'
import { type User, AuthContext } from './auth-context'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 起動時のセッション復元。api インスタンスを経由しないため baseURL も自前で渡す。
    // 渡し忘れると、リロードしたときだけログイン状態が復元されない状態になる。
    axios
      .post<RefreshResponse>('/api/auth/refresh', null, {
        baseURL: API_BASE_URL,
        withCredentials: true,
      })
      .then(({ data }) => {
        setAccessToken(data.accessToken)
        setUser({
          userId: data.userId,
          displayName: data.displayName,
          email: data.email,
          avatarUrl: data.avatarUrl,
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return null

  const login = (accessToken: string, userData: User) => {
    setAccessToken(accessToken)
    setUser(userData)
  }

  const logout = async () => {
    try {
      await apiLogout()
    } finally {
      setAccessToken(null)
      setUser(null)
    }
  }

  const updateDisplayName = (displayName: string) => {
    setUser((prev) => (prev ? { ...prev, displayName } : prev))
  }

  const updateAvatarUrl = (avatarUrl: string | null) => {
    setUser((prev) => (prev ? { ...prev, avatarUrl } : prev))
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateDisplayName, updateAvatarUrl }}>
      {children}
    </AuthContext.Provider>
  )
}
