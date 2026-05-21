import { useEffect }        from 'react'
import { useUIStore }       from '../../store/uiStore'
import { useCartStore }     from '../../store/cartStore'
import { useWishlistStore } from '../../store/wishlistStore'
import { useToastStore }    from '../../store/toastStore'
import { StarRating }       from './StarRating'
import { Badge }            from './Badge'
import { HeartIcon, CloseIcon, PlusIcon } from './icons'
import { formatPrice }      from '../../utils/format'

export function QuickViewModal() {
  const book         = useUIStore(s => s.quickViewBook)
  const close        = useUIStore(s => s.closeQuickView)
  const addItem      = useCartStore(s => s.addItem)
  const toggle       = useWishlistStore(s => s.toggle)
  const bookId       = book ? (book._id || book.id) : null
  const wishlisted   = useWishlistStore(s => bookId ? s.ids.includes(bookId) : false)
  const showToast    = useToastStore(s => s.show)

  /* Lock scroll + Escape key */
  useEffect(() => {
    if (!book) return
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [book, close])

  if (!book) return null

  const handleAddCart = () => {
    addItem(book)
    showToast({ message: `Đã thêm "${book.title}" vào giỏ hàng` })
    close()
  }

  const handleWishlist = () => {
    const was = wishlisted
    toggle(bookId)
    showToast({
      type:    was ? 'info' : 'success',
      message: was ? 'Đã xóa khỏi yêu thích' : `Đã thêm "${book.title}" vào yêu thích`,
    })
  }

  return (
    /* Overlay */
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-8">
      <div
        className="absolute inset-0 bg-ink/55 backdrop-blur-sm"
        onClick={close}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={book.title}
        className="relative bg-white rounded-xl overflow-hidden w-full max-w-3xl shadow-elevated max-h-[90vh] overflow-y-auto"
      >
        {/* Close */}
        <button
          onClick={close}
          aria-label="Đóng"
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-muted hover:text-ink transition-colors"
        >
          <CloseIcon className="w-4 h-4" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr]">
          {/* Cover */}
          <div className="aspect-[3/4] md:aspect-auto bg-surface-subtle">
            <img src={book.image} alt={book.title} className="w-full h-full object-cover" />
          </div>

          {/* Details */}
          <div className="p-6 md:p-8 flex flex-col gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              {book.badge && <Badge type={book.badge} label={book.badge === 'sale' && book.originalPrice ? `-${Math.round((1 - book.price / book.originalPrice) * 100)}%` : undefined} />}
              {book.stock && (
                <span className="text-[10px] font-medium text-green-600">● Còn {book.stock} quyển</span>
              )}
            </div>

            <div>
              <p className="text-2xs font-semibold tracking-label-lg uppercase text-accent mb-1">{book.category}</p>
              <h2 className="font-display text-xl md:text-2xl font-semibold text-ink leading-tight">{book.title}</h2>
              <p className="text-sm text-muted mt-1">{book.author}</p>
            </div>

            <StarRating rating={book.rating} reviewCount={book.reviewCount} />

            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl font-semibold text-ink">{formatPrice(book.price)}</span>
              {book.originalPrice && (
                <span className="text-sm text-subtle line-through">{formatPrice(book.originalPrice)}</span>
              )}
            </div>

            {book.description && (
              <p className="text-sm text-ink-60 leading-relaxed">{book.description}</p>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-auto pt-4 border-t border-divider-lt">
              <button
                onClick={handleAddCart}
                className="flex-1 flex items-center justify-center gap-2 bg-ink text-white text-[11px] font-semibold tracking-label uppercase py-3 rounded-sm hover:bg-ink-80 active:scale-95 transition-all"
              >
                <PlusIcon />
                Thêm vào giỏ hàng
              </button>
              <button
                onClick={handleWishlist}
                aria-label={wishlisted ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
                className={`w-11 flex items-center justify-center border rounded-sm transition-all ${wishlisted ? 'border-red-300 text-red-500 bg-red-50' : 'border-divider text-muted hover:border-ink hover:text-ink'}`}
              >
                <HeartIcon className="w-4 h-4" filled={wishlisted} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
