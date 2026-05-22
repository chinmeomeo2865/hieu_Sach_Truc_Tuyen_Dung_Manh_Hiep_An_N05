import { useEffect, useState, useCallback } from 'react'
import { useSearchParams }   from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import WarehouseLayout from '../../components/warehouse/WarehouseLayout'
import { api }         from '../../services/api'
import { useToastStore } from '../../store/toastStore'
import { formatPrice }   from '../../utils/format'

const STATUS_CFG = {
  CONFIRMED: { label: 'Chờ đóng gói', color: 'bg-amber-50 text-amber-700 border-amber-200',  dot: 'bg-amber-400' },
  PACKING:   { label: 'Đang đóng gói', color: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-400' },
  SHIPPING:  { label: 'Đang giao',     color: 'bg-blue-50 text-blue-700 border-blue-200',       dot: 'bg-blue-400' },
  DELIVERED: { label: 'Đã giao',       color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400' },
}

const NEXT_STATUS = {
  CONFIRMED: { label: 'Bắt đầu đóng gói', next: 'PACKING',  icon: '📦' },
  PACKING:   { label: 'Bàn giao shipper', next: 'SHIPPING', icon: '🚚' },
  SHIPPING:  { label: 'Xác nhận đã giao', next: 'DELIVERED', icon: '✅' },
}

const TIMELINE_STEPS = [
  { status: 'CONFIRMED', label: 'Đã xác nhận',     icon: '✓' },
  { status: 'PACKING',   label: 'Đang đóng gói',   icon: '📦' },
  { status: 'SHIPPING',  label: 'Bàn giao vận chuyển', icon: '🚚' },
  { status: 'DELIVERED', label: 'Đã giao hàng',    icon: '🏠' },
]

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || { label: status, color: 'bg-gray-50 text-gray-600 border-gray-200', dot: 'bg-gray-400' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function Timeline({ order }) {
  const doneIdx = TIMELINE_STEPS.findIndex(s => s.status === order.status)
  return (
    <div className="flex items-start gap-0">
      {TIMELINE_STEPS.map((step, i) => {
        const done = i <= doneIdx
        const current = i === doneIdx
        const hist = order.statusHistory?.find(h => h.status === step.status)
        return (
          <div key={step.status} className="flex-1 relative">
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.08 }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 z-10 relative transition-all
                  ${done ? 'bg-[#1c1c1a] border-[#1c1c1a] text-white' : 'bg-white border-[#e8e8e6] text-[#c4c4c4]'}
                  ${current ? 'ring-4 ring-[#1c1c1a]/10' : ''}`}
              >
                {step.icon}
              </motion.div>
              {i < TIMELINE_STEPS.length - 1 && (
                <div className="absolute top-4 left-1/2 w-full h-0.5 z-0">
                  <div className="h-full bg-[#e8e8e6]" />
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: done && i < doneIdx ? '100%' : '0%' }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    className="h-full bg-[#1c1c1a] absolute top-0 left-0"
                  />
                </div>
              )}
            </div>
            <div className="mt-2 text-center px-1">
              <p className={`text-[10px] font-semibold ${done ? 'text-[#1c1c1a]' : 'text-[#c4c4c4]'}`}>{step.label}</p>
              {hist && (
                <p className="text-[9px] text-[#a3a3a3] mt-0.5">
                  {new Date(hist.changedAt).toLocaleString('vi-VN', { hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit' })}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function OrderDetail({ order, onUpdate, onClose }) {
  const showToast = useToastStore(s => s.show)
  const [updating, setUpdating] = useState(false)
  const nextCfg = NEXT_STATUS[order.status]

  async function advance() {
    if (!nextCfg) return
    setUpdating(true)
    try {
      await api.put(`/api/warehouse/orders/${order._id}/status`, { status: nextCfg.next })
      showToast({ message: `Đã cập nhật: ${nextCfg.label}`, type: 'success' })
      onUpdate(order._id, nextCfg.next)
    } catch (e) { showToast({ message: e.message, type: 'error' }) }
    finally { setUpdating(false) }
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[1px]" onClick={onClose} />
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed right-0 top-0 h-full w-[520px] bg-white z-50 shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f0f0] shrink-0">
          <div>
            <p className="text-[14px] font-semibold text-[#1c1c1a]">
              Đơn #{order._id.slice(-8).toUpperCase()}
            </p>
            <p className="text-[11px] text-[#a3a3a3] mt-0.5">
              {new Date(order.createdAt).toLocaleString('vi-VN')}
            </p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f5f5f4] text-[#a3a3a3] transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Timeline */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#a3a3a3] mb-4">Tiến trình đơn hàng</p>
              <Timeline order={order} />
            </div>

            {/* Customer */}
            <div className="bg-[#fafafa] rounded-xl p-4 border border-[#f0f0f0]">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#a3a3a3] mb-3">Thông tin khách hàng</p>
              <p className="text-[13px] font-semibold text-[#1c1c1a]">{order.address?.name || order.user?.name}</p>
              <p className="text-[12px] text-[#737373] mt-0.5">{order.address?.phone || order.user?.phone}</p>
              {order.address && (
                <p className="text-[12px] text-[#737373] mt-1">
                  {order.address.street}, {order.address.city}
                </p>
              )}
            </div>

            {/* Items */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#a3a3a3] mb-3">Danh sách sản phẩm</p>
              <div className="space-y-3">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex gap-3 p-3 border border-[#f0f0f0] rounded-xl">
                    {item.image && (
                      <img src={item.image} alt={item.title} className="w-12 h-16 object-cover rounded-lg bg-[#f5f5f4] shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-semibold text-[#1c1c1a] line-clamp-2">{item.title}</p>
                      <p className="text-[11px] text-[#a3a3a3] mt-0.5">{item.author}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[12px] font-bold text-[#1c1c1a]">×{item.qty}</span>
                        <span className="text-[12px] text-[#737373]">{formatPrice(item.price)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#f0f0f0]">
                <span className="text-[13px] font-semibold text-[#1c1c1a]">Tổng cộng</span>
                <span className="text-[15px] font-bold text-[#1c1c1a]">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {nextCfg && (
          <div className="px-6 py-4 border-t border-[#f0f0f0] shrink-0">
            <button onClick={advance} disabled={updating}
              className="w-full py-3 bg-[#1c1c1a] text-white text-[13px] font-semibold rounded-xl hover:bg-[#333] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {updating
                ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg> Đang cập nhật…</>
                : <>{nextCfg.icon} {nextCfg.label}</>}
            </button>
          </div>
        )}
      </motion.div>
    </>
  )
}

const TABS = [
  { status: '', label: 'Tất cả' },
  { status: 'CONFIRMED', label: 'Chờ đóng gói' },
  { status: 'PACKING',   label: 'Đang đóng gói' },
  { status: 'SHIPPING',  label: 'Đang giao' },
]

export default function WarehouseOrdersPage() {
  const showToast = useToastStore(s => s.show)
  const [searchParams, setSearchParams] = useSearchParams()
  const [orders,      setOrders]      = useState([])
  const [loading,     setLoading]     = useState(true)
  const [selected,    setSelected]    = useState(null)
  const [page,        setPage]        = useState(1)
  const [pagination,  setPagination]  = useState({})

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
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-[#e8e8e6] rounded-xl p-1 w-fit">
          {TABS.map(t => (
            <button key={t.status}
              onClick={() => setSearchParams(t.status ? { status: t.status } : {})}
              className={`px-4 py-1.5 rounded-lg text-[12.5px] font-semibold transition-colors ${activeStatus === t.status ? 'bg-[#1c1c1a] text-white' : 'text-[#737373] hover:text-[#1c1c1a]'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-[#e8e8e6] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#f0f0f0]">
                {['Mã đơn', 'Khách hàng', 'Sản phẩm', 'Tổng tiền', 'Trạng thái', 'Ngày tạo', ''].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left text-[10.5px] font-bold uppercase tracking-wider text-[#a3a3a3]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-t border-[#f5f5f4] animate-pulse">
                    {[80, 120, 140, 80, 100, 80, 40].map((w, j) => (
                      <td key={j} className="px-4 py-3.5"><div className="h-3.5 bg-[#f0f0f0] rounded-full" style={{ width: w }}/></td>
                    ))}
                  </tr>
                ))
                : orders.length === 0
                  ? (
                    <tr><td colSpan={7} className="py-20 text-center">
                      <p className="text-[14px] font-semibold text-[#1c1c1a]">Không có đơn hàng</p>
                      <p className="text-[12px] text-[#a3a3a3] mt-1">
                        {activeStatus ? 'Không có đơn ở trạng thái này' : 'Tất cả đơn đã được xử lý'}
                      </p>
                    </td></tr>
                  )
                  : orders.map(o => (
                    <tr key={o._id} onClick={() => setSelected(o)}
                      className="border-t border-[#f5f5f4] hover:bg-[#fafafa] cursor-pointer transition-colors">
                      <td className="px-4 py-3.5">
                        <span className="text-[12px] font-mono font-bold text-[#1c1c1a]">#{o._id.slice(-8).toUpperCase()}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-[12.5px] font-semibold text-[#1c1c1a]">{o.user?.name || o.address?.name}</p>
                        <p className="text-[11px] text-[#a3a3a3]">{o.user?.phone || o.address?.phone}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-[12px] text-[#525252]">{o.items?.length} sản phẩm</p>
                        <p className="text-[11px] text-[#a3a3a3] truncate max-w-[160px]">
                          {o.items?.map(i => i.title).join(', ')}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-[12.5px] font-bold text-[#1c1c1a]">{formatPrice(o.total)}</td>
                      <td className="px-4 py-3.5"><StatusBadge status={o.status} /></td>
                      <td className="px-4 py-3.5 text-[11px] text-[#a3a3a3]">
                        {new Date(o.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-4 py-3.5">
                        <svg className="w-4 h-4 text-[#d4d4d4]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#f0f0f0]">
              <p className="text-[11px] text-[#a3a3a3]">Trang {pagination.page} / {pagination.totalPages} · {pagination.total} đơn</p>
              <div className="flex gap-1.5">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-[11px] border border-[#e8e8e6] rounded-lg disabled:opacity-40 hover:border-[#1c1c1a] transition-colors">← Trước</button>
                <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-[11px] border border-[#e8e8e6] rounded-lg disabled:opacity-40 hover:border-[#1c1c1a] transition-colors">Tiếp →</button>
              </div>
            </div>
          )}
        </div>
      </div>

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
