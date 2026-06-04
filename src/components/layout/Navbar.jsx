import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useNavbar }         from '../../hooks/useNavbar'
import { useCartStore }      from '../../store/cartStore'
import { useWishlistStore }  from '../../store/wishlistStore'
import { useUIStore }        from '../../store/uiStore'
import { useAuthStore }      from '../../store/authStore'
import { MobileMenu }        from './MobileMenu'
import { SearchIcon, HeartIcon, CartIcon, UserIcon, MenuIcon, ArrowUpIcon } from '../ui/icons'
import { api }               from '../../services/api'

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
  const user           = useAuthStore(s => s.user)
  const token          = useAuthStore(s => s.token)
  const logout         = useAuthStore(s => s.logout)
  const clearCart      = useCartStore(s => s.clear)
  const navigate       = useNavigate()

  const [unreadCount, setUnreadCount] = useState(0)
  useEffect(() => {
    if (!token) { setUnreadCount(0); return }
    api.get('/api/notifications')
      .then(r => setUnreadCount(r.unreadCount || 0))
      .catch(() => {})
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
        className={`sticky top-0 z-[100] bg-white/96 backdrop-blur-xl border-b border-divider-lt transition-shadow duration-300 ${scrolled ? 'shadow-nav' : ''}`}
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

              <Link to="/account/wishlist" aria-label={`Yêu thích (${wishlistCount})`} className="relative w-9 h-9 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-surface-subtle transition-colors">
                <HeartIcon className="w-[17px] h-[17px]" />
                {wishlistCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-accent text-white text-[9px] font-bold flex items-center justify-center leading-none">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              <Link to="/cart" aria-label={`Giỏ hàng (${cartCount})`} className="relative w-9 h-9 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-surface-subtle transition-colors">
                <CartIcon className="w-[18px] h-[18px]" />
                {cartCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-accent text-white text-[9px] font-bold flex items-center justify-center leading-none">
                    {cartCount}
                  </span>
                )}
              </Link>

              {user ? (
                <div className="hidden md:flex items-center gap-2 ml-1">
                  {user.role === 'admin' && (
                    <Link
                      to="/admin/orders"
                      className="px-2.5 py-1 border border-ink/25 rounded-sm text-[10px] font-semibold tracking-label uppercase text-ink-60 hover:border-ink hover:text-ink transition-colors"
                    >
                      Admin
                    </Link>
                  )}
                  {user.role === 'product_manager' && (
                    <Link
                      to="/pm"
                      className="px-2.5 py-1 border border-ink/25 rounded-sm text-[10px] font-semibold tracking-label uppercase text-ink-60 hover:border-ink hover:text-ink transition-colors"
                    >
                      PM Panel
                    </Link>
                  )}
                  {user.role === 'warehouse' && (
                    <Link
                      to="/warehouse"
                      className="px-2.5 py-1 border border-ink/25 rounded-sm text-[10px] font-semibold tracking-label uppercase text-ink-60 hover:border-ink hover:text-ink transition-colors"
                    >
                      Kho
                    </Link>
                  )}
                  <Link
                    to="/account"
                    className="text-[11px] font-medium text-ink-60 max-w-[100px] truncate hover:text-ink transition-colors"
                  >
                    {user.name}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 border border-divider rounded text-[11px] font-medium tracking-[0.08em] uppercase text-ink-60 hover:border-ink hover:text-ink transition-colors"
                  >
                    Đăng xuất
                  </button>
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
