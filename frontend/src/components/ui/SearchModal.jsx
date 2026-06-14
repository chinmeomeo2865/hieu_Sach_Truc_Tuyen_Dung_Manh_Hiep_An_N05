import { useState, useEffect, useRef } from 'react'
import { useUIStore }    from '../../store/uiStore'
import { useCartStore }  from '../../store/cartStore'
import { useToastStore } from '../../store/toastStore'
import { useAuthStore }  from '../../store/authStore'
import { FILTER_TABS }   from '../../data/books'
import { useProducts }   from '../../hooks/useProducts'
import { CloseIcon, SearchIcon, PlusIcon } from './icons'
import { formatPrice }   from '../../utils/format'

export function SearchModal() {
  const open         = useUIStore(s => s.searchOpen)
  const close        = useUIStore(s => s.closeSearch)
  const openQuickView = useUIStore(s => s.openQuickView)
  const openAuthPrompt = useUIStore(s => s.openAuthPrompt)
  const addItem      = useCartStore(s => s.addItem)
  const showToast    = useToastStore(s => s.show)
  const isAuthed     = useAuthStore(s => !!s.token)

  const [query,     setQuery]     = useState('')
  const [debounced, setDebounced] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const inputRef = useRef(null)

  /* Focus input + lock scroll when open */
  useEffect(() => {
    if (open) {
      setQuery('')
      setDebounced('')
      setActiveTab('all')
      setTimeout(() => inputRef.current?.focus(), 60)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  /* Debounce query → tránh gọi API mỗi lần gõ phím */
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300)
    return () => clearTimeout(t)
  }, [query])

  /* Escape to close */
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close])

  /* Data thật từ API (giống trang /books), fallback static nếu lỗi */
  const { products: results, loading } = useProducts({
    category: activeTab,
    search: debounced,
    limit: 50,
  })

  const handleAddCart = (e, book) => {
    e.stopPropagation()
    if (!isAuthed) {
      close()
      openAuthPrompt({ message: 'Đăng nhập để thêm sách vào giỏ hàng.' })
      return
    }
    addItem(book)
    showToast({ message: `Đã thêm "${book.title}" vào giỏ hàng` })
  }

  const handleOpenBook = (book) => {
    openQuickView(book)
    close()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[300] flex flex-col items-center pt-16 px-4 pb-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
        onClick={close}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Tìm kiếm sách"
        className="relative w-full max-w-2xl bg-white rounded-xl shadow-elevated overflow-hidden flex flex-col max-h-[78vh]"
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-divider-lt">
          <SearchIcon className="w-5 h-5 text-muted flex-shrink-0" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Tìm kiếm sách, tác giả..."
            className="flex-1 text-base font-sans text-ink placeholder-subtle outline-none bg-transparent"
            aria-label="Tìm kiếm"
          />
          <button
            onClick={close}
            aria-label="Đóng tìm kiếm"
            className="text-muted hover:text-ink transition-colors"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 px-5 py-3 border-b border-divider-lt overflow-x-auto scrollbar-hide">
          {FILTER_TABS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setActiveTab(value)}
              className={`flex-shrink-0 px-3 py-1 rounded-full border text-2xs font-semibold tracking-label uppercase transition-all ${activeTab === value ? 'bg-ink text-white border-ink' : 'border-divider-lt text-muted hover:border-ink hover:text-ink'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <p className="font-display text-lg font-medium text-muted">Đang tìm…</p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <p className="font-display text-lg font-medium text-muted">Không tìm thấy kết quả</p>
              <p className="text-sm text-subtle mt-1">Thử từ khóa khác hoặc duyệt theo danh mục</p>
            </div>
          ) : (
            <>
              <ul>
                {results.map(book => (
                  <li key={book._id || book.id} className="border-b border-divider-lt last:border-0">
                    <button
                      onClick={() => handleOpenBook(book)}
                      className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-surface-warm transition-colors text-left group"
                    >
                      {/* Thumbnail */}
                      <div className="w-10 h-14 rounded overflow-hidden bg-surface-subtle flex-shrink-0">
                        <img
                          src={book.image}
                          alt=""
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <p className="text-[9px] font-semibold tracking-label-lg uppercase text-accent leading-none">{book.category}</p>
                          <span className={`text-[8px] font-semibold px-1 py-0.2 rounded leading-none ${
                            book.stock > 10 ? 'text-green-700 bg-green-50' :
                            book.stock > 0 ? 'text-amber-700 bg-amber-50' :
                            'text-red-600 bg-red-50'
                          }`}>
                            {book.stock > 10 ? 'Còn hàng' : book.stock > 0 ? `Còn ${book.stock}` : 'Hết hàng'}
                          </span>
                        </div>
                        <p className="text-sm font-display font-semibold text-ink leading-snug truncate">{book.title}</p>
                        <p className="text-xs text-muted">{book.author}</p>
                        <p className="text-sm font-bold text-ink mt-0.5">{formatPrice(book.price)}</p>
                      </div>

                      {/* Add to cart */}
                      <button
                        onClick={(e) => handleAddCart(e, book)}
                        disabled={book.stock <= 0}
                        aria-label={book.stock <= 0 ? 'Hết hàng' : `Thêm ${book.title} vào giỏ`}
                        className="flex-shrink-0 w-8 h-8 rounded-lg bg-ink text-white flex items-center justify-center hover:bg-ink-80 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <PlusIcon />
                      </button>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="text-center text-xs text-subtle py-2.5">
                {results.length} kết quả
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
