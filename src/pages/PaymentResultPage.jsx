import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'
import { api } from '../services/api'

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams()
  const clearCart = useCartStore(s => s.clear)
  const status  = searchParams.get('status')
  const orderId = searchParams.get('orderId')
  const [order, setOrder] = useState(null)

  useEffect(() => {
    if (status === 'success') {
      clearCart()
      if (orderId) {
        api.get(`/api/orders/${orderId}`).then(r => setOrder(r.data)).catch(() => {})
      }
    }
  }, [status, orderId])

  if (status === 'success') return (
    <div className="max-w-[480px] mx-auto px-4 py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
        </svg>
      </div>
      <h1 className="font-display text-2xl font-semibold text-ink mb-2">Thanh toán thành công!</h1>
      <p className="text-[14px] text-muted mb-8">
        {order ? `Đơn hàng #${order._id.slice(-6).toUpperCase()} đã được xác nhận.` : 'Đơn hàng của bạn đã được xác nhận.'}
      </p>
      <div className="flex gap-3 justify-center">
        <Link to="/account/orders"
          className="px-6 py-2.5 bg-ink text-white text-[13px] font-medium rounded-lg hover:bg-ink-80 transition-colors">
          Xem đơn hàng
        </Link>
        <Link to="/books"
          className="px-6 py-2.5 border border-divider text-[13px] font-medium text-ink rounded-lg hover:border-ink transition-colors">
          Tiếp tục mua sắm
        </Link>
      </div>
    </div>
  )

  return (
    <div className="max-w-[480px] mx-auto px-4 py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </div>
      <h1 className="font-display text-2xl font-semibold text-ink mb-2">Thanh toán đã hủy</h1>
      <p className="text-[14px] text-muted mb-8">Bạn đã hủy giao dịch. Đơn hàng vẫn được giữ, bạn có thể thanh toán lại sau.</p>
      <div className="flex gap-3 justify-center">
        <Link to="/account/orders"
          className="px-6 py-2.5 bg-ink text-white text-[13px] font-medium rounded-lg hover:bg-ink-80 transition-colors">
          Xem đơn hàng
        </Link>
        <Link to="/cart"
          className="px-6 py-2.5 border border-divider text-[13px] font-medium text-ink rounded-lg hover:border-ink transition-colors">
          Quay lại giỏ hàng
        </Link>
      </div>
    </div>
  )
}
