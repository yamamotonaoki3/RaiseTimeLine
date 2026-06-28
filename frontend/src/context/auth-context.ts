import { createContext } from 'react'

export interface User {
  userId: number
  displayName: string
  email: string
  avatarUrl: string | null
}

export interface AuthContextType {
  user: User | null
  login: (accessToken: string, user: User) => void
  logout: () => Promise<void>
  updateDisplayName: (displayName: string) => void
  updateAvatarUrl: (avatarUrl: string | null) => void
}

export const AuthContext = createContext<AuthContextType | null>(null)
