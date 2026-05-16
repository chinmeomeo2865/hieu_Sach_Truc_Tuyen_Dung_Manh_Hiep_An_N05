import { useEffect, useState } from 'react'
import { Link }               from 'react-router-dom'
import { useWishlistStore }   from '../store/wishlistStore'
import { useToastStore }      from '../store/toastStore'
import { useCartStore }       from '../store/cartStore'
import { api }                from '../services/api'
import { formatPrice }        from '../utils/format'

export default function WishlistPage() {
  const ids        = useWishlistStore(s => s.ids)
  const toggle     = useWishlistStore(s => s.toggle)
  const addItem    = useCartStore(s => s.addItem)
  const showToast  = useToastStore(s => s.show)

  const [books, setBooks]     = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (ids.length === 0) { setBooks([]); return }
    setLoading(true)
    Promise.all(ids.map(id => api.get(`/api/products/${id}`).then(r => r.data).catch(() => null)))
      .then(results => setBooks(results.filter(Boolean)))
      .finally(() => setLoading(false))
  }, [ids.join(',')])

  if (ids.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-2xs font-semibold tracking-label-2xl uppercase text-accent">Yêu thích</p>
        <h1 className="font-display text-2xl font-semibold text-ink">Chưa có sách yêu thích</h1>
        <p className="text-sm text-muted">Nhấn ❤ trên bất kỳ cuốn sách nào để thêm vào đây.</p>
        <Link to="/books" className="mt-2 text-xs font-semibold tracking-label uppercase text-ink underline underline-offset-4 hover:opacity-60 transition-opacity">
          Khám phá sách →
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10 py-10 md:py-14">
      <div className="mb-8">
        <p className="text-2xs font-semibold tracking-label-2xl uppercase text-accent mb-1">Tài khoản</p>
        <h1 className="font-display text-2xl md:text-3xl font-semibold text-ink">
          Danh sách yêu thích
          <span className="ml-3 text-base font-normal text-muted">({ids.length} cuốn)</span>
        </h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {ids.map(id => (
            <div key={id} className="aspect-book bg-surface-subtle rounded-sm animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {books.map(book => (
            <div key={book._id} className="group flex flex-col border border-divider-lt rounded-sm overflow-hidden hover:shadow-card-h hover:border-divider transition-all duration-300">
              <Link to={`/books/${book._id}`} className="block aspect-book bg-surface-subtle overflow-hidden">
                <img
                  src={book.image}
                  alt={book.title}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                />
              </Link>
              <div className="p-3 flex flex-col gap-2 flex-1">
                <div className="flex-1">
                  <p className="text-2xs text-accent font-semibold tracking-label uppercase mb-1">{book.category}</p>
                  <Link to={`/books/${book._id}`} className="font-display text-sm font-semibold text-ink leading-snug line-clamp-2 hover:opacity-70 transition-opacity">
                    {book.title}
                  </Link>
                  <p className="text-xs text-muted mt-0.5">{book.author}</p>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-semibold text-ink">{formatPrice(book.price)}</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => { addItem({ ...book, id: book._id }); showToast({ message: `Đã thêm "${book.title}" vào giỏ`, type: 'success' }) }}
                      className="text-[10px] font-semibold tracking-label uppercase bg-ink text-white px-2.5 py-1.5 rounded-sm hover:bg-ink-80 transition-colors"
                    >
                      + Giỏ
                    </button>
                    <button
                      onClick={() => { toggle(book._id); showToast({ message: 'Đã xóa khỏi yêu thích', type: 'info' }) }}
                      className="w-7 h-7 flex items-center justify-center border border-divider rounded-sm text-red-400 hover:border-red-300 transition-colors"
                      aria-label="Xóa khỏi yêu thích"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
