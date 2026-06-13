import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useNavbar }         from '../../hooks/useNavbar'
import { useCartStore }      from '../../store/cartStore'
import { useWishlistStore }  from '../../store/wishlistStore'
import { useUIStore }        from '../../store/uiStore'
import { useAuthStore }      from '../../store/authStore'
import { useNotificationStore } from '../../store/notificationStore'
import { MobileMenu }        from './MobileMenu'
import { SearchIcon, HeartIcon, CartIcon, UserIcon, MenuIcon, ArrowUpIcon } from '../ui/icons'

function NavLink({ href, children }) {
  const cls = "relative text-[11px] font-medium tracking-label uppercase text-muted pb-0.5 transition-colors hover:text-ink group"
  const underline = <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-ink scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100" />
  if (href.startsWith('/#')) {
    return <a href={href} className={cls}>{children}{underline}</a>
  }
  return <Link to={href} className={cls}>{children}{underline}</Link>
}

function IconBtn({ label, onClick, children, badge }) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="relative w-9 h-9 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-surface-subtle transition-colors"
    >
      {children}
      {badge > 0 && (
        <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-accent text-white text-[9px] font-bold flex items-center justify-center leading-none">
          {badge}
        </span>
      )}
    </button>
  )
}

export function Navbar({ links = [], categories = [] }) {
  const { scrolled, backTopVisible } = useNavbar()
  const [menuOpen, setMenuOpen]      = useState(false)

  /* Live counts from stores */
  const cartCount      = useCartStore(s => s.items.reduce((n, i) => n + i.qty, 0))
  const wishlistCount  = useWishlistStore(s => s.ids.length)
  const openSearch     = useUIStore(s => s.openSearch)
  const openAuthPrompt = useUIStore(s => s.openAuthPrompt)
  const user           = useAuthStore(s => s.user)
  const token          = useAuthStore(s => s.token)
  const logout         = useAuthStore(s => s.logout)
  const clearCart      = useCartStore(s => s.clear)
  const navigate       = useNavigate()

  const unreadCount  = useNotificationStore(s => s.unread)
  const setUnread    = useNotificationStore(s => s.setUnread)
  const fetchUnread  = useNotificationStore(s => s.fetchUnread)
  useEffect(() => {
    if (!token) { setUnread(0); return }
    fetchUnread()
  }, [token])

  function handleLogout() {
    logout()
    clearCart()
    navigate('/')
  }

  return (
    <>
      <nav
        role="navigation"
        aria-label="Thanh điều hướng chính"
        className={`bg-white border-b border-divider-lt transition-shadow duration-300 ${scrolled ? 'shadow-nav' : ''}`}
      >
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="h-16 grid grid-cols-[1fr_auto_1fr] items-center gap-6">

            {/* Left links */}
            <nav className="hidden md:flex items-center gap-6" aria-label="Menu chính">
              {links.map(({ href, label }) => (
                <NavLink key={href} href={href}>{label}</NavLink>
              ))}
            </nav>

            {/* Logo */}
            <Link to="/" className="font-display text-[1.45rem] font-semibold tracking-[0.03em] text-ink text-center whitespace-nowrap">
              Hiệu Sách <em className="italic font-medium">Chin</em>
            </Link>

            {/* Right actions */}
            <div className="flex items-center gap-1 justify-end">
              <IconBtn label="Tìm kiếm" onClick={openSearch}>
                <SearchIcon className="w-[18px] h-[18px]" />
              </IconBtn>

              {token && (
                <Link to="/notifications" aria-label={`Thông báo${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
                  className="relative w-9 h-9 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-surface-subtle transition-colors">
                  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-accent text-white text-[9px] font-bold flex items-center justify-center leading-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              )}

              {token ? (
                <Link to="/account/wishlist" aria-label={`Yêu thích (${wishlistCount})`} className="relative w-9 h-9 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-surface-subtle transition-colors">
                  <HeartIcon className="w-[17px] h-[17px]" />
                  {wishlistCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-accent text-white text-[9px] font-bold flex items-center justify-center leading-none">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              ) : (
                <button
                  onClick={() => openAuthPrompt({ message: 'Đăng nhập để xem và lưu sách yêu thích.' })}
                  aria-label="Yêu thích"
                  className="relative w-9 h-9 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-surface-subtle transition-colors"
                >
                  <HeartIcon className="w-[17px] h-[17px]" />
                </button>
              )}

              <Link to="/cart" aria-label={`Giỏ hàng (${cartCount})`} className="relative w-9 h-9 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-surface-subtle transition-colors">
                <CartIcon className="w-[18px] h-[18px]" />
                {cartCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-accent text-white text-[9px] font-bold flex items-center justify-center leading-none">
                    {cartCount}
                  </span>
                )}
              </Link>

              {user ? (
                <div className="relative group hidden md:block ml-1">
                  {/* Dropdown Trigger: User Pill */}
                  <button 
                    type="button"
                    className="flex items-center gap-2 pl-2 pr-3 py-1 bg-white border border-divider hover:border-ink hover:bg-surface-warm rounded-full text-[11px] font-semibold tracking-wide text-ink transition-all shadow-2xs hover:shadow-xs"
                  >
                    <div className="w-6 h-6 rounded-full bg-ink text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 select-none">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="max-w-[90px] truncate normal-case">{user.name}</span>
                    {user.role && user.role !== 'customer' && (
                      <span className="px-1.5 py-0.5 bg-surface-subtle border border-divider-lt rounded-full text-[8px] font-bold text-muted uppercase tracking-wider shrink-0 select-none">
                        {user.role === 'admin' ? 'ADMIN' : user.role === 'product_manager' ? 'PM' : 'KHO'}
                      </span>
                    )}
                    <svg className="w-3 h-3 text-muted transition-transform duration-300 group-hover:rotate-180 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>

                  {/* Dropdown Popover */}
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2.5 w-60 bg-white border border-divider-lt rounded-xl shadow-lg py-1.5 hidden group-hover:block hover:block z-[99] animate-fadeIn">
                    {/* Tooltip Caret Pointer */}
                    <div className="absolute left-1/2 -translate-x-1/2 -top-1.5 w-3 h-3 rotate-45 bg-white border-t border-l border-divider-lt z-[-1]" />

                    {/* Header */}
                    <div className="px-4 py-2.5 border-b border-divider-lt/60">
                      <p className="text-[9px] text-muted uppercase font-bold tracking-wider font-sans">Tài khoản của tôi</p>
                    </div>

                    {/* Navigation Options */}
                    <div className="py-1">
                      {/* Dynamic Staff Panel Link */}
                      {user.role && user.role !== 'customer' && (
                        <Link 
                          to={user.role === 'admin' ? '/admin/orders' : user.role === 'product_manager' ? '/pm' : '/warehouse'} 
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#FAF8F5] transition-colors group"
                        >
                          <div className="w-7 h-7 rounded-lg border border-divider-lt flex items-center justify-center bg-[#FAF8F5] group-hover:bg-white group-hover:border-divider transition-all shrink-0">
                            <svg className="w-3.5 h-3.5 text-ink-60 group-hover:text-ink transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-semibold text-ink leading-snug font-sans">
                              {user.role === 'admin' ? 'Trang quản trị' : user.role === 'product_manager' ? 'Trang quản lý' : 'Trang thủ kho'}
                            </p>
                            <p className="text-[9.5px] text-muted leading-tight mt-0.5 font-sans">
                              {user.role === 'admin' ? 'Quản lý sách & đơn hàng' : user.role === 'product_manager' ? 'Quản lý danh mục & sách' : 'Quản lý nhập xuất kho'}
                            </p>
                          </div>
                        </Link>
                      )}

                      {/* Personal profile */}
                      <Link to="/account/profile" className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#FAF8F5] transition-colors group">
                        <div className="w-7 h-7 rounded-lg border border-divider-lt flex items-center justify-center bg-[#FAF8F5] group-hover:bg-white group-hover:border-divider transition-all shrink-0">
                          <svg className="w-3.5 h-3.5 text-ink-60 group-hover:text-ink transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-semibold text-ink leading-snug font-sans">Hồ sơ cá nhân</p>
                          <p className="text-[9.5px] text-muted leading-tight mt-0.5 font-sans">Thông tin cá nhân & mật khẩu</p>
                        </div>
                      </Link>

                      {/* Orders list */}
                      <Link to="/account" className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#FAF8F5] transition-colors group">
                        <div className="w-7 h-7 rounded-lg border border-divider-lt flex items-center justify-center bg-[#FAF8F5] group-hover:bg-white group-hover:border-divider transition-all shrink-0">
                          <svg className="w-3.5 h-3.5 text-ink-60 group-hover:text-ink transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-semibold text-ink leading-snug font-sans">Đơn hàng của tôi</p>
                          <p className="text-[9.5px] text-muted leading-tight mt-0.5 font-sans">Lịch sử & theo dõi đơn hàng</p>
                        </div>
                      </Link>

                      {/* Wishlist */}
                      <Link to="/account/wishlist" className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#FAF8F5] transition-colors group">
                        <div className="w-7 h-7 rounded-lg border border-divider-lt flex items-center justify-center bg-[#FAF8F5] group-hover:bg-white group-hover:border-divider transition-all shrink-0">
                          <HeartIcon className="w-3.5 h-3.5 text-ink-60 group-hover:text-ink transition-colors shrink-0" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-semibold text-ink leading-snug font-sans">Tủ sách của tôi</p>
                          <p className="text-[9.5px] text-muted leading-tight mt-0.5 font-sans">Danh sách sách yêu thích</p>
                        </div>
                      </Link>
                    </div>

                    {/* Logout Trigger */}
                    <div className="border-t border-divider-lt/60 pt-1.5 mt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50/20 transition-colors text-left group"
                      >
                        <div className="w-7 h-7 rounded-lg border border-divider-lt flex items-center justify-center bg-[#FAF8F5] group-hover:bg-white group-hover:border-red-200 transition-all shrink-0">
                          <svg className="w-3.5 h-3.5 text-red-500 group-hover:text-red-700 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-semibold text-red-600 leading-snug font-sans">Đăng xuất</p>
                          <p className="text-[9.5px] text-red-400/80 leading-tight mt-0.5 font-sans">Thoát khỏi tài khoản</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  to="/auth/login"
                  className="hidden md:flex items-center gap-1.5 ml-1 px-3.5 py-1.5 border border-divider rounded text-[11px] font-medium tracking-[0.08em] uppercase text-ink-60 hover:border-ink hover:text-ink transition-colors"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  Đăng nhập
                </Link>
              )}

              <button
                className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center text-ink hover:bg-surface-subtle transition-colors"
                onClick={() => setMenuOpen(true)}
                aria-label="Mở menu"
                aria-expanded={menuOpen}
              >
                <MenuIcon />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} links={links} categories={categories} user={user} onLogout={handleLogout} />

      {/* Back to top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Về đầu trang"
        className={`fixed bottom-6 right-6 z-[99] w-10 h-10 rounded-lg bg-ink text-white flex items-center justify-center shadow-md transition-all duration-300 hover:bg-ink-80 ${backTopVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'}`}
      >
        <ArrowUpIcon />
      </button>
    </>
  )
}
