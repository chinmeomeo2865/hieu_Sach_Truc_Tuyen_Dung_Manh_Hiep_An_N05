import { useState, useEffect } from 'react'
import { Link, useNavigate }   from 'react-router-dom'
import { api }                 from '../services/api'
import { useCartStore }        from '../store/cartStore'
import { useAuthStore }        from '../store/authStore'
import { useToastStore }       from '../store/toastStore'
import { CouponBox }           from '../components/ui/CouponBox'
import { formatPrice }         from '../utils/format'

const CITIES = [
  'Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng',
  'Cần Thơ', 'Huế', 'Nha Trang', 'Vũng Tàu', 'Khác',
]

export default function CheckoutPage() {
  const allItems   = useCartStore(s => s.items)
  const items      = allItems.filter(i => i.selected !== false)
  const clearSelected = useCartStore(s => s.clearSelected)
  const isAuth     = useAuthStore(s => !!s.token)
  const user       = useAuthStore(s => s.user)
  const showToast  = useToastStore(s => s.show)
  const navigate   = useNavigate()

  const [form, setForm] = useState({
    name:   user?.name || '',
    phone:  user?.phone || '',
    street: '',
    city:   'Hà Nội',
    note:   '',
  })
  const [loading,       setLoading]       = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('COD')
  const [couponResult,  setCouponResult]  = useState(null)  // { code, description, discount, shipDiscount }
  const [shipConfig,    setShipConfig]    = useState({ shippingFee: 0, freeShippingThreshold: 0 })

  useEffect(() => {
    if (!isAuth) {
      showToast({ message: 'Vui lòng đăng nhập để đặt hàng', type: 'error' })
      navigate('/auth/login', { replace: true, state: { from: '/checkout' } })
      return
    }
    if (items.length === 0) navigate('/cart')
  }, [])

  useEffect(() => {
    api.get('/api/settings/public')
      .then(r => setShipConfig({ shippingFee: r.data.shippingFee || 0, freeShippingThreshold: r.data.freeShippingThreshold || 0 }))
      .catch(() => {})
  }, [])

  function update(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  const subtotal    = items.reduce((sum, i) => sum + i.price * i.qty, 0)
  const totalQty    = items.reduce((sum, i) => sum + i.qty, 0)
  const baseShipping = (shipConfig.freeShippingThreshold > 0 && subtotal >= shipConfig.freeShippingThreshold)
    ? 0 : shipConfig.shippingFee
  const discount     = couponResult?.discount ?? 0
  const shipDiscount = Math.min(couponResult?.shipDiscount ?? 0, baseShipping)
  const total        = Math.max(0, subtotal + baseShipping - discount - shipDiscount)
  const isFormValid  = form.name.trim() && form.phone.trim() && form.street.trim()

  async function handleSubmit(e) {
    e.preventDefault()
    const cleanPhone = form.phone.replace(/[\s.-]/g, '')
    if (!form.name.trim() || !cleanPhone || !form.street.trim()) {
      showToast({ message: 'Vui lòng điền đầy đủ thông tin', type: 'error' })
      return
    }
    if (!/^0\d{9}$/.test(cleanPhone)) {
      showToast({ message: 'Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)', type: 'error' })
      return
    }

    setLoading(true)
    try {
      // 1. Xóa server cart cũ rồi sync từ Zustand lên
      await api.del('/api/cart')
      for (const item of items) {
        await api.post('/api/cart/items', {
          productId: item.id,
          qty: item.qty,
        })
      }

      // 2. Tạo đơn hàng
      const res = await api.post('/api/orders', {
        payment: paymentMethod,
        address: {
          name:   form.name.trim(),
          phone:  cleanPhone,
          street: form.street.trim(),
          city:   form.city,
        },
        note:       form.note.trim() || undefined,
        couponCode: couponResult?.code || undefined,
      })

      const order = res.data

      // 3a. PayOS — redirect sang trang thanh toán
      if (paymentMethod === 'ONLINE') {
        try {
          const payRes = await api.post('/api/payments/payos/create', { orderId: order._id })
          window.location.href = payRes.data.checkoutUrl
          return
        } catch (payErr) {
          const msg = payErr?.response?.data?.message || 'Không tạo được link thanh toán. Vui lòng thử lại.'
          showToast({ message: msg, type: 'error' })
          navigate('/account/orders')
          return
        }
      }

      // 3b. COD — clear cart + redirect
      clearSelected()
      showToast({ message: 'Đặt hàng thành công! Cảm ơn bạn 🎉', type: 'success' })
      navigate('/account/orders')
    } catch (err) {
      showToast({ message: err.message || 'Đặt hàng thất bại, thử lại sau', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10 py-10 md:py-14">
      <h1 className="font-display text-2xl md:text-3xl font-semibold text-ink mb-8">Đặt hàng</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
          {/* Address form */}
          <div className="space-y-6">
            <div className="bg-white border border-divider-lt rounded-sm p-6 space-y-5">
              <h2 className="font-display font-semibold text-ink">Thông tin giao hàng</h2>

              {[
                { field: 'name',   label: 'Họ và tên',    type: 'text',  placeholder: 'Nguyễn Văn A' },
                { field: 'phone',  label: 'Số điện thoại', type: 'tel',   placeholder: '09x xxx xxxx' },
                { field: 'street', label: 'Địa chỉ chi tiết', type: 'text', placeholder: 'Số nhà, tên đường, phường/xã' },
              ].map(({ field, label, type, placeholder }) => (
                <div key={field} className="space-y-1">
                  <label className="block text-2xs font-semibold tracking-label-lg uppercase text-ink-60">{label}</label>
                  <input
                    type={type}
                    required
                    value={form[field]}
                    onChange={update(field)}
                    placeholder={placeholder}
                    className="w-full border border-divider rounded-sm px-3 py-2.5 text-sm text-ink placeholder:text-subtle focus:outline-none focus:border-ink transition-colors"
                  />
                </div>
              ))}

              <div className="space-y-1">
                <label className="block text-2xs font-semibold tracking-label-lg uppercase text-ink-60">Tỉnh / Thành phố</label>
                <select
                  value={form.city}
                  onChange={update('city')}
                  className="w-full border border-divider rounded-sm px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-ink transition-colors bg-white"
                >
                  {CITIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-2xs font-semibold tracking-label-lg uppercase text-ink-60">Ghi chú (tùy chọn)</label>
                <textarea
                  value={form.note}
                  onChange={update('note')}
                  rows={2}
                  placeholder="Ghi chú cho người giao hàng…"
                  className="w-full border border-divider rounded-sm px-3 py-2.5 text-sm text-ink placeholder:text-subtle focus:outline-none focus:border-ink transition-colors resize-none"
                />
              </div>
            </div>

            {/* Payment */}
            <div className="bg-white border border-divider-lt rounded-sm p-6">
              <h2 className="font-display font-semibold text-ink mb-4">Phương thức thanh toán</h2>
              <div className="space-y-3">
                <label className={`flex items-center gap-3 cursor-pointer border rounded-sm px-4 py-3 transition-colors ${paymentMethod === 'COD' ? 'border-ink bg-[#faf8f5]' : 'border-divider-lt hover:border-divider'}`}>
                  <input type="radio" name="payment" value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="accent-ink" />
                  <div>
                    <p className="text-sm font-medium text-ink">Tiền mặt khi nhận hàng (COD)</p>
                    <p className="text-xs text-muted mt-0.5">Kiểm tra hàng trước khi thanh toán</p>
                  </div>
                </label>
                <label className={`flex items-center gap-3 cursor-pointer border rounded-sm px-4 py-3 transition-colors ${paymentMethod === 'ONLINE' ? 'border-ink bg-[#faf8f5]' : 'border-divider-lt hover:border-divider'}`}>
                  <input type="radio" name="payment" value="ONLINE"
                    checked={paymentMethod === 'ONLINE'}
                    onChange={() => setPaymentMethod('ONLINE')}
                    className="accent-ink" />
                  <div>
                    <p className="text-sm font-medium text-ink">PayOS / VietQR</p>
                    <p className="text-xs text-muted mt-0.5">Quét mã QR qua app ngân hàng — xác nhận ngay lập tức</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-surface-warm border border-divider-lt rounded-sm p-6">
              <h2 className="font-display font-semibold text-ink mb-5">Đơn hàng ({totalQty})</h2>

              <div className="space-y-3 mb-5">
                {items.map(item => (
                  <div key={item.id} className="flex gap-3">
                    <img src={item.image} alt={item.title} className="w-12 h-16 object-cover rounded-sm flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink line-clamp-2 leading-snug">{item.title}</p>
                      <p className="text-xs text-muted mt-0.5">SL: {item.qty}</p>
                    </div>
                    <span className="text-sm font-semibold text-ink flex-shrink-0">{formatPrice(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>

              {/* Coupon input */}
              <div className="pt-4 border-t border-divider-lt">
                <CouponBox subtotal={subtotal} result={couponResult} onResult={setCouponResult} />
              </div>

              <div className="pt-4 border-t border-divider-lt space-y-2 text-sm">
                <div className="flex justify-between text-muted">
                  <span>Tạm tính</span>
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
                <div className="flex justify-between font-semibold text-ink pt-2 border-t border-divider-lt">
                  <span>Tổng cộng</span>
                  <span className="font-display text-lg">{formatPrice(total)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={!isFormValid || loading}
                className="w-full mt-5 bg-ink text-white text-2xs font-semibold tracking-label-lg uppercase py-3.5 rounded-sm hover:bg-ink-80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Đang xử lý…' : 'Xác nhận đặt hàng'}
              </button>
              {!isFormValid && (
                <p className="text-center text-xs text-muted mt-2">Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ</p>
              )}

              <Link to="/cart" className="block text-center mt-3 text-xs text-muted hover:text-ink underline underline-offset-2 transition-colors">
                ← Quay lại giỏ hàng
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
