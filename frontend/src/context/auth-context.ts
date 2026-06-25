import { createContext } from 'react'

interface User {
  userId: number
  displayName: string
  email: string
}

export interface AuthContextType {
  user: User | null
  login: (accessToken: string, user: User) => void
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | null>(null)
