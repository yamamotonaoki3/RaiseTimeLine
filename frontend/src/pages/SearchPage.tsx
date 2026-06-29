import { useEffect, useRef, useState } from 'react'
import { searchUsers } from '../api/users'
import type { UserSummary } from '../api/users'
import UserCard from '../components/UserCard'
import { useAuth } from '../context/useAuth'

type SearchState = 'idle' | 'found' | 'empty'

export default function SearchPage() {
  const { user } = useAuth()
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState<UserSummary[]>([])
  const [state, setState] = useState<SearchState>('idle')
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const trimmed = keyword.trim()
    if (!trimmed) {
      setState('idle')
      setResults([])
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await searchUsers(trimmed)
        setResults(data)
        setState(data.length > 0 ? 'found' : 'empty')
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [keyword])

  return (
    <div className="container">
      <h2 style={{ marginBottom: '16px' }}>ユーザー検索</h2>
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          className="form-input"
          placeholder="表示名または読み仮名で検索..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          autoFocus
        />
      </div>

      {loading && <p className="empty-msg">検索中...</p>}

      {!loading && state === 'idle' && (
        <p className="empty-msg">表示名または読み仮名で検索してください。</p>
      )}

      {!loading && state === 'empty' && (
        <p className="empty-msg">ユーザーが見つかりませんでした。</p>
      )}

      {!loading && state === 'found' && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {results.map((u) => (
            <li key={u.id}>
              <UserCard user={u} currentUserId={user!.userId} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
