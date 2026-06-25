import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function HomePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="home-container">
      <div className="home-card">
        <h1>RaiseTimeLine</h1>
        <p>✅ ログイン成功！</p>
        <p>こんにちは、<strong>{user?.displayName}</strong> さん</p>
        <br />
        <button className="btn-secondary" onClick={handleLogout}>
          ログアウト
        </button>
      </div>
    </div>
  )
}
