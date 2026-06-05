import { useEffect, useState, useCallback } from 'react'
import { api }          from '../../services/api'
import { useToastStore } from '../../store/toastStore'
import { formatPrice }  from '../../utils/format'
import AdminLayout      from '../../components/admin/AdminLayout'

const STATUS_LABEL = {
  PENDING:   { text: 'Chờ xác nhận',  color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  CONFIRMED: { text: 'Đã xác nhận',   color: 'bg-blue-50 text-blue-700 border-blue-200' },
  PACKING:   { text: 'Đang đóng gói', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  SHIPPING:  { text: 'Đang giao',     color: 'bg-orange-50 text-orange-700 border-orange-200' },
  DELIVERED: { text: 'Đã giao',       color: 'bg-green-50 text-green-700 border-green-200' },
  CANCELLED: { text: 'Đã hủy',        color: 'bg-red-50 text-red-700 border-red-200' },
  RETURNED:  { text: 'Hoàn trả',      color: 'bg-gray-50 text-gray-600 border-gray-200' },
}

const NEXT_ACTION = {
  PENDING:   { label: 'Xác nhận đơn',     next: 'CONFIRMED' },
  CONFIRMED: { label: 'Bắt đầu đóng gói', next: 'PACKING'   },
  PACKING:   { label: 'Giao vận chuyển',  next: 'SHIPPING'  },
  SHIPPING:  { label: 'Đánh dấu đã giao', next: 'DELIVERED' },
}

const CAN_CANCEL = ['PENDING', 'CONFIRMED']

const FILTER_TABS = [
  { value: 'all',       label: 'Tất cả' },
  { value: 'PENDING',   label: 'Chờ xác nhận' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
  { value: 'PACKING',   label: 'Đóng gói' },
  { value: 'SHIPPING',  label: 'Đang giao' },
  { value: 'DELIVERED', label: 'Đã giao' },
  { value: 'CANCELLED', label: 'Đã hủy' },
]

const LIMIT = 20

function StatusBadge({ status }) {
  const s = STATUS_LABEL[status] || { text: status, color: 'bg-surface-subtle text-muted border-divider-lt' }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${s.color}`}>
      {s.text}
    </span>
  )
}

function StatCard({ label, value, highlight }) {
  return (
    <div className={`bg-white border rounded-sm px-5 py-4 ${highlight ? 'border-yellow-200' : 'border-divider-lt'}`}>
      <p className="text-2xs font-semibold tracking-label-lg uppercase text-muted mb-1">{label}</p>
      <p className={`font-display text-2xl font-semibold ${highlight ? 'text-yellow-600' : 'text-ink'}`}>{value}</p>
    </div>
  )
}

export default function AdminOrdersPage() {
  const showToast = useToastStore(s => s.show)

  const [orders, setOrders]         = useState([])
  const [stats, setStats]           = useState({ total: 0, pending: 0, shipping: 0, delivered: 0 })
  const [loading, setLoading]       = useState(true)
  const [actionLoading, setAction]  = useState(null) // orderId being updated
  const [statusFilter, setFilter]   = useState('all')
  const [page, setPage]             = useState(1)
  const [pagination, setPagination] = useState(null)
  const [expanded, setExpanded]     = useState(null) // orderId of expanded detail

  const fetchOrders = useCallback(async (status, pg) => {
    setLoading(true)
    try {
      const qs = new URLSearchParams({ page: pg, limit: LIMIT })
      if (status !== 'all') qs.set('status', status)
      const res = await api.get(`/api/orders/admin/all?${qs}`)
      setOrders(res.data)
      setPagination(res.pagination || null)
    } catch (err) {
      showToast({ message: err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [showToast])

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/api/orders/admin/all?limit=1000')
      const all = res.data
      const today = new Date().toDateString()
      setStats({
        total:     all.length,
        pending:   all.filter(o => o.status === 'PENDING').length,
        shipping:  all.filter(o => o.status === 'SHIPPING').length,
        delivered: all.filter(o => o.status === 'DELIVERED' && new Date(o.updatedAt).toDateString() === today).length,
      })
    } catch {}
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  useEffect(() => {
    fetchOrders(statusFilter, page)
  }, [statusFilter, page, fetchOrders])

  function handleFilterChange(val) {
    setFilter(val)
    setPage(1)
    setExpanded(null)
  }

  async function handleNextStatus(orderId, nextStatus) {
    setAction(orderId)
    try {
      await api.put(`/api/orders/${orderId}/status`, { status: nextStatus })
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: nextStatus } : o))
      showToast({ message: `Đã cập nhật trạng thái: ${STATUS_LABEL[nextStatus]?.text}`, type: 'success' })
      fetchStats()
    } catch (err) {
      showToast({ message: err.message, type: 'error' })
    } finally {
      setAction(null)
    }
  }

  async function handleCancel(orderId) {
    if (!confirm('Xác nhận hủy đơn hàng này?')) return
    setAction(orderId)
    try {
      await api.put(`/api/orders/${orderId}/cancel`)
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: 'CANCELLED' } : o))
      showToast({ message: 'Đã hủy đơn hàng', type: 'info' })
      fetchStats()
    } catch (err) {
      showToast({ message: err.message, type: 'error' })
    } finally {
      setAction(null)
    }
  }

  return (
    <AdminLayout title="Quản lý đơn hàng">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Tổng đơn"            value={stats.total}     />
        <StatCard label="Chờ xác nhận"        value={stats.pending}   highlight={stats.pending > 0} />
        <StatCard label="Đang giao"           value={stats.shipping}  />
        <StatCard label="Đã giao hôm nay"     value={stats.delivered} />
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => handleFilterChange(tab.value)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-label transition-colors ${
              statusFilter === tab.value
                ? 'bg-ink text-white'
                : 'bg-white border border-divider-lt text-ink-60 hover:border-divider hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-24 bg-white border border-divider-lt rounded-sm animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-divider-lt rounded-sm py-20 text-center">
          <p className="text-muted text-sm">Không có đơn hàng nào</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {orders.map(order => {
            const action    = NEXT_ACTION[order.status]
            const canCancel = CAN_CANCEL.includes(order.status)
            const isExpanded = expanded === order._id
            const busy = actionLoading === order._id

            return (
              <div key={order._id} className="bg-white border border-divider-lt rounded-sm overflow-hidden">
                {/* Row header — always visible */}
                <div
                  className="flex flex-wrap items-center gap-3 px-5 py-3.5 cursor-pointer select-none hover:bg-surface-warm transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : order._id)}
                >
                  {/* ID + Status */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <svg className={`w-3.5 h-3.5 text-muted shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-xs text-muted font-mono">{order.orderCode || `#${order._id.slice(-8).toUpperCase()}`}</span>
                    <StatusBadge status={order.status} />
                  </div>

                  {/* Customer */}
                  <div className="hidden sm:block min-w-0 w-40">
                    <p className="text-xs font-medium text-ink truncate">{order.address?.name || order.user?.name || '—'}</p>
                    <p className="text-[11px] text-muted truncate">{order.address?.phone || ''}</p>
                  </div>

                  {/* Items count */}
                  <p className="hidden md:block text-xs text-muted w-24 shrink-0">
                    {order.items.reduce((s, i) => s + i.qty, 0)} cuốn
                  </p>

                  {/* Total + date */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-ink">{formatPrice(order.total)}</p>
                    <p className="text-[11px] text-muted">
                      {new Date(order.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </p>
                  </div>

                  {/* Action buttons — stop propagation so click doesn't toggle expand */}
                  <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                    {action && (
                      <button
                        disabled={busy}
                        onClick={() => handleNextStatus(order._id, action.next)}
                        className="px-3 py-1.5 bg-ink text-white text-[11px] font-semibold tracking-label rounded-sm hover:bg-ink-80 disabled:opacity-50 transition-colors whitespace-nowrap"
                      >
                        {busy ? '…' : action.label}
                      </button>
                    )}
                    {canCancel && (
                      <button
                        disabled={busy}
                        onClick={() => handleCancel(order._id)}
                        className="px-3 py-1.5 text-[11px] font-semibold text-red-500 border border-red-200 rounded-sm hover:bg-red-50 disabled:opacity-50 transition-colors whitespace-nowrap"
                      >
                        Hủy
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-divider-lt px-5 py-4 bg-surface-warm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Items */}
                      <div>
                        <p className="text-2xs font-semibold tracking-label-lg uppercase text-muted mb-3">Sản phẩm</p>
                        <div className="space-y-2.5">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                              {item.image && (
                                <img src={item.image} alt={item.title} className="w-9 h-12 object-cover rounded-sm shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-ink line-clamp-1">{item.title}</p>
                                <p className="text-[11px] text-muted">{item.author} · x{item.qty}</p>
                              </div>
                              <span className="text-xs text-ink shrink-0">{formatPrice(item.price * item.qty)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 pt-3 border-t border-divider-lt flex justify-between">
                          <span className="text-xs text-muted">Tổng cộng</span>
                          <span className="text-sm font-semibold text-ink">{formatPrice(order.total)}</span>
                        </div>
                      </div>

                      {/* Delivery + payment info */}
                      <div className="space-y-4">
                        <div>
                          <p className="text-2xs font-semibold tracking-label-lg uppercase text-muted mb-2">Giao hàng</p>
                          <p className="text-xs font-medium text-ink">{order.address?.name}</p>
                          <p className="text-xs text-muted">{order.address?.phone}</p>
                          <p className="text-xs text-muted mt-0.5">{order.address?.street}, {order.address?.city}</p>
                        </div>
                        <div>
                          <p className="text-2xs font-semibold tracking-label-lg uppercase text-muted mb-2">Thanh toán</p>
                          <p className="text-xs text-ink">
                            {order.payment === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : 'Thanh toán online'}
                          </p>
                        </div>
                        {order.note && (
                          <div>
                            <p className="text-2xs font-semibold tracking-label-lg uppercase text-muted mb-2">Ghi chú</p>
                            <p className="text-xs text-ink-60 italic">"{order.note}"</p>
                          </div>
                        )}
                        {order.user && (
                          <div>
                            <p className="text-2xs font-semibold tracking-label-lg uppercase text-muted mb-2">Khách hàng</p>
                            <p className="text-xs text-ink">{order.user.name}</p>
                            <p className="text-xs text-muted">{order.user.email}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-xs text-muted">
            Trang {pagination.page}/{pagination.totalPages} · {pagination.total} đơn
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 text-xs font-semibold border border-divider-lt rounded-sm text-ink-60 hover:border-divider hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Trước
            </button>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 text-xs font-semibold border border-divider-lt rounded-sm text-ink-60 hover:border-divider hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Tiếp →
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
