import { useState, useEffect }             from 'react'
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { useAuthStore }                 from '../../store/authStore'
import { api }                          from '../../services/api'

function AvatarCircle({ name, size = 'lg' }) {
  const letter = name?.charAt(0)?.toUpperCase() || '?'
  const sz = { lg: 'w-16 h-16 text-xl', md: 'w-10 h-10 text-sm', sm: 'w-8 h-8 text-xs' }[size]
  return (
    <div className={`${sz} rounded-full bg-ink text-white flex items-center justify-center font-display font-bold flex-shrink-0 select-none`}>
      {letter}
    </div>
  )
}

export function AccountLayout() {
  const user = useAuthStore(s => s.user)
  const isAuth = useAuthStore(s => !!s.token)
  const logout = useAuthStore(s => s.logout)
  const navigate = useNavigate()
  const location = useLocation()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuth) {
      navigate('/auth/login', { replace: true, state: { from: location.pathname } })
      return
    }
    api.get('/api/orders')
      .then(res => setOrders(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isAuth, navigate])

  if (!isAuth) return null

  const menuItems = [
    {
      to: '/account/profile',
      emoji: '👤',
      label: 'Hồ sơ cá nhân',
      isActive: location.pathname === '/account/profile'
    },
    {
      to: '/account',
      emoji: '📋',
      label: 'Đơn hàng của tôi',
      isActive: location.pathname === '/account' || location.pathname === '/account/orders'
    },
    {
      to: '/account/addresses',
      emoji: '📍',
      label: 'Sổ địa chỉ',
      isActive: location.pathname === '/account/addresses'
    },
    {
      to: '/account/wishlist',
      emoji: '📚',
      label: 'Tủ sách của tôi',
      isActive: location.pathname === '/account/wishlist'
    }
  ]

  const orderCount = orders.length
  const deliveredCount = orders.filter(o => o.status === 'DELIVERED').length
  const cancelledCount = orders.filter(o => o.status === 'CANCELLED').length

  const handleLogoutClick = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-surface-warm">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* ── Sidebar ─────────────────────────────────────────── */}
          <aside className="w-full lg:w-[260px] flex-shrink-0 space-y-4">
            
            {/* Profile Card */}
            <div className="bg-white rounded-2xl border border-divider-lt p-6 shadow-sm">
              {/* Avatar + Info */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <AvatarCircle name={user?.name} size="lg" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-display font-semibold text-ink leading-tight truncate">{user?.name}</p>
                  <p className="text-xs text-muted mt-0.5 truncate">{user?.email}</p>
                  {user?.phone && (
                    <p className="text-xs text-subtle mt-0.5 truncate">{user.phone}</p>
                  )}
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-surface-warm rounded-xl">
                {[
                  { label: 'Đơn hàng', value: loading ? '...' : orderCount },
                  { label: 'Đã giao',  value: loading ? '...' : deliveredCount },
                  { label: 'Đã hủy',   value: loading ? '...' : cancelledCount },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <p className="font-display font-bold text-ink text-lg leading-none">{s.value}</p>
                    <p className="text-[10px] text-muted mt-0.5 leading-tight">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="bg-white rounded-2xl border border-divider-lt overflow-hidden p-2 space-y-1 shadow-sm">
              {menuItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                    item.isActive
                      ? 'bg-surface-subtle border border-divider-lt text-ink font-semibold'
                      : 'text-ink-60 hover:text-ink hover:bg-surface-warm border border-transparent'
                  }`}
                >
                  <span className="text-base">{item.emoji}</span>
                  <span className="flex-1 text-sm font-medium">{item.label}</span>
                  <svg
                    className={`w-3.5 h-3.5 transition-colors ${
                      item.isActive ? 'text-ink' : 'text-subtle group-hover:text-ink'
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              ))}
              
              <div className="border-t border-divider-lt/60 my-1 pt-1" />
              
              <Link
                to="/support"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-ink-60 hover:text-ink hover:bg-surface-warm border border-transparent transition-all group"
              >
                <span className="text-base">💬</span>
                <span className="flex-1 text-sm font-medium">Liên hệ hỗ trợ</span>
                <svg className="w-3.5 h-3.5 text-subtle group-hover:text-ink transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            </nav>

            {/* Logout Button */}
            <button
              onClick={handleLogoutClick}
              className="w-full py-3 rounded-2xl border border-divider-lt bg-white text-sm font-semibold text-muted hover:text-red-500 hover:border-red-200 hover:bg-red-50/30 transition-all shadow-sm"
            >
              Đăng xuất
            </button>
          </aside>

          {/* ── Main Content Area ───────────────────────────────── */}
          <div className="flex-1 min-w-0 bg-white rounded-2xl border border-divider-lt p-6 md:p-8 shadow-sm">
            <Outlet />
          </div>

        </div>
      </div>
    </div>
  )
}
