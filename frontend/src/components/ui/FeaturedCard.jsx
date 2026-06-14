import { useCartStore }     from '../../store/cartStore'
import { useWishlistStore } from '../../store/wishlistStore'
import { useToastStore }    from '../../store/toastStore'
import { useUIStore }       from '../../store/uiStore'
import { useAuthStore }     from '../../store/authStore'
import { Badge }            from './Badge'
import { StarRating }       from './StarRating'
import { HeartIcon, PlusIcon } from './icons'
import { formatPrice }      from '../../utils/format'

export function FeaturedCard({ book }) {
  const addItem      = useCartStore(s => s.addItem)
  const toggle       = useWishlistStore(s => s.toggle)
  const bookId       = book._id || book.id
  const wishlisted   = useWishlistStore(s => s.ids.includes(bookId))
  const showToast    = useToastStore(s => s.show)
  const openQuickView = useUIStore(s => s.openQuickView)
  const openAuthPrompt = useUIStore(s => s.openAuthPrompt)
  const isAuthed     = useAuthStore(s => !!s.token)

  const handleAddCart = (e) => {
    e.stopPropagation()
    if (!isAuthed) {
      openAuthPrompt({ message: 'Đăng nhập để thêm sách vào giỏ hàng.' })
      return
    }
    addItem({ ...book, id: bookId })
    showToast({ message: `Đã thêm "${book.title}" vào giỏ hàng` })
  }

  const handleWishlist = (e) => {
    e.stopPropagation()
    if (!isAuthed) {
      openAuthPrompt({ message: 'Đăng nhập để lưu sách vào danh sách yêu thích.' })
      return
    }
    const was = wishlisted
    toggle(bookId)
    showToast({
      type:    was ? 'info' : 'success',
      message: was ? 'Đã xóa khỏi yêu thích' : 'Đã thêm vào yêu thích',
    })
  }

  return (
    <article
      onClick={() => openQuickView(book)}
      className="bg-white grid grid-cols-[160px_1fr] md:grid-cols-[180px_1fr] gap-5 md:gap-6 p-5 md:p-8 transition-colors hover:bg-surface-warm cursor-pointer group"
    >
      {/* Cover */}
      <div className="aspect-[2/3] rounded-lg overflow-hidden bg-surface-subtle flex-shrink-0">
        <img
          src={book.image}
          alt={book.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-460 group-hover:scale-[1.04]"
        />
      </div>

      {/* Info */}
      <div className="flex flex-col justify-center gap-2.5 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {book.badge && <Badge type={book.badge} />}
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
            book.stock > 10 ? 'text-green-700 bg-green-50' :
            book.stock > 0 ? 'text-amber-700 bg-amber-50' :
            'text-red-600 bg-red-50'
          }`}>
            {book.stock > 10 ? '● Còn hàng' : book.stock > 0 ? `● Chỉ còn ${book.stock} cuốn` : '● Hết hàng'}
          </span>
        </div>

        <div>
          <p className="text-[9px] font-semibold tracking-label-lg uppercase text-accent">{book.category}</p>
          <h3 className="font-display font-semibold text-xl md:text-2xl leading-tight text-ink mt-0.5">{book.title}</h3>
          <p className="text-xs text-muted mt-1">{book.author}</p>
        </div>

        {book.reviewCount > 0 && (
          <StarRating rating={book.rating} reviewCount={book.reviewCount} />
        )}

        {book.description && (
          <p className="text-xs text-ink-60 leading-relaxed line-clamp-2 md:line-clamp-3">{book.description}</p>
        )}

        <div className="flex items-center gap-3 mt-1">
          <div>
            <span className="block text-base md:text-lg font-bold text-ink">{formatPrice(book.price)}</span>
            {book.originalPrice && (
              <span className="text-xs text-subtle line-through">{formatPrice(book.originalPrice)}</span>
            )}
          </div>

          <button
            onClick={handleAddCart}
            disabled={book.stock <= 0}
            aria-label={`Thêm ${book.title} vào giỏ hàng`}
            className="flex items-center gap-1.5 bg-ink text-white text-[10px] font-semibold tracking-label uppercase px-4 py-2 rounded-sm hover:bg-ink-80 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusIcon className="w-3 h-3" />
            {book.stock <= 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
          </button>

          <button
            onClick={handleWishlist}
            aria-label={wishlisted ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
            className={`w-8 h-8 flex items-center justify-center border rounded-sm transition-all ${wishlisted ? 'border-red-300 text-red-500 bg-red-50' : 'border-divider text-muted hover:border-ink hover:text-ink'}`}
          >
            <HeartIcon className="w-3.5 h-3.5" filled={wishlisted} />
          </button>
        </div>
      </div>
    </article>
  )
}
