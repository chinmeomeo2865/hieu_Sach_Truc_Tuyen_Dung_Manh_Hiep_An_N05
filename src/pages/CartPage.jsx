import { Link, useNavigate } from 'react-router-dom'
import { useCartStore }  from '../store/cartStore'
import { useAuthStore }  from '../store/authStore'
import { useToastStore } from '../store/toastStore'
import { formatPrice }   from '../utils/format'

function QtyControl({ qty, stock, onDecrease, onIncrease }) {
  const atMax = stock != null && qty >= stock
  return (
    <div className="flex items-center border border-divider rounded-sm">
      <button
        onClick={onDecrease}
        className="w-8 h-8 flex items-center justify-center text-muted hover:text-ink transition-colors"
      >−</button>
      <span className="w-8 text-center text-sm font-medium text-ink">{qty}</span>
      <button
        onClick={onIncrease}
        disabled={atMax}
        className="w-8 h-8 flex items-center justify-center text-muted hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >+</button>
    </div>
  )
}

export default function CartPage() {
  const items      = useCartStore(s => s.items)
  const updateQty  = useCartStore(s => s.updateQty)
  const removeItem = useCartStore(s => s.removeItem)
  const clear      = useCartStore(s => s.clear)
  const isAuth     = useAuthStore(s => !!s.token)
  const showToast  = useToastStore(s => s.show)
  const navigate   = useNavigate()

  const subtotal    = items.reduce((sum, i) => sum + i.price * i.qty, 0)
  const totalQty    = items.reduce((sum, i) => sum + i.qty, 0)
  const hasOutOfStock = items.some(i => (i.stock ?? 999) === 0)

  function handleCheckout() {
    if (!isAuth) {
      showToast({ message: 'Vui lòng đăng nhập để đặt hàng', type: 'error' })
      navigate('/auth/login')
      return
    }
    navigate('/checkout')
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-5 px-4">
        <div className="w-20 h-20 rounded-full bg-surface-subtle flex items-center justify-center">
          <svg className="w-9 h-9 text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
          </svg>
        </div>
        <div className="text-center">
          <p className="font-display text-xl font-semibold text-ink">Giỏ hàng trống</p>
          <p className="mt-1 text-sm text-muted">Hãy thêm sách vào giỏ để tiếp tục</p>
        </div>
        <Link
          to="/books"
          className="px-6 py-2.5 bg-ink text-white text-2xs font-semibold tracking-label-lg uppercase rounded-sm hover:bg-ink-80 transition-colors"
        >
          Khám phá sách
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10 py-10 md:py-14">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-semibold text-ink">
          Giỏ hàng <span className="text-muted font-normal text-lg">({totalQty})</span>
        </h1>
        <button
          onClick={() => { clear(); showToast({ message: 'Đã xóa giỏ hàng', type: 'info' }) }}
          className="text-xs text-muted hover:text-ink underline underline-offset-2 transition-colors"
        >
          Xóa tất cả
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        {/* Items */}
        <div className="space-y-4">
          {items.map(item => {
            const outOfStock = (item.stock ?? 999) === 0
            return (
            <div key={item.id} className={`flex gap-4 p-4 bg-white border border-divider-lt rounded-sm transition-opacity ${outOfStock ? 'opacity-50' : ''}`}>
              <Link to={`/books/${item.id}`} className="flex-shrink-0">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-16 h-[85px] object-cover rounded-sm"
                />
              </Link>

              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 flex-wrap">
                  <Link to={`/books/${item.id}`} className="font-display font-semibold text-ink hover:text-ink-60 transition-colors line-clamp-2 leading-snug">
                    {item.title}
                  </Link>
                  {outOfStock && (
                    <span className="flex-shrink-0 text-2xs font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-sm">Đã hết hàng</span>
                  )}
                </div>
                {item.author && (
                  <p className="mt-0.5 text-xs text-muted">{item.author}</p>
                )}
                <div className="mt-3 flex items-center justify-between flex-wrap gap-3">
                  <QtyControl
                    qty={item.qty}
                    stock={item.stock}
                    onDecrease={() => updateQty(item.id, item.qty - 1)}
                    onIncrease={() => updateQty(item.id, item.qty + 1)}
                  />
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-ink">{formatPrice(item.price * item.qty)}</span>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-subtle hover:text-ink transition-colors"
                      aria-label="Xóa"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
          })}
        </div>

        {/* Summary */}
        <div className="lg:sticky lg:top-24 h-fit">
          <div className="bg-surface-warm border border-divider-lt rounded-sm p-6 space-y-4">
            <h2 className="font-display font-semibold text-lg text-ink">Tóm tắt đơn hàng</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted">
                <span>Tạm tính ({totalQty} sản phẩm)</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Phí vận chuyển</span>
                <span className="text-accent font-medium">Miễn phí</span>
              </div>
            </div>

            <div className="pt-3 border-t border-divider-lt flex justify-between font-semibold text-ink">
              <span>Tổng cộng</span>
              <span className="font-display text-lg">{formatPrice(subtotal)}</span>
            </div>

            {hasOutOfStock && (
              <p className="text-xs text-red-600 text-center">Một số sản phẩm đã hết hàng. Vui lòng xóa trước khi tiếp tục.</p>
            )}
            <button
              onClick={handleCheckout}
              disabled={hasOutOfStock}
              className="w-full bg-ink text-white text-2xs font-semibold tracking-label-lg uppercase py-3.5 rounded-sm hover:bg-ink-80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Tiến hành đặt hàng
            </button>

            <Link
              to="/books"
              className="block text-center text-xs text-muted hover:text-ink underline underline-offset-2 transition-colors"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
