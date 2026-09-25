import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, roles }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="panel p-8 text-center">
        <p className="text-steel">Your role ({user.role}) does not have access to this page.</p>
      </div>
    )
  }
  return children
}
