import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register as apiRegister } from '../api/auth'
import { useAuth } from '../context/useAuth'

interface FieldErrors {
  email?: string
  displayName?: string
  password?: string
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [globalError, setGlobalError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})
    setGlobalError('')
    setLoading(true)
    try {
      const data = await apiRegister(email, displayName, password)
      login(data.accessToken, {
        userId: data.userId,
        displayName: data.displayName,
        email: data.email,
      })
      navigate('/')
    } catch (err: unknown) {
      const res = (err as { response?: { data?: { errors?: Array<{ field: string; message: string }>; message?: string } } })?.response?.data
      if (res?.errors) {
        const errs: FieldErrors = {}
        for (const e of res.errors) {
          errs[e.field as keyof FieldErrors] = e.message
        }
        setFieldErrors(errs)
      } else {
        setGlobalError(res?.message ?? '登録に失敗しました')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>新規登録</h1>
        {globalError && <div className="alert alert-error">{globalError}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {fieldErrors.email && <p className="error-text">{fieldErrors.email}</p>}
          </div>
          <div className="form-group">
            <label>表示名</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
            {fieldErrors.displayName && <p className="error-text">{fieldErrors.displayName}</p>}
          </div>
          <div className="form-group">
            <label>パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {fieldErrors.password && <p className="error-text">{fieldErrors.password}</p>}
          </div>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? '登録中...' : '登録する'}
          </button>
        </form>
        <p className="link-text">
          すでにアカウントをお持ちの方は <Link to="/login">ログイン</Link>
        </p>
      </div>
    </div>
  )
}
