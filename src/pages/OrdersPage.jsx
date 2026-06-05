import { useEffect, useState } from 'react'
import { Link, useNavigate }   from 'react-router-dom'
import { api }                 from '../services/api'
import { useAuthStore }        from '../store/authStore'
import { useCartStore }        from '../store/cartStore'
import { useToastStore }       from '../store/toastStore'
import { ReviewForm }          from '../components/ui/ReviewForm'
import { formatPrice }         from '../utils/format'

const STATUS_LABEL = {
  PENDING:    { text: 'Chờ xác nhận',  color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  CONFIRMED:  { text: 'Đã xác nhận',   color: 'bg-blue-50 text-blue-700 border-blue-200' },
  PACKING:    { text: 'Đang đóng gói', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  SHIPPING:   { text: 'Đang giao',     color: 'bg-orange-50 text-orange-700 border-orange-200' },
  DELIVERED:  { text: 'Đã giao',       color: 'bg-green-50 text-green-700 border-green-200' },
  CANCELLED:  { text: 'Đã hủy',        color: 'bg-red-50 text-red-700 border-red-200' },
  RETURNED:   { text: 'Hoàn trả',      color: 'bg-gray-50 text-gray-600 border-gray-200' },
}

function StatusBadge({ status }) {
  const s = STATUS_LABEL[status] || { text: status, color: 'bg-surface-subtle text-muted border-divider-lt' }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${s.color}`}>
      {s.text}
    </span>
  )
}

export default function OrdersPage() {
  const isAuth    = useAuthStore(s => !!s.token)
  const addItem   = useCartStore(s => s.addItem)
  const showToast = useToastStore(s => s.show)
  const navigate  = useNavigate()

  const [orders, setOrders]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [reviewedKeys, setReviewedKeys] = useState(new Set())
  const [openReview, setOpenReview]     = useState(null) // `${orderId}:${productId}`

  useEffect(() => {
    if (!isAuth) {
      showToast({ message: 'Vui lòng đăng nhập để xem đơn hàng', type: 'error' })
      navigate('/auth/login', { replace: true, state: { from: '/account/orders' } })
      return
    }
    Promise.all([
      api.get('/api/orders'),
      api.get('/api/reviews/my-reviews'),
    ])
      .then(([ordersRes, reviewsRes]) => {
        setOrders(ordersRes.data)
        const keys = new Set(reviewsRes.data.map(r => `${r.order}:${r.product}`))
        setReviewedKeys(keys)
      })
      .catch(err => showToast({ message: err.message, type: 'error' }))
      .finally(() => setLoading(false))
  }, [])

  function handleReorder(order) {
    order.items.forEach(item => {
      addItem({
        _id:    item.product,
        title:  item.title,
        author: item.author,
        price:  item.price,
        image:  item.image,
        stock:  999,
      })
    })
    showToast({ message: 'Đã thêm vào giỏ hàng', type: 'success' })
    navigate('/cart')
  }

  async function handleCancel(orderId) {
    if (!confirm('Bạn có chắc muốn hủy đơn này?')) return
    try {
      await api.put(`/api/orders/${orderId}/cancel`)
      setOrders(prev => prev.map(o =>
        o._id === orderId ? { ...o, status: 'CANCELLED' } : o
      ))
      showToast({ message: 'Đã hủy đơn hàng', type: 'info' })
    } catch (err) {
      showToast({ message: err.message, type: 'error' })
    }
  }

  return (
    <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10 py-10 md:py-14">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-semibold text-ink">Đơn hàng của tôi</h1>
        <Link to="/books" className="text-sm text-muted hover:text-ink underline underline-offset-2 transition-colors">
          Tiếp tục mua sắm
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-32 bg-surface-subtle rounded-sm animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="py-20 text-center space-y-4">
          <p className="text-muted">Bạn chưa có đơn hàng nào</p>
          <Link
            to="/books"
            className="inline-block px-6 py-2.5 bg-ink text-white text-2xs font-semibold tracking-label-lg uppercase rounded-sm hover:bg-ink-80 transition-colors"
          >
            Mua sách ngay
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order._id} className="bg-white border border-divider-lt rounded-sm overflow-hidden">
              {/* Order header */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-divider-lt bg-surface-warm">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-muted font-mono">#{order._id.slice(-8).toUpperCase()}</span>
                  <StatusBadge status={order.status} />
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted">
                    {new Date(order.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </span>
                  <span className="font-semibold text-ink">{formatPrice(order.total)}</span>
                </div>
              </div>

              {/* Items */}
              <div className="px-5 py-4 space-y-4">
                {order.items.map((item, i) => {
                  const productId  = item.product?._id || item.product
                  const reviewKey  = `${order._id}:${productId}`
                  const alreadyReviewed = reviewedKeys.has(reviewKey)
                  const isReviewOpen    = openReview === reviewKey
                  return (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center gap-3">
                        {item.image && (
                          <img src={item.image} alt={item.title} className="w-10 h-[54px] object-cover rounded-sm flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink line-clamp-1">{item.title}</p>
                          <p className="text-xs text-muted">{item.author} · SL: {item.qty}</p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-sm text-ink">{formatPrice(item.price * item.qty)}</span>
                          {order.status === 'DELIVERED' && (
                            alreadyReviewed ? (
                              <span className="text-[11px] text-green-600 font-medium">Đã đánh giá</span>
                            ) : (
                              <button
                                onClick={() => setOpenReview(isReviewOpen ? null : reviewKey)}
                                className="text-[11px] font-medium text-accent hover:underline transition-colors"
                              >
                                {isReviewOpen ? 'Hủy' : 'Viết đánh giá'}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                      {isReviewOpen && (
                        <div className="ml-13 pl-3 border-l-2 border-divider-lt">
                          <ReviewForm
                            productId={productId}
                            orderId={order._id}
                            onSuccess={() => {
                              setReviewedKeys(prev => new Set([...prev, reviewKey]))
                              setOpenReview(null)
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Footer actions */}
              {((['PENDING', 'CONFIRMED'].includes(order.status)) || order.status === 'DELIVERED') && (
                <div className="px-5 py-3 border-t border-divider-lt flex justify-end gap-4">
                  {['PENDING', 'CONFIRMED'].includes(order.status) && (
                    <button
                      onClick={() => handleCancel(order._id)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium underline underline-offset-2 transition-colors"
                    >
                      Hủy đơn
                    </button>
                  )}
                  {order.status === 'DELIVERED' && (
                    <button
                      onClick={() => handleReorder(order)}
                      className="text-xs font-semibold tracking-label px-3 py-1.5 border border-ink text-ink rounded-sm hover:bg-ink hover:text-white transition-colors"
                    >
                      Mua lại
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
