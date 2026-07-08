import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useRole } from '../context/RoleContext'

export default function ProtectedRoute({ children }) {
  const { user } = useAuth()
  const { profile, loading } = useRole()

  if (user === undefined || loading) {
    return <div className="screen-loading">Loading…</div>
  }
  if (user === null) {
    return <Navigate to="/login" replace />
  }
  if (profile === null) {
    return <Navigate to="/onboarding" replace />
  }
  return children
}
