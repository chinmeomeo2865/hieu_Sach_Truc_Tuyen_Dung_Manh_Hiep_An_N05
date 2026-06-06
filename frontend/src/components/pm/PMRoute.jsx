import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export default function PMRoute({ children }) {
  const user  = useAuthStore(s => s.user)
  const token = useAuthStore(s => s.token)
  if (!token || !user) return <Navigate to="/auth/login" replace />
  if (user.role !== 'product_manager' && user.role !== 'admin') return <Navigate to="/" replace />
  return children
}
