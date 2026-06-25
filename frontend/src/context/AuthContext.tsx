import React, { createContext, useContext, useState } from 'react'
import { setAccessToken, logout as apiLogout } from '../api/auth'

interface User {
  userId: number
  displayName: string
  email: string
}

interface AuthContextType {
  user: User | null
  login: (accessToken: string, user: User) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

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

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
