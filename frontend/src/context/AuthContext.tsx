import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { type RefreshResponse, logout as apiLogout, setAccessToken } from '../api/auth'
import { AuthContext } from './auth-context'

interface User {
  userId: number
  displayName: string
  email: string
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios
      .post<RefreshResponse>('/api/auth/refresh', null, { withCredentials: true })
      .then(({ data }) => {
        setAccessToken(data.accessToken)
        setUser({ userId: data.userId, displayName: data.displayName, email: data.email })
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

  return <AuthContext.Provider value={{ user, login, logout, updateDisplayName }}>{children}</AuthContext.Provider>
}
