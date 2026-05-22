import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export default function WarehouseRoute({ children }) {
  const user  = useAuthStore(s => s.user)
  const token = useAuthStore(s => s.token)

  if (!token || !user) return <Navigate to="/auth/login" replace />
  if (user.role !== 'warehouse' && user.role !== 'admin') {
    return <Navigate to="/" replace />
  }
  return children
}
