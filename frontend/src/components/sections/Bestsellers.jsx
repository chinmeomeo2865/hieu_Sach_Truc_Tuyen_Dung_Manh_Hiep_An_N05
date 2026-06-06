import { Link }              from 'react-router-dom'
import { useScrollReveal }   from '../../hooks/useScrollReveal'
import { SectionHeader }     from '../ui/SectionHeader'
import { StarRating }        from '../ui/StarRating'
import { Badge }             from '../ui/Badge'
import { PlusIcon, HeartIcon } from '../ui/icons'
import { useCartStore }      from '../../store/cartStore'
import { useWishlistStore }  from '../../store/wishlistStore'
import { useToastStore }     from '../../store/toastStore'
import { useUIStore }        from '../../store/uiStore'
import { useAuthStore }      from '../../store/authStore'
import { formatPrice }       from '../../utils/format'
import { BESTSELLERS }       from '../../data/books'

function BestsellerRow({ book, rank }) {
  const addItem        = useCartStore(s => s.addItem)
  const toggle         = useWishlistStore(s => s.toggle)
  const bookId         = book._id || book.id
  const wishlisted     = useWishlistStore(s => s.ids.includes(bookId))
  const showToast      = useToastStore(s => s.show)
  const openQuickView  = useUIStore(s => s.openQuickView)
  const openAuthPrompt = useUIStore(s => s.openAuthPrompt)
  const isAuthed       = useAuthStore(s => !!s.token)

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
    <li
      onClick={() => openQuickView(book)}
      className="group flex items-center gap-4 md:gap-6 px-4 md:px-6 py-4 border-b border-divider-lt cursor-pointer transition-colors duration-200 hover:bg-surface-warm last:border-b-0"
    >
      {/* Rank */}
      <span className="hidden sm:block font-display text-2xl md:text-3xl font-semibold text-divider w-8 flex-shrink-0 select-none text-right">
        {String(rank).padStart(2, '0')}
      </span>

      {/* Cover */}
      <div className="relative w-12 h-16 sm:w-14 sm:h-[4.5rem] flex-shrink-0 rounded overflow-hidden bg-surface-subtle">
        <img
          src={book.image}
          alt={book.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {book.badge && (
          <div className="absolute top-1 left-1">
            <Badge type={book.badge} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-semibold tracking-label-lg uppercase text-accent mb-0.5">{book.category}</p>
        <h3 className="font-display font-semibold text-sm md:text-[0.9rem] leading-snug text-ink line-clamp-1 group-hover:text-accent transition-colors duration-200">
          {book.title}
        </h3>
        <p className="text-[11px] text-muted mt-0.5">{book.author}</p>
        {book.reviewCount > 0 && (
          <StarRating rating={book.rating} reviewCount={book.reviewCount} className="mt-1" />
        )}
      </div>

      {/* Price + actions */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="text-right hidden xs:block">
          <span className="block text-sm font-bold text-ink">{formatPrice(book.price)}</span>
          {book.originalPrice && (
            <span className="text-[10px] text-subtle line-through">{formatPrice(book.originalPrice)}</span>
          )}
        </div>

        <button
          onClick={handleWishlist}
          aria-label={wishlisted ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
          className={`w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0 transition-all duration-200 ${wishlisted ? 'border-red-300 text-red-500 bg-red-50' : 'border-divider-lt text-muted hover:border-ink hover:text-ink'}`}
        >
          <HeartIcon className="w-3.5 h-3.5" filled={wishlisted} />
        </button>

        <button
          onClick={handleAddCart}
          aria-label={`Thêm ${book.title} vào giỏ`}
          className="w-8 h-8 rounded-sm bg-ink text-white flex items-center justify-center flex-shrink-0 hover:bg-ink-80 active:scale-95 transition-all"
        >
          <PlusIcon />
        </button>
      </div>
    </li>
  )
}

export function Bestsellers({ books }) {
  const { ref, visible } = useScrollReveal()

  const list = (books?.length ? books : BESTSELLERS).slice(0, 8)

  return (
    <section
      id="books"
      aria-label="Sách bán chạy"
      className="border-t border-divider-lt py-16 md:py-24"
    >
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10">
        <div
          ref={ref}
          className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
        >
          <SectionHeader
            eyebrow="Bán chạy nhất"
            title="Danh sách sách"
            subtitle="Những cuốn sách được hàng nghìn độc giả tin yêu"
            linkText="Xem tất cả"
          />

          {/* Book list */}
          <div className="border border-divider-lt rounded-xl overflow-hidden bg-white">
            {list.length === 0 ? (
              <p className="py-12 text-center text-muted text-sm">Không có sách trong danh mục này.</p>
            ) : (
              <ul>
                {list.map((book, i) => (
                  <BestsellerRow key={book._id || book.id} book={book} rank={i + 1} />
                ))}
              </ul>
            )}
          </div>

          <div className="text-center mt-8">
            <Link
              to="/books"
              className="inline-flex items-center gap-2 border border-divider text-ink-60 text-[11px] font-semibold tracking-label uppercase px-6 py-3 rounded-sm hover:border-ink hover:text-ink hover:-translate-y-px transition-all"
            >
              Xem tất cả bestsellers
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
