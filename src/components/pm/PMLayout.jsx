import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

const NAV = [
  {
    label: 'Tổng quan',
    items: [{ to: '/pm', label: 'Dashboard', end: true, icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg> }],
  },
  {
    label: 'Sản phẩm',
    items: [
      { to: '/pm/categories', label: 'Danh mục', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg> },
      { to: '/pm/products',   label: 'Sách',     icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg> },
      { to: '/pm/visibility', label: 'Hiển thị', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg> },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { to: '/pm/promotions', label: 'Khuyến mãi', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/><path strokeLinecap="round" strokeLinejoin="round" d="M16 16h.01"/></svg> },
    ],
  },
  {
    label: 'Hệ thống',
    items: [
      { to: '/pm/activity', label: 'Nhật ký', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
    ],
  },
]

const linkCls = ({ isActive }) =>
  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] font-medium transition-colors ${isActive ? 'bg-white text-[#0f0f0f]' : 'text-white/50 hover:text-white/80 hover:bg-white/8'}`

export default function PMLayout({ children, title }) {
  const user     = useAuthStore(s => s.user)
  const logout   = useAuthStore(s => s.logout)
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex bg-[#f5f5f3]">
      <aside className="w-56 shrink-0 bg-[#0f0f0f] flex flex-col fixed inset-y-0 left-0 z-30">
        <div className="px-5 pt-5 pb-4 border-b border-white/8">
          <p className="font-display text-[14px] font-semibold text-white leading-tight">
            Hiệu Sách <em className="italic font-normal text-white/50">Chin</em>
          </p>
          <p className="text-[9px] tracking-widest uppercase text-blue-400/80 mt-1 font-semibold">Product Manager</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {NAV.map(group => (
            <div key={group.label}>
              <p className="px-3 mb-1.5 text-[9px] font-bold tracking-widest uppercase text-white/20">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map(item => (
                  <NavLink key={item.to} to={item.to} end={item.end} className={linkCls}>
                    {item.icon}{item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-3 pb-4 border-t border-white/8 pt-3 space-y-0.5">
          <div className="px-3 py-2">
            <p className="text-[12px] font-semibold text-white/80 truncate">{user?.name}</p>
            <p className="text-[10px] text-white/30 capitalize">{user?.role}</p>
          </div>
          <Link
            to="/"
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[12px] text-white/40 hover:text-white/70 hover:bg-white/6 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
            Xem cửa hàng
          </Link>
          <button onClick={() => { logout(); navigate('/auth/login') }}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[12px] text-white/40 hover:text-white/70 hover:bg-white/6 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            Đăng xuất
          </button>
        </div>
      </aside>

      <div className="flex-1 ml-56 min-h-screen flex flex-col">
        <header className="h-14 bg-white border-b border-[#ebebeb] flex items-center px-6 sticky top-0 z-20 shrink-0">
          <h1 className="text-[14px] font-semibold text-[#0f0f0f] tracking-tight">{title}</h1>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
