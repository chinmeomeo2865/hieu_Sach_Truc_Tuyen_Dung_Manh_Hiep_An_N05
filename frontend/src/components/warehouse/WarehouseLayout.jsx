import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

const NAV = [
  {
    label: 'Tổng quan',
    items: [{
      to: '/warehouse', label: 'Dashboard',
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
      end: true,
    }],
  },
  {
    label: 'Kho hàng',
    items: [
      {
        to: '/warehouse/inventory', label: 'Tồn kho',
        icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>,
      },
      {
        to: '/warehouse/audit', label: 'Kiểm kê',
        icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"/></svg>,
      },
    ],
  },
  {
    label: 'Đơn hàng',
    items: [
      {
        to: '/warehouse/orders', label: 'Xử lý đơn',
        icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"/></svg>,
      },
      {
        to: '/warehouse/returns', label: 'Hoàn / Hủy',
        icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>,
      },
    ],
  },
  {
    label: 'Lịch sử',
    items: [{
      to: '/warehouse/activity', label: 'Nhật ký thao tác',
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
    }],
  },
]

export default function WarehouseLayout({ children, title }) {
  const user     = useAuthStore(s => s.user)
  const logout   = useAuthStore(s => s.logout)
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex bg-surface-warm font-sans antialiased text-ink">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-white border-r border-divider-lt flex flex-col fixed inset-y-0 left-0 z-30">
        {/* Logo */}
        <div className="px-5 pt-5 pb-4 border-b border-divider-lt">
          <p className="font-display text-[14px] font-semibold text-ink leading-tight">
            Hiệu Sách <span className="italic font-display font-medium text-accent">Chin</span>
          </p>
          <p className="text-[9px] tracking-widest uppercase text-muted font-bold mt-1">Thủ kho</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {NAV.map(group => (
            <div key={group.label}>
              <p className="px-3 mb-1.5 text-[9px] font-bold tracking-widest uppercase text-subtle">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-ink text-white shadow-card'
                          : 'text-ink-80 hover:bg-surface-subtle hover:text-ink'
                      }`
                    }
                  >
                    <span className="opacity-80 group-hover:opacity-100 transition-opacity">{item.icon}</span>
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User profile & controls */}
        <div className="px-3 pb-4 border-t border-divider-lt pt-3 space-y-0.5 bg-surface-warm/50">
          <div className="px-3 py-2">
            <p className="text-[12.5px] font-semibold text-ink truncate leading-tight">{user?.name}</p>
            <p className="text-[10px] text-muted capitalize font-medium">{user?.role}</p>
          </div>
          <Link
            to="/"
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[12px] text-ink-80 hover:text-ink hover:bg-surface-subtle transition-all duration-200"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
            Xem cửa hàng
          </Link>
          <button
            onClick={() => { logout(); navigate('/auth/login') }}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[12px] text-ink-80 hover:text-ink hover:bg-surface-subtle transition-all duration-200"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 ml-56 min-h-screen flex flex-col">
        <header className="h-14 bg-white border-b border-divider-lt flex items-center justify-end px-6 sticky top-0 z-20 shrink-0">
          <span className="text-[11px] text-muted font-semibold tracking-wide">
            {new Date().toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
          </span>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
