import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export default function NavBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const initial = user?.displayName.charAt(0).toUpperCase() ?? '?'

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link to="/" className="nav-logo">RaiseTimeLine</Link>
        <div className="nav-links">
          {user && (
            <div className="nav-user">
              <Link to={`/users/${user.userId}`} className="nav-avatar">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.displayName} />
                ) : (
                  initial
                )}
              </Link>
              <Link to={`/users/${user.userId}`} className="nav-display-name">{user.displayName}</Link>
            </div>
          )}
          <button className="nav-link btn-ghost" onClick={handleLogout}>
            ログアウト
          </button>
        </div>
      </div>
    </nav>
  )
}
