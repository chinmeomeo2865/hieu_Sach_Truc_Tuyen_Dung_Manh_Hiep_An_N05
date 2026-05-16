import { useEffect } from 'react'
import { CloseIcon }  from '../ui/icons'

export function MobileMenu({ isOpen, onClose, links = [], categories = [] }) {
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

        <div className="px-6 py-5 border-t border-divider-lt flex gap-3">
          <a href="#" className="flex-1 text-center py-2.5 border border-divider-lt rounded text-[11px] font-semibold tracking-label uppercase text-muted hover:border-ink hover:text-ink transition-colors">
            Đăng nhập
          </a>
          <a href="#" className="flex-1 text-center py-2.5 bg-ink rounded text-[11px] font-semibold tracking-label uppercase text-white hover:bg-ink-80 transition-colors">
            Đăng ký
          </a>
        </div>
      </div>
    </>
  )
}
