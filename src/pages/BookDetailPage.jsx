import { useEffect, useState } from 'react'
import { useParams, Link }     from 'react-router-dom'
import { api }                 from '../services/api'
import { useCartStore }        from '../store/cartStore'
import { useWishlistStore }    from '../store/wishlistStore'
import { useToastStore }       from '../store/toastStore'
import { StarRating }          from '../components/ui/StarRating'
import { Badge }               from '../components/ui/Badge'
import { formatPrice }         from '../utils/format'

export default function BookDetailPage() {
  const { id }  = useParams()
  const [book, setBook]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty]       = useState(1)

  const addItem    = useCartStore(s => s.addItem)
  const toggle     = useWishlistStore(s => s.toggle)
  const wishlisted = useWishlistStore(s => s.ids.includes(id))
  const showToast  = useToastStore(s => s.show)

  useEffect(() => {
    setLoading(true)
    api.get(`/api/products/${id}`)
      .then(res => setBook(res.data))
      .catch(() => setBook(null))
      .finally(() => setLoading(false))
  }, [id])

  function handleAddCart() {
    if (!book) return
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
              <div key={w} className={`h-4 bg-surface-subtle rounded animate-pulse`} style={{ width: `${w}%` }} />
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

      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] lg:grid-cols-[340px_1fr] gap-10 lg:gap-16">
        {/* Cover */}
        <div className="relative">
          <div className="aspect-book bg-surface-subtle rounded-sm overflow-hidden shadow-md">
            <img
              src={book.image}
              alt={book.title}
              className="w-full h-full object-cover"
            />
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
          {/* Category */}
          <p className="text-2xs font-semibold tracking-label-2xl uppercase text-accent mb-2">
            {book.category}
          </p>

          {/* Title */}
          <h1 className="font-display text-2xl md:text-3xl font-semibold text-ink leading-snug mb-2">
            {book.title}
          </h1>

          {/* Author */}
          <p className="text-muted mb-4">{book.author}</p>

          {/* Rating */}
          {book.rating && (
            <div className="mb-5">
              <StarRating rating={book.rating} reviewCount={book.reviewCount} />
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="font-display text-2xl font-semibold text-ink">
              {formatPrice(book.price)}
            </span>
            {book.originalPrice && (
              <>
                <span className="text-subtle line-through text-sm">{formatPrice(book.originalPrice)}</span>
                <span className="text-xs font-semibold text-accent">-{discount}%</span>
              </>
            )}
          </div>

          {/* Stock */}
          <p className={`text-xs font-medium mb-6 ${book.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {book.stock > 10 ? 'Còn hàng' : book.stock > 0 ? `Chỉ còn ${book.stock} cuốn` : 'Hết hàng'}
          </p>

          {/* Qty + Add to cart */}
          {book.stock > 0 && (
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center border border-divider rounded-sm">
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center text-muted hover:text-ink transition-colors text-lg"
                >−</button>
                <span className="w-10 text-center text-sm font-medium text-ink">{qty}</span>
                <button
                  onClick={() => setQty(q => Math.min(book.stock, q + 1))}
                  className="w-10 h-10 flex items-center justify-center text-muted hover:text-ink transition-colors text-lg"
                >+</button>
              </div>

              <button
                onClick={handleAddCart}
                className="flex-1 bg-ink text-white text-2xs font-semibold tracking-label-lg uppercase py-3 rounded-sm hover:bg-ink-80 transition-colors"
              >
                Thêm vào giỏ hàng
              </button>

              <button
                onClick={() => { toggle(id); showToast({ message: wishlisted ? 'Đã xóa khỏi yêu thích' : 'Đã thêm vào yêu thích', type: wishlisted ? 'info' : 'success' }) }}
                className={`w-11 h-11 flex items-center justify-center border rounded-sm transition-colors ${wishlisted ? 'border-red-300 text-red-500' : 'border-divider text-muted hover:border-ink hover:text-ink'}`}
                aria-label="Yêu thích"
              >
                <svg className="w-5 h-5" fill={wishlisted ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </button>
            </div>
          )}

          {/* Description */}
          {book.description && (
            <div className="mt-8 pt-8 border-t border-divider-lt">
              <h2 className="font-display font-semibold text-ink mb-3">Giới thiệu sách</h2>
              <p className="text-sm text-ink-60 leading-relaxed">{book.description}</p>
            </div>
          )}

          {/* Trailer */}
          {book.trailer && (
            <div className="mt-8 pt-8 border-t border-divider-lt">
              <h2 className="font-display font-semibold text-ink mb-4">Trailer sách</h2>
              <div className="relative w-full aspect-video rounded-sm overflow-hidden bg-surface-subtle">
                <iframe
                  src={`https://www.youtube.com/embed/${new URL(book.trailer).searchParams.get('v')}`}
                  title={`Trailer: ${book.title}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
