import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export default function AdminRoute({ children }) {
  const token = useAuthStore(s => s.token)
  const user  = useAuthStore(s => s.user)

  if (!token)                 return <Navigate to="/auth/login" replace />
  if (user?.role !== 'admin') return <Navigate to="/auth/login" replace />

  return children
}
