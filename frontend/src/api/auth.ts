import axios from 'axios'
import { API_BASE_URL } from './config'

export interface AuthResponse {
  accessToken: string
  userId: number
  displayName: string
  email: string
  avatarUrl: string | null
}

export interface RefreshResponse {
  accessToken: string
  userId: number
  displayName: string
  email: string
  avatarUrl: string | null
}

let currentAccessToken: string | null = null

export function setAccessToken(token: string | null) {
  currentAccessToken = token
}

export function getAccessToken() {
  return currentAccessToken
}

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  if (currentAccessToken) {
    config.headers['Authorization'] = `Bearer ${currentAccessToken}`
  }
  return config
})

let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            original.headers['Authorization'] = `Bearer ${token}`
            resolve(api(original))
          })
        })
      }
      isRefreshing = true
      try {
        // ここは api インスタンスを経由しない（インターセプタが再帰的に走るのを避けるため）。
        // そのぶん baseURL も自前で渡す必要がある。渡し忘れると、通常のAPIと
        // トークン更新だけが別のオリジンを向くというちぐはぐな状態になる。
        const { data } = await axios.post<RefreshResponse>('/api/auth/refresh', null, {
          baseURL: API_BASE_URL,
          withCredentials: true,
        })
        currentAccessToken = data.accessToken
        refreshQueue.forEach((cb) => cb(data.accessToken))
        refreshQueue = []
        original.headers['Authorization'] = `Bearer ${data.accessToken}`
        return api(original)
      } catch {
        currentAccessToken = null
        refreshQueue = []
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  },
)

export async function register(
  email: string,
  username: string,
  displayName: string,
  password: string,
  yomi?: string,
): Promise<AuthResponse> {
  const { data } = await axios.post<AuthResponse>(
    '/api/auth/register',
    { email, username, displayName, password, yomi },
    { withCredentials: true },
  )
  return data
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await axios.post<AuthResponse>(
    '/api/auth/login',
    { email, password },
    { withCredentials: true },
  )
  return data
}

export async function logout(): Promise<void> {
  await api.post('/api/auth/logout')
}

export default api
