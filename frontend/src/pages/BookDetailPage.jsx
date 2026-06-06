import { useEffect, useState } from 'react'
import { useParams, Link }     from 'react-router-dom'
import { api }                 from '../services/api'
import { useCartStore }        from '../store/cartStore'
import { useWishlistStore }    from '../store/wishlistStore'
import { useToastStore }       from '../store/toastStore'
import { useUIStore }          from '../store/uiStore'
import { useAuthStore }        from '../store/authStore'
import { StarRating }          from '../components/ui/StarRating'
import { Badge }               from '../components/ui/Badge'
import { formatPrice }         from '../utils/format'

const StarPath = 'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z'

function Stars({ rating, size = 'sm' }) {
  const cls = size === 'lg' ? 'w-5 h-5' : size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5'
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <svg key={s} className={`${cls} flex-shrink-0 ${s <= Math.round(rating) ? 'text-star' : 'text-divider'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d={StarPath} />
        </svg>
      ))}
    </div>
  )
}

export default function BookDetailPage() {
  const { id } = useParams()

  const [book,          setBook]          = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [qty,           setQty]           = useState(1)
  const [reviews,       setReviews]       = useState([])
  const [reviewMeta,    setReviewMeta]    = useState({ page: 1, totalPages: 1, total: 0 })
  const [reviewLoading, setReviewLoading] = useState(false)

  const addItem    = useCartStore(s => s.addItem)
  const toggle     = useWishlistStore(s => s.toggle)
  const wishlisted = useWishlistStore(s => s.ids.includes(id))
  const showToast  = useToastStore(s => s.show)
  const openAuthPrompt = useUIStore(s => s.openAuthPrompt)
  const isAuthed   = useAuthStore(s => !!s.token)

  useEffect(() => {
    setLoading(true)
    setReviews([])
    setReviewMeta({ page: 1, totalPages: 1, total: 0 })

    api.get(`/api/products/${id}`)
      .then(res => setBook(res.data))
      .catch(() => setBook(null))
      .finally(() => setLoading(false))

    api.get(`/api/products/${id}/reviews?page=1&limit=10`)
      .then(res => {
        setReviews(res.data)
        setReviewMeta(res.pagination)
      })
      .catch(() => {})
  }, [id])

  async function loadMoreReviews() {
    const nextPage = reviewMeta.page + 1
    setReviewLoading(true)
    try {
      const res = await api.get(`/api/products/${id}/reviews?page=${nextPage}&limit=10`)
      setReviews(prev => [...prev, ...res.data])
      setReviewMeta(res.pagination)
    } catch {}
    finally { setReviewLoading(false) }
  }

  function handleAddCart() {
    if (!book) return
    if (!isAuthed) {
      openAuthPrompt({ message: 'Đăng nhập để thêm sách vào giỏ hàng.' })
      return
    }
    for (let i = 0; i < qty; i++) addItem({ ...book, id: book._id })
    showToast({ message: `Đã thêm "${book.title}" vào giỏ hàng` })
  }

  if (loading) {
    return (
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10 py-14">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-10">
          <div className="aspect-book bg-surface-subtle rounded-sm animate-pulse" />
          <div className="space-y-4">
            {[80, 40, 60, 100].map(w => (
              <div key={w} className="h-4 bg-surface-subtle rounded animate-pulse" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-muted">Không tìm thấy sách này</p>
        <Link to="/books" className="text-sm text-ink underline underline-offset-2">← Quay lại kho sách</Link>
      </div>
    )
  }

  const discount = book.originalPrice
    ? Math.round((1 - book.price / book.originalPrice) * 100)
    : null

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10 py-10 md:py-14">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-muted mb-8">
        <Link to="/" className="hover:text-ink transition-colors">Trang chủ</Link>
        <span>/</span>
        <Link to="/books" className="hover:text-ink transition-colors">Sách</Link>
        <span>/</span>
        <span className="text-ink line-clamp-1">{book.title}</span>
      </nav>

      {/* Book info grid */}
      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] lg:grid-cols-[340px_1fr] gap-10 lg:gap-16">

        {/* Cover */}
        <div className="relative">
          <div className="aspect-book bg-surface-subtle rounded-sm overflow-hidden shadow-md">
            <img src={book.image} alt={book.title} className="w-full h-full object-cover" />
          </div>
          {book.badge && (
            <div className="absolute top-3 left-3">
              <Badge
                type={book.badge}
                label={book.badge === 'sale' && discount ? `-${discount}%` : undefined}
              />
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="text-2xs font-semibold tracking-label-2xl uppercase text-accent mb-2">
            {book.category}
          </p>
          <h1 className="font-display text-2xl md:text-3xl font-semibold text-ink leading-snug mb-2">
            {book.title}
          </h1>
          <p className="text-muted mb-4">{book.author}</p>

          {book.reviewCount > 0 && (
            <div className="mb-5">
              <StarRating rating={book.rating} reviewCount={book.reviewCount} />
            </div>
          )}

          <div className="flex items-baseline gap-3 mb-6">
            <span className="font-display text-2xl font-semibold text-ink">{formatPrice(book.price)}</span>
            {book.originalPrice && (
              <>
                <span className="text-subtle line-through text-sm">{formatPrice(book.originalPrice)}</span>
                <span className="text-xs font-semibold text-accent">-{discount}%</span>
              </>
            )}
          </div>

          <p className={`text-xs font-medium mb-6 ${book.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {book.stock > 10 ? 'Còn hàng' : book.stock > 0 ? `Chỉ còn ${book.stock} cuốn` : 'Hết hàng'}
          </p>

          {book.stock > 0 && (
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center border border-divider rounded-sm">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center text-muted hover:text-ink transition-colors text-lg">−</button>
                <span className="w-10 text-center text-sm font-medium text-ink">{qty}</span>
                <button onClick={() => setQty(q => Math.min(book.stock, q + 1))} className="w-10 h-10 flex items-center justify-center text-muted hover:text-ink transition-colors text-lg">+</button>
              </div>
              <button onClick={handleAddCart} className="flex-1 bg-ink text-white text-2xs font-semibold tracking-label-lg uppercase py-3 rounded-sm hover:bg-ink-80 transition-colors">
                Thêm vào giỏ hàng
              </button>
              <button
                onClick={() => {
                  if (!isAuthed) { openAuthPrompt({ message: 'Đăng nhập để lưu sách vào danh sách yêu thích.' }); return }
                  toggle(id)
                  showToast({ message: wishlisted ? 'Đã xóa khỏi yêu thích' : 'Đã thêm vào yêu thích', type: wishlisted ? 'info' : 'success' })
                }}
                className={`w-11 h-11 flex items-center justify-center border rounded-sm transition-colors ${wishlisted ? 'border-red-300 text-red-500' : 'border-divider text-muted hover:border-ink hover:text-ink'}`}
                aria-label="Yêu thích"
              >
                <svg className="w-5 h-5" fill={wishlisted ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </button>
            </div>
          )}

          {book.description && (
            <div className="mt-8 pt-8 border-t border-divider-lt">
              <h2 className="font-display font-semibold text-ink mb-3">Giới thiệu sách</h2>
              <p className="text-sm text-ink-60 leading-relaxed">{book.description}</p>
            </div>
          )}

        </div>
      </div>

      {/* ─── Reviews ─── */}
      <section className="mt-14 pt-10 border-t border-divider-lt">

        {/* Header */}
        <div className="flex items-baseline gap-3 mb-8">
          <h2 className="font-display font-semibold text-xl text-ink">Đánh giá từ độc giả</h2>
          {reviewMeta.total > 0 && (
            <span className="text-muted text-sm">{reviewMeta.total} đánh giá</span>
          )}
        </div>

        {/* Summary: score + distribution */}
        {book.reviewCount > 0 && reviews.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-8 mb-10 pb-10 border-b border-divider-lt">

            {/* Overall score */}
            <div className="flex sm:flex-col items-center sm:justify-center gap-5 sm:gap-2 sm:w-32 flex-shrink-0">
              <span className="font-display text-5xl font-semibold text-ink leading-none">{book.rating}</span>
              <div className="flex flex-col items-center gap-1">
                <Stars rating={book.rating} size="md" />
                <p className="text-xs text-muted">{book.reviewCount} đánh giá</p>
              </div>
            </div>

            {/* Distribution bars */}
            <div className="flex-1 space-y-2.5 max-w-xs">
              {[5,4,3,2,1].map(star => {
                const count = reviews.filter(r => r.rating === star).length
                const pct   = reviews.length ? Math.round(count / reviews.length * 100) : 0
                return (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-xs text-muted w-2.5 flex-shrink-0">{star}</span>
                    <svg className="w-3 h-3 text-star flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d={StarPath} />
                    </svg>
                    <div className="flex-1 h-1.5 bg-surface-subtle rounded-full overflow-hidden">
                      <div className="h-full bg-star rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-subtle w-4 text-right flex-shrink-0">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Review list */}
        {reviews.length > 0 ? (
          <>
            <div className="divide-y divide-divider-lt">
              {reviews.map(r => (
                <div key={r._id} className="py-6 flex gap-4">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-surface-subtle border border-divider-lt flex items-center justify-center flex-shrink-0 text-sm font-semibold text-ink-60">
                    {r.user?.name?.charAt(0)?.toUpperCase() ?? '?'}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Name + date */}
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                      <span className="text-sm font-semibold text-ink">{r.user?.name || 'Ẩn danh'}</span>
                      <span className="text-xs text-subtle">
                        {new Date(r.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </span>
                    </div>

                    {/* Stars */}
                    <Stars rating={r.rating} size="sm" />

                    {/* Comment */}
                    {r.comment && (
                      <p className="mt-2.5 text-sm text-ink-60 leading-relaxed">{r.comment}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Load more */}
            {reviewMeta.page < reviewMeta.totalPages && (
              <div className="mt-8 text-center">
                <button
                  onClick={loadMoreReviews}
                  disabled={reviewLoading}
                  className="text-sm text-ink border border-divider rounded-sm px-8 py-2.5 hover:border-ink hover:bg-surface-warm transition-colors disabled:opacity-50"
                >
                  {reviewLoading
                    ? 'Đang tải...'
                    : `Xem thêm ${reviewMeta.total - reviews.length} đánh giá`}
                </button>
              </div>
            )}
          </>
        ) : (
          /* Empty state */
          <div className="py-12 text-center border border-dashed border-divider rounded-sm">
            <p className="text-muted text-sm">Chưa có đánh giá nào cho cuốn sách này.</p>
            <p className="text-subtle text-xs mt-1.5">Hãy mua và đọc để chia sẻ cảm nhận của bạn!</p>
          </div>
        )}
      </section>
    </div>
  )
}
