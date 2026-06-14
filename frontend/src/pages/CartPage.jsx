import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api }           from '../services/api'
import { useCartStore }  from '../store/cartStore'
import { useAuthStore }  from '../store/authStore'
import { useToastStore } from '../store/toastStore'
import { CouponBox }     from '../components/ui/CouponBox'
import { formatPrice }   from '../utils/format'
import { BookCard }      from '../components/ui/BookCard'

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
  const items        = useCartStore(s => s.items)
  const updateQty    = useCartStore(s => s.updateQty)
  const removeItem   = useCartStore(s => s.removeItem)
  const clear        = useCartStore(s => s.clear)
  const toggleSelect = useCartStore(s => s.toggleSelect)
  const selectAll    = useCartStore(s => s.selectAll)
  const isAuth       = useAuthStore(s => !!s.token)
  const showToast    = useToastStore(s => s.show)
  const navigate     = useNavigate()

  const [couponResult, setCouponResult] = useState(null)
  const [shipConfig, setShipConfig] = useState({ shippingFee: 0, freeShippingThreshold: 0 })
  const [suggestions, setSuggestions] = useState([])

  useEffect(() => {
    api.get('/api/settings/public')
      .then(r => setShipConfig({ shippingFee: r.data.shippingFee || 0, freeShippingThreshold: r.data.freeShippingThreshold || 0 }))
      .catch(() => {})

    api.get('/api/products?sort=rating&limit=10')
      .then(r => setSuggestions(r.data || []))
      .catch(() => {})
  }, [])

  const cartIds = items.map(i => i.id)
  const filteredSuggestions = suggestions
    .filter(book => !cartIds.includes(book._id || book.id))
    .slice(0, 4)

  const selectedItems = items.filter(i => i.selected !== false)
  const subtotal      = selectedItems.reduce((sum, i) => sum + i.price * i.qty, 0)
  const totalQty      = selectedItems.reduce((sum, i) => sum + i.qty, 0)
  const hasOutOfStock = selectedItems.some(i => (i.stock ?? 999) === 0)

  const baseShipping = (shipConfig.freeShippingThreshold > 0 && subtotal >= shipConfig.freeShippingThreshold)
    ? 0 : shipConfig.shippingFee
  const discount     = couponResult?.discount ?? 0
  const shipDiscount = Math.min(couponResult?.shipDiscount ?? 0, baseShipping)
  const total        = Math.max(0, subtotal + baseShipping - discount - shipDiscount)

  function handleCheckout() {
    if (!isAuth) {
      showToast({ message: 'Vui lòng đăng nhập để đặt hàng', type: 'error' })
      navigate('/auth/login', { state: { from: '/cart' } })
      return
    }
    navigate('/checkout')
  }

  if (items.length === 0) {
    return (
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10 py-10 md:py-14">
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-5 px-4 border border-divider-lt rounded-xl bg-surface-warm/30 max-w-xl mx-auto py-10">
          <div className="w-16 h-16 rounded-full bg-surface-subtle flex items-center justify-center">
            <svg className="w-8 h-8 text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="font-display text-lg font-semibold text-ink">Giỏ hàng của bạn đang trống</p>
            <p className="mt-1 text-xs text-muted">Hãy thêm những cuốn sách hay vào giỏ để tiếp tục hành trình đọc nhé</p>
          </div>
          <Link
            to="/books"
            className="px-6 py-2.5 bg-ink text-white text-2xs font-semibold tracking-label uppercase rounded-lg hover:bg-ink-80 transition-colors shadow-2xs"
          >
            Khám phá kho sách
          </Link>
        </div>

        {/* Suggestion list */}
        {filteredSuggestions.length > 0 && (
          <div className="mt-16 border-t border-divider-lt pt-10">
            <p className="text-2xs font-semibold tracking-label-2xl uppercase text-accent mb-1 text-center sm:text-left">Đề xuất cho bạn</p>
            <h2 className="font-display font-semibold text-xl md:text-2xl text-ink mb-6 text-center sm:text-left">Có thể bạn sẽ thích</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
              {filteredSuggestions.map(book => (
                <BookCard key={book._id || book.id} book={{ ...book, id: book._id || book.id }} />
              ))}
            </div>
          </div>
        )}
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
        {/* Items column */}
        <div className="space-y-4">
          {/* Freeship Progress Bar */}
          {shipConfig.freeShippingThreshold > 0 && (
            <div className="bg-[#FAF8F5] border border-divider-lt rounded-xl p-4">
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                {subtotal >= shipConfig.freeShippingThreshold ? (
                  <span className="text-emerald-700 flex items-center gap-1.5">
                    <svg className="w-4 h-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Chúc mừng! Đơn hàng của bạn đã được MIỄN PHÍ VẬN CHUYỂN
                  </span>
                ) : (
                  <span className="text-accent flex items-center gap-1.5">
                    <svg className="w-4 h-4 shrink-0 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.129-1.125V11.25M3 14.25h16.5V7.125A1.125 1.125 0 0018.375 6H12M3 14.25V12M12 6H8.25m3.75 0v6.75H12" />
                    </svg>
                    Mua thêm <strong className="font-bold">{formatPrice(shipConfig.freeShippingThreshold - subtotal)}</strong> để được Freeship
                  </span>
                )}
                <span className="text-[10px] text-muted">{Math.min(Math.round((subtotal / shipConfig.freeShippingThreshold) * 100), 100)}%</span>
              </div>
              <div className="h-2 bg-surface-subtle border border-divider-lt rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${subtotal >= shipConfig.freeShippingThreshold ? 'bg-emerald-600' : 'bg-accent'}`}
                  style={{ width: `${Math.min((subtotal / shipConfig.freeShippingThreshold) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Select all bar */}
          <div className="flex items-center justify-between p-4 bg-white border border-divider-lt rounded-sm text-sm text-ink select-none">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={items.length > 0 && items.filter(i => (i.stock ?? 999) > 0).length > 0 && items.filter(i => (i.stock ?? 999) > 0).every(i => i.selected !== false)}
                onChange={(e) => selectAll(e.target.checked)}
                className="w-4 h-4 rounded border-divider text-ink focus:ring-ink"
              />
              <span className="font-semibold text-xs tracking-wider uppercase text-ink-60">Chọn tất cả ({items.filter(i => (i.stock ?? 999) > 0).length} sách còn hàng)</span>
            </label>
            <span className="text-2xs font-bold text-muted bg-[#FAF8F5] border border-divider-lt px-2 py-0.5 rounded-sm">Đã chọn: {items.filter(i => (i.stock ?? 999) > 0 && i.selected !== false).length}</span>
          </div>

          {items.map(item => {
            const outOfStock = (item.stock ?? 999) === 0
            return (
            <div key={item.id} className={`flex items-center gap-4 p-4 bg-white border border-divider-lt rounded-sm transition-opacity ${outOfStock ? 'opacity-50' : ''}`}>
              {/* Checkbox */}
              <input
                type="checkbox"
                disabled={outOfStock}
                checked={item.selected !== false}
                onChange={() => toggleSelect(item.id)}
                className="w-4 h-4 rounded border-divider text-ink focus:ring-ink cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              />

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
                  <div className="flex items-center gap-2 flex-wrap">
                    <QtyControl
                      qty={item.qty}
                      stock={item.stock}
                      onDecrease={() => updateQty(item.id, item.qty - 1)}
                      onIncrease={() => updateQty(item.id, item.qty + 1)}
                    />
                    {item.stock > 0 && item.qty >= item.stock && (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded shrink-0">
                        Kho chỉ còn {item.stock} cuốn
                      </span>
                    )}
                  </div>
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

            {/* Coupon */}
            <div className="pb-4 border-b border-divider-lt">
              <CouponBox subtotal={subtotal} result={couponResult} onResult={setCouponResult} />
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted">
                <span>Tạm tính ({totalQty} sản phẩm)</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Giảm giá ({couponResult.code})</span>
                  <span>−{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted">
                <span>Phí vận chuyển</span>
                {baseShipping === 0
                  ? <span className="text-accent font-medium">Miễn phí</span>
                  : <span>{formatPrice(baseShipping)}</span>}
              </div>
              {shipDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Hỗ trợ vận chuyển ({couponResult.code})</span>
                  <span>−{formatPrice(shipDiscount)}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-divider-lt flex justify-between font-semibold text-ink">
              <span>Tổng cộng</span>
              <span className="font-display text-lg">{formatPrice(total)}</span>
            </div>

            {hasOutOfStock && (
              <p className="text-xs text-red-600 text-center">Một số sản phẩm đã hết hàng. Vui lòng xóa trước khi tiếp tục.</p>
            )}
            {selectedItems.length === 0 && (
              <p className="text-xs text-accent text-center">Vui lòng chọn ít nhất một sản phẩm để thanh toán.</p>
            )}
            <button
              onClick={handleCheckout}
              disabled={hasOutOfStock || selectedItems.length === 0}
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

      {/* Suggestion list for non-empty cart */}
      {filteredSuggestions.length > 0 && (
        <div className="mt-16 border-t border-divider-lt pt-10">
          <p className="text-2xs font-semibold tracking-label-2xl uppercase text-accent mb-1 text-center sm:text-left">Đề xuất cho bạn</p>
          <h2 className="font-display font-semibold text-xl md:text-2xl text-ink mb-6 text-center sm:text-left">Có thể bạn sẽ thích</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
            {filteredSuggestions.map(book => (
              <BookCard key={book._id || book.id} book={{ ...book, id: book._id || book.id }} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
