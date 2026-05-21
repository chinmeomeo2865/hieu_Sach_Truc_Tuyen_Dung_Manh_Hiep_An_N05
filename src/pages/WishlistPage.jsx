import { useEffect, useState } from 'react'
import { Link }                from 'react-router-dom'
import { useWishlistStore }    from '../store/wishlistStore'
import { useToastStore }       from '../store/toastStore'
import { api }                 from '../services/api'
import { BookCard }            from '../components/ui/BookCard'

export default function WishlistPage() {
  const ids       = useWishlistStore(s => s.ids)
  const clearAll  = useWishlistStore(s => s.clearAll)
  const showToast = useToastStore(s => s.show)

  const [books, setBooks]     = useState([])
  const [loading, setLoading] = useState(false)

  // Fetch lần đầu khi ids có dữ liệu
  useEffect(() => {
    if (ids.length === 0) { setBooks([]); return }
    setLoading(true)
    Promise.all(
      ids.map(id => api.get(`/api/products/${id}`).then(r => r.data).catch(() => null))
    )
      .then(results => setBooks(results.filter(Boolean)))
      .finally(() => setLoading(false))
  }, []) // chỉ fetch lần đầu

  // Khi ids thay đổi (xóa khỏi wishlist) → lọc local, không refetch
  useEffect(() => {
    setBooks(prev => prev.filter(b => ids.includes(b._id || b.id)))
  }, [ids])

  function handleClearAll() {
    if (!confirm('Xóa tất cả sách khỏi danh sách yêu thích?')) return
    clearAll()
    showToast({ message: 'Đã xóa tất cả sách yêu thích', type: 'info' })
  }

  /* Empty state */
  if (!loading && ids.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-surface-subtle flex items-center justify-center mb-2">
          <svg className="w-7 h-7 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </div>
        <p className="text-2xs font-semibold tracking-label-2xl uppercase text-accent">Yêu thích</p>
        <h1 className="font-display text-2xl font-semibold text-ink">Chưa có sách yêu thích</h1>
        <p className="text-sm text-muted max-w-xs">
          Bấm ❤ trên bất kỳ cuốn sách nào để lưu vào đây và đọc lại sau.
        </p>
        <Link
          to="/books"
          className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-ink text-white text-2xs font-semibold tracking-label uppercase rounded-sm hover:bg-ink-80 transition-colors"
        >
          Khám phá sách →
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10 py-10 md:py-14">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-2xs font-semibold tracking-label-2xl uppercase text-accent mb-1">Tài khoản</p>
          <h1 className="font-display text-2xl md:text-3xl font-semibold text-ink">
            Danh sách yêu thích
            {!loading && (
              <span className="ml-3 text-base font-normal text-muted">({books.length} cuốn)</span>
            )}
          </h1>
        </div>
        {books.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-xs text-muted hover:text-red-500 underline underline-offset-2 transition-colors"
          >
            Xóa tất cả
          </button>
        )}
      </div>

      {/* Loading skeleton */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {ids.map(id => (
            <div key={id} className="flex flex-col gap-3">
              <div className="aspect-book bg-surface-subtle rounded-sm animate-pulse" />
              <div className="h-3 bg-surface-subtle rounded animate-pulse w-2/3" />
              <div className="h-3 bg-surface-subtle rounded animate-pulse w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {books.map(book => (
            <BookCard key={book._id || book.id} book={book} />
          ))}
        </div>
      )}

      {/* Link về trang sách */}
      {!loading && books.length > 0 && (
        <div className="mt-10 pt-8 border-t border-divider-lt text-center">
          <Link
            to="/books"
            className="text-xs font-semibold tracking-label uppercase text-muted hover:text-ink underline underline-offset-4 transition-colors"
          >
            ← Tiếp tục khám phá sách
          </Link>
        </div>
      )}
    </div>
  )
}
