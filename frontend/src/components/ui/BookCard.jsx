import { useCartStore }     from '../../store/cartStore'
import { useWishlistStore } from '../../store/wishlistStore'
import { useToastStore }    from '../../store/toastStore'
import { useUIStore }       from '../../store/uiStore'
import { useAuthStore }     from '../../store/authStore'
import { Badge }            from './Badge'
import { StarRating }       from './StarRating'
import { HeartIcon, PlusIcon } from './icons'
import { formatPrice }      from '../../utils/format'

export function BookCard({ book }) {
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
    addItem(book)
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
      className="group bg-white border border-divider-lt rounded-lg overflow-hidden flex flex-col cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-card-h hover:border-divider"
    >
      {/* Media */}
      <div className="relative aspect-book bg-surface-subtle overflow-hidden">
        <img
          src={book.image}
          alt={book.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-460 group-hover:scale-105 group-hover:opacity-90"
        />

        {/* Badge */}
        {book.badge && (
          <div className="absolute top-2.5 left-2.5">
            <Badge
              type={book.badge}
              label={book.badge === 'sale' && book.originalPrice
                ? `-${Math.round((1 - book.price / book.originalPrice) * 100)}%`
                : undefined}
            />
          </div>
        )}

        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          aria-label={wishlisted ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
          className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center transition-all duration-200 ${wishlisted ? 'opacity-100 scale-100 text-red-500' : 'opacity-0 scale-75 text-muted group-hover:opacity-100 group-hover:scale-100'} hover:bg-white`}
        >
          <HeartIcon className="w-3.5 h-3.5" filled={wishlisted} />
        </button>

        {/* Quick add */}
        <button
          onClick={handleAddCart}
          aria-label={`Thêm ${book.title} vào giỏ hàng`}
          className="absolute bottom-0 left-0 right-0 bg-ink/88 text-white text-[10px] font-semibold tracking-label uppercase py-2.5 text-center translate-y-full transition-transform duration-300 group-hover:translate-y-0"
        >
          + Thêm vào giỏ hàng
        </button>
      </div>

      {/* Body */}
      <div className="p-3.5 flex-1 flex flex-col">
        <p className="text-[9px] font-semibold tracking-label-lg uppercase text-accent mb-1.5">{book.category}</p>
        <h3 className="font-display font-semibold text-[0.92rem] leading-snug text-ink mb-1 line-clamp-2">{book.title}</h3>
        <p className="text-[11px] text-muted mb-2.5">{book.author}</p>
        {book.reviewCount > 0 && (
          <StarRating rating={book.rating} reviewCount={book.reviewCount} className="pb-3" />
        )}

        <div className="flex items-center justify-between gap-2 pt-3 border-t border-divider-lt mt-auto">
          <div>
            <span className="block text-sm font-bold text-ink">{formatPrice(book.price)}</span>
            {book.originalPrice && (
              <span className="text-[11px] text-subtle line-through">{formatPrice(book.originalPrice)}</span>
            )}
          </div>
          <button
            onClick={handleAddCart}
            aria-label={`Thêm ${book.title} vào giỏ`}
            className="w-8 h-8 rounded-lg bg-ink text-white flex items-center justify-center flex-shrink-0 hover:bg-ink-80 active:scale-95 transition-all"
          >
            <PlusIcon />
          </button>
        </div>
      </div>
    </article>
  )
}
