import React, { useState } from 'react'
import { setAccessToken, logout as apiLogout } from '../api/auth'
import { AuthContext } from './auth-context'

interface User {
  userId: number
  displayName: string
  email: string
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

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

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}
