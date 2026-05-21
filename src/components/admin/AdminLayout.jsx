import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuthStore }         from '../../store/authStore'

const NAV = [
  {
    to: '/admin/orders',
    label: 'Đơn hàng',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    to: '/admin/products',
    label: 'Sách',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    to: '/admin/users',
    label: 'Khách hàng',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
]

export default function AdminLayout({ children, title }) {
  const user     = useAuthStore(s => s.user)
  const logout   = useAuthStore(s => s.logout)
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen flex bg-surface-warm">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-ink flex flex-col fixed inset-y-0 left-0 z-30">
        {/* Logo */}
        <div className="px-5 py-6 border-b border-white/10">
          <p className="font-display text-base font-semibold text-white leading-tight">
            Hiệu Sách <em className="italic font-medium">Chin</em>
          </p>
          <p className="text-[10px] tracking-label-lg uppercase text-white/40 mt-0.5">
            Quản trị viên
          </p>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-semibold tracking-label transition-colors duration-150 ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-white/50 hover:bg-white/8 hover:text-white/80'
                }`
              }
            >
              {icon}
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Back to storefront */}
        <div className="px-3 pb-2">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-xs font-semibold tracking-label text-white/40 hover:bg-white/8 hover:text-white/70 transition-colors duration-150"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Về trang chủ
          </Link>
        </div>

        {/* User info + logout */}
        <div className="px-4 py-4 border-t border-white/10">
          <p className="text-xs font-medium text-white truncate mb-0.5">{user?.name}</p>
          <p className="text-[10px] text-white/40 truncate mb-3">{user?.email}</p>
          <button
            onClick={handleLogout}
            className="w-full text-left text-[11px] text-white/50 hover:text-white transition-colors duration-150 flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 ml-56 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-divider-lt flex items-center justify-between px-6 shrink-0">
          <h1 className="font-display text-base font-semibold text-ink">{title}</h1>
          <span className="text-xs text-muted">
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
