import { useEffect } from 'react'
import { Link }       from 'react-router-dom'
import { CloseIcon }  from '../ui/icons'

export function MobileMenu({ isOpen, onClose, links = [], categories = [], user = null, onLogout }) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-[200] bg-ink/50 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu điều hướng"
        className={`fixed top-0 right-0 z-[201] h-full w-[min(320px,88vw)] bg-white flex flex-col shadow-elevated transition-transform duration-460 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-divider-lt">
          <span className="font-display text-lg font-semibold text-ink">
            Hiệu Sách <em className="italic font-medium">Chin</em>
          </span>
          <button onClick={onClose} aria-label="Đóng menu" className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:bg-surface-subtle hover:text-ink transition-colors">
            <CloseIcon />
          </button>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto" aria-label="Menu mobile">
          {links.map(({ href, label }) => (
            <a key={href} href={href} onClick={onClose} className="flex items-center px-6 py-3.5 text-sm font-medium text-ink-60 hover:text-ink hover:bg-surface-warm transition-colors">
              {label}
            </a>
          ))}

          {categories.length > 0 && (
            <>
              <div className="h-px bg-divider-lt mx-6 my-2" />
              <p className="px-6 py-2 text-[9px] font-semibold tracking-label-xl uppercase text-subtle">Danh mục sách</p>
              {categories.map((cat) => (
                <a key={cat} href="#" onClick={onClose} className="flex items-center px-6 py-2.5 text-sm text-ink-60 hover:text-ink hover:bg-surface-warm transition-colors">
                  {cat}
                </a>
              ))}
            </>
          )}
        </nav>

        <div className="px-6 py-5 border-t border-divider-lt">
          {user ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-ink truncate">{user.name}</p>
              {user.role === 'admin' && (
                <Link to="/admin/orders" onClick={onClose}
                  className="flex items-center gap-1.5 text-[11px] font-semibold tracking-label uppercase text-ink-60 hover:text-ink transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Admin Panel
                </Link>
              )}
              {user.role === 'product_manager' && (
                <Link to="/pm" onClick={onClose}
                  className="flex items-center gap-1.5 text-[11px] font-semibold tracking-label uppercase text-ink-60 hover:text-ink transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                  PM Panel
                </Link>
              )}
              {user.role === 'warehouse' && (
                <Link to="/warehouse" onClick={onClose}
                  className="flex items-center gap-1.5 text-[11px] font-semibold tracking-label uppercase text-ink-60 hover:text-ink transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                  Quản lý kho
                </Link>
              )}
              <Link
                to="/account"
                onClick={onClose}
                className="block text-[11px] font-medium text-ink-60 hover:text-ink transition-colors"
              >
                Tài khoản của tôi
              </Link>
              <Link
                to="/account/orders"
                onClick={onClose}
                className="block text-[11px] font-medium text-ink-60 hover:text-ink transition-colors"
              >
                Đơn hàng của tôi
              </Link>
              <button
                onClick={() => { onLogout?.(); onClose() }}
                className="w-full text-left text-[11px] font-semibold tracking-label uppercase text-muted hover:text-ink transition-colors"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <Link
                to="/auth/login"
                onClick={onClose}
                className="flex-1 text-center py-2.5 border border-divider-lt rounded text-[11px] font-semibold tracking-label uppercase text-muted hover:border-ink hover:text-ink transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                to="/auth/register"
                onClick={onClose}
                className="flex-1 text-center py-2.5 bg-ink rounded text-[11px] font-semibold tracking-label uppercase text-white hover:bg-ink-80 transition-colors"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
