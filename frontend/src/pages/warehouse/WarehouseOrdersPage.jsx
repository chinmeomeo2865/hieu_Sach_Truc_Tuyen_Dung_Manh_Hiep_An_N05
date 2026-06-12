import { useEffect, useState, useCallback } from 'react'
import { useSearchParams }   from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import WarehouseLayout from '../../components/warehouse/WarehouseLayout'
import { api }         from '../../services/api'
import { useToastStore } from '../../store/toastStore'
import { formatPrice }   from '../../utils/format'

/* ── Config ─────────────────────────────────────────────────── */
const STATUS_CFG = {
  CONFIRMED: {
    label: 'Chờ đóng gói',
    bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA', dot: '#F97316',
  },
  PACKING: {
    label: 'Đang đóng gói',
    bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE', dot: '#7C3AED',
  },
  SHIPPING: {
    label: 'Đang giao',
    bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', dot: '#3B82F6',
  },
  DELIVERED: {
    label: 'Đã giao',
    bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0', dot: '#22C55E',
  },
}

const NEXT_STATUS = {
  CONFIRMED: { label: 'Bắt đầu đóng gói', next: 'PACKING',   color: '#7C3AED' },
  PACKING:   { label: 'Bàn giao shipper',  next: 'SHIPPING',  color: '#1D4ED8' },
  SHIPPING:  { label: 'Xác nhận đã giao',  next: 'DELIVERED', color: '#15803D' },
}

const TIMELINE_STEPS = [
  { status: 'CONFIRMED', label: 'Xác nhận' },
  { status: 'PACKING',   label: 'Đóng gói' },
  { status: 'SHIPPING',  label: 'Vận chuyển' },
  { status: 'DELIVERED', label: 'Đã giao' },
]

const TABS = [
  { status: '',          label: 'Tất cả' },
  { status: 'CONFIRMED', label: 'Chờ đóng gói' },
  { status: 'PACKING',   label: 'Đang đóng gói' },
  { status: 'SHIPPING',  label: 'Đang giao' },
]

/* ── Sub-components ─────────────────────────────────────────── */
function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status]
  if (!cfg) return null
  return (
    <span style={{ background: cfg.bg, color: cfg.text, borderColor: cfg.border }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border whitespace-nowrap">
      <span style={{ background: cfg.dot }} className="w-1.5 h-1.5 rounded-full shrink-0" />
      {cfg.label}
    </span>
  )
}

function PaymentBadge({ payment, paymentStatus }) {
  const paid = paymentStatus === 'PAID'
  if (payment === 'COD') {
    return (
      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${paid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
        COD · {paid ? 'Đã thu' : 'Chưa thu'}
      </span>
    )
  }
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${paid ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
      Online · {paid ? 'Đã TT' : 'Chưa TT'}
    </span>
  )
}

function Timeline({ order }) {
  const doneIdx = TIMELINE_STEPS.findIndex(s => s.status === order.status)
  return (
    <div className="flex items-center">
      {TIMELINE_STEPS.map((step, i) => {
        const done    = i <= doneIdx
        const current = i === doneIdx
        const hist    = order.statusHistory?.find(h => h.status === step.status)
        const cfg     = STATUS_CFG[step.status]
        return (
          <div key={step.status} className="flex-1 flex flex-col items-center relative">
            {/* connector line */}
            {i < TIMELINE_STEPS.length - 1 && (
              <div className="absolute top-3 left-1/2 w-full h-0.5 z-0">
                <div className="h-full bg-divider-lt" />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: done && i < doneIdx ? '100%' : '0%' }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="h-full bg-ink absolute top-0 left-0"
                />
              </div>
            )}
            {/* dot */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.1, type: 'spring', stiffness: 300 }}
              className={`relative z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                ${done ? 'border-current' : 'bg-white border-divider-lt'}
                ${current ? 'ring-4 ring-offset-1' : ''}`}
              style={
                current
                  ? { background: cfg?.dot, borderColor: cfg?.dot, '--tw-ring-color': cfg?.dot ? `${cfg.dot}33` : undefined }
                  : done
                  ? { background: cfg?.dot || '#1c1c1a', borderColor: cfg?.dot || '#1c1c1a' }
                  : {}
              }
            >
              {done ? (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-subtle" />
              )}
            </motion.div>
            {/* label */}
            <div className="mt-2 text-center">
              <p className={`text-[10px] font-semibold ${done ? 'text-ink' : 'text-subtle'}`}>{step.label}</p>
              {hist && (
                <p className="text-[9px] text-subtle mt-0.5 tabular-nums">
                  {new Date(hist.changedAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Order Detail Slide-over ────────────────────────────────── */
function OrderDetail({ order, onUpdate, onClose }) {
  const showToast = useToastStore(s => s.show)
  const [updating, setUpdating] = useState(false)
  const nextCfg = NEXT_STATUS[order.status]

  async function advance() {
    if (!nextCfg) return
    setUpdating(true)
    try {
      await api.put(`/api/warehouse/orders/${order._id}/status`, { status: nextCfg.next })
      showToast({ message: 'Cập nhật trạng thái thành công', type: 'success' })
      onUpdate(order._id, nextCfg.next)
    } catch (e) { showToast({ message: e.message, type: 'error' }) }
    finally { setUpdating(false) }
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-[#1a1714]/40 backdrop-blur-[2px]" onClick={onClose} />
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 320 }}
        className="fixed right-0 top-0 h-full w-[500px] bg-white z-50 shadow-card-h border-l border-divider-lt flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-divider-lt shrink-0">
          <div>
            <p className="text-[13px] font-mono font-bold text-ink tracking-wide">
              {order.orderCode || `#${order._id.slice(-8).toUpperCase()}`}
            </p>
            <p className="text-[11px] text-muted mt-0.5">
              {new Date(order.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
            <div className="mt-2">
              <StatusBadge status={order.status} />
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-subtle text-subtle hover:text-ink transition-colors mt-0.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">

            {/* Timeline */}
            <section>
              <p className="text-[10px] font-bold uppercase tracking-widest text-subtle mb-4">Tiến trình</p>
              <Timeline order={order} />
            </section>

            {/* Divider */}
            <div className="h-px bg-divider-lt" />

            {/* Customer */}
            <section className="bg-surface-warm/30 rounded-xl p-4 border border-divider-lt">
              <p className="text-[10px] font-bold uppercase tracking-widest text-subtle mb-3">Người nhận</p>
              <div className="space-y-1">
                <p className="text-[13px] font-bold text-ink">{order.address?.name || order.user?.name}</p>
                <p className="text-[12px] text-ink-80 tabular-nums">{order.address?.phone || order.user?.phone}</p>
                {order.address && (
                  <p className="text-[12px] text-ink-80 leading-relaxed">
                    {order.address.street}, {order.address.city}
                  </p>
                )}
              </div>
            </section>

            {/* Items */}
            <section>
              <p className="text-[10px] font-bold uppercase tracking-widest text-subtle mb-3">
                Sản phẩm ({order.items?.length})
              </p>
              <div className="space-y-2">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex gap-3.5 p-3.5 border border-divider-lt rounded-xl hover:border-divider transition-colors bg-white shadow-sm">
                    {item.image && (
                      <img src={item.image} alt={item.title}
                        className="w-11 h-15 object-cover rounded-lg bg-surface-warm shrink-0 shadow-sm border border-divider-lt/30" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-bold text-ink line-clamp-2 leading-snug">{item.title}</p>
                      <p className="text-[11px] text-subtle mt-0.5">{item.author}</p>
                      <div className="flex items-center justify-between mt-2.5">
                        <span className="text-[11px] bg-surface-subtle text-ink-80 font-bold px-2 py-0.5 rounded-md">×{item.qty}</span>
                        <span className="text-[12.5px] font-bold text-ink tabular-nums">{formatPrice(item.price)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-divider-lt">
                <span className="text-[12.5px] text-ink-80">Tổng cộng</span>
                <span className="text-[16px] font-bold text-ink tabular-nums">{formatPrice(order.total)}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-[12.5px] text-ink-80">Thanh toán</span>
                <PaymentBadge payment={order.payment} paymentStatus={order.paymentStatus} />
              </div>
            </section>

          </div>
        </div>

        {/* Action Footer */}
        {nextCfg ? (
          <div className="px-6 py-4 border-t border-divider-lt shrink-0 bg-white">
            <button onClick={advance} disabled={updating}
              style={{ background: nextCfg.color }}
              className="w-full py-3 text-white text-[13px] font-bold rounded-xl hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
              {updating
                ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg> Đang cập nhật…</>
                : nextCfg.label
              }
            </button>
          </div>
        ) : order.status === 'DELIVERED' ? (
          <div className="px-6 py-4 border-t border-divider-lt shrink-0 bg-white">
            <div className="w-full py-3 bg-emerald-50 text-emerald-800 text-[13px] font-bold rounded-xl text-center border border-emerald-100">
              ✓ Đơn hàng đã giao thành công
            </div>
          </div>
        ) : null}
      </motion.div>
    </>
  )
}

/* ── Main Page ──────────────────────────────────────────────── */
export default function WarehouseOrdersPage() {
  const showToast = useToastStore(s => s.show)
  const [searchParams, setSearchParams] = useSearchParams()
  const [orders,     setOrders]     = useState([])
  const [loading,    setLoading]    = useState(true)
  const [selected,   setSelected]   = useState(null)
  const [page,       setPage]       = useState(1)
  const [pagination, setPagination] = useState({})

  const activeStatus = searchParams.get('status') || ''

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 20 })
      if (activeStatus) params.set('status', activeStatus)
      const res = await api.get(`/api/warehouse/orders?${params}`)
      setOrders(res.data)
      setPagination(res.pagination || {})
    } catch (e) { showToast({ message: e.message, type: 'error' }) }
    finally { setLoading(false) }
  }, [page, activeStatus])

  useEffect(() => { fetchOrders() }, [fetchOrders])
  useEffect(() => { setPage(1) }, [activeStatus])

  function handleUpdate(id, newStatus) {
    setOrders(prev => prev.map(o => o._id === id ? { ...o, status: newStatus } : o))
    setSelected(prev => prev?._id === id ? { ...prev, status: newStatus } : prev)
  }

  return (
    <WarehouseLayout title="Xử lý đơn hàng">
      <div className="space-y-6">
        {/* Title and header */}
        <div className="flex flex-col gap-1.5">
          <h1 className="font-display text-2xl font-bold text-ink leading-tight">Xử lý đơn hàng</h1>
          <p className="text-[12px] text-muted font-medium">Theo dõi, nhặt hàng, đóng gói và bàn giao đơn hàng cho đơn vị vận chuyển.</p>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1.5 bg-white border border-divider-lt rounded-2xl p-1 w-fit shadow-sm">
          {TABS.map(t => (
            <button key={t.status}
              onClick={() => setSearchParams(t.status ? { status: t.status } : {})}
              className={`px-4 py-1.5 rounded-lg text-[12px] font-bold tracking-wide transition-all duration-200
                ${activeStatus === t.status
                  ? 'bg-ink text-white shadow-card'
                  : 'text-ink-80 hover:text-ink hover:bg-surface-subtle'
                }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Table ── */}
        <div className="bg-white rounded-2xl border border-divider-lt overflow-hidden shadow-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-divider-lt bg-surface-warm/30">
                <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-subtle">Mã đơn</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-subtle">Khách hàng</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-subtle">Sản phẩm</th>
                <th className="px-5 py-3.5 text-right text-[10px] font-bold uppercase tracking-widest text-subtle">Tổng tiền</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-subtle">Trạng thái</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-subtle">Ngày tạo</th>
                <th className="px-3 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-t border-divider-lt/50 animate-pulse">
                    {[90, 130, 160, 80, 110, 80, 20].map((w, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3.5 bg-surface-subtle rounded-full" style={{ width: w }} />
                      </td>
                    ))}
                  </tr>
                ))
                : orders.length === 0
                  ? (
                    <tr><td colSpan={7}>
                      <div className="py-24 flex flex-col items-center gap-3 bg-white">
                        <div className="w-14 h-14 rounded-2xl bg-surface-warm border border-divider-lt flex items-center justify-center">
                          <svg className="w-7 h-7 text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
                          </svg>
                        </div>
                        <div className="text-center">
                          <p className="text-[14px] font-bold text-ink">Không có đơn hàng</p>
                          <p className="text-[12px] text-muted mt-1">
                            {activeStatus ? 'Không có đơn ở trạng thái này' : 'Tất cả đơn đã được xử lý'}
                          </p>
                        </div>
                      </div>
                    </td></tr>
                  )
                  : orders.map((o, idx) => (
                    <motion.tr key={o._id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04, duration: 0.2 }}
                      onClick={() => setSelected(o)}
                      className="border-t border-divider-lt hover:bg-surface-warm/30 cursor-pointer transition-colors duration-200 group"
                    >
                      {/* Mã đơn */}
                      <td className="px-5 py-4">
                        <span className="text-[12px] font-mono font-bold text-ink tracking-wide">
                          {o.orderCode || `#${o._id.slice(-8).toUpperCase()}`}
                        </span>
                      </td>

                      {/* Khách hàng */}
                      <td className="px-5 py-4">
                        <p className="text-[12.5px] font-bold text-ink leading-tight">
                          {o.user?.name || o.address?.name || '—'}
                        </p>
                        <p className="text-[11px] text-muted mt-0.5 tabular-nums">
                          {o.user?.phone || o.address?.phone || ''}
                        </p>
                      </td>

                      {/* Sản phẩm */}
                      <td className="px-5 py-4">
                        <p className="text-[12px] font-semibold text-ink-80">
                          {o.items?.length} sản phẩm
                        </p>
                        <p className="text-[11px] text-muted mt-0.5 truncate max-w-[180px]">
                          {o.items?.map(i => i.title).join(', ')}
                        </p>
                      </td>

                      {/* Tổng tiền */}
                      <td className="px-5 py-4 text-right">
                        <span className="text-[13px] font-bold text-ink tabular-nums">
                          {formatPrice(o.total)}
                        </span>
                      </td>

                      {/* Trạng thái */}
                      <td className="px-5 py-4">
                        <StatusBadge status={o.status} />
                      </td>

                      {/* Ngày tạo */}
                      <td className="px-5 py-4">
                        <span className="text-[11.5px] text-muted font-semibold tabular-nums">
                          {new Date(o.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>
                      </td>

                      {/* Arrow */}
                      <td className="px-3 py-4">
                        <svg className="w-4 h-4 text-subtle group-hover:text-ink transition-colors duration-200"
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </td>
                    </motion.tr>
                  ))
              }
            </tbody>
          </table>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-divider-lt bg-surface-warm/20">
              <p className="text-[11px] text-muted font-semibold tabular-nums">
                Trang {pagination.page}/{pagination.totalPages} · {pagination.total} đơn
              </p>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 text-[11px] font-bold border border-divider-lt rounded-xl bg-white disabled:opacity-40 hover:border-ink transition-colors duration-200 disabled:cursor-not-allowed">
                  ← Trước
                </button>
                <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 text-[11px] font-bold border border-divider-lt rounded-xl bg-white disabled:opacity-40 hover:border-ink transition-colors duration-200 disabled:cursor-not-allowed">
                  Tiếp →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Slide-over Detail */}
      <AnimatePresence>
        {selected && (
          <OrderDetail key={selected._id} order={selected}
            onUpdate={handleUpdate}
            onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </WarehouseLayout>
  )
}
