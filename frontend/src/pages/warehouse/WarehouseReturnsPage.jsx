import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import WarehouseLayout from '../../components/warehouse/WarehouseLayout'
import { api }         from '../../services/api'
import { useToastStore } from '../../store/toastStore'
import { formatPrice }   from '../../utils/format'

const TABS = [
  { status: '', label: 'Tất cả' },
  { status: 'CANCELLED', label: 'Đã hủy' },
  { status: 'RETURNED', label: 'Hoàn trả' },
]

const DAMAGE_REASONS = ['Rách/hỏng', 'Móp méo', 'Ẩm mốc', 'Lỗi in ấn', 'Giao sai sản phẩm', 'Khác']

function ReturnModal({ order, onClose, onSuccess }) {
  const showToast = useToastStore(s => s.show)
  const [items, setItems]       = useState(order.items?.map(i => ({ ...i, condition: 'ok', damageReason: '' })) || [])
  const [notes, setNotes]       = useState('')
  const [loading, setLoading]   = useState(false)

  function setItemCond(idx, field, val) {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it))
  }

  async function handleSubmit() {
    setLoading(true)
    try {
      const restockItems  = items.filter(i => i.condition === 'ok').map(i => ({ productId: i.product?._id || i.product, quantity: i.qty }))
      const damagedItems  = items.filter(i => i.condition === 'damaged').map(i => ({ productId: i.product?._id || i.product, quantity: i.qty, reason: i.damageReason || 'Hàng lỗi' }))
      await api.post(`/api/warehouse/returns/${order._id}/process`, { restockItems, damagedItems, notes })
      showToast({ message: 'Đã xử lý hoàn trả thành công', type: 'success' })
      onSuccess()
    } catch (e) { showToast({ message: e.message, type: 'error' }) }
    finally { setLoading(false) }
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-[#1a1714]/40 backdrop-blur-[2px]" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 12 }}
        transition={{ type: 'spring', duration: 0.4 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="bg-white rounded-2xl shadow-card-h border border-divider-lt w-full max-w-lg pointer-events-auto max-h-[85vh] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-divider-lt shrink-0">
            <p className="font-display text-[15px] font-bold text-ink">
              Xử lý hoàn trả — <span className="font-mono tracking-wide">{order.orderCode || `#${order._id.slice(-8).toUpperCase()}`}</span>
            </p>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-subtle text-subtle hover:text-ink transition-colors duration-200">
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <p className="text-[11px] text-muted font-semibold uppercase tracking-wider mb-1">Kiểm tra từng sản phẩm và chọn tình trạng nhận lại:</p>

            {items.map((item, idx) => (
              <div key={idx} className="border border-divider-lt rounded-xl p-4 bg-surface-warm/30 space-y-3">
                <div className="flex gap-3.5">
                  {item.image && <img src={item.image} alt="" className="w-9 h-13 object-cover rounded-lg bg-surface-warm shrink-0 shadow-sm border border-divider-lt/40"/>}
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-bold text-ink leading-snug line-clamp-1">{item.title}</p>
                    <p className="text-[11px] text-muted mt-0.5 font-medium">Số lượng: <span className="font-bold">{item.qty}</span> · {formatPrice(item.price)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setItemCond(idx, 'condition', 'ok')}
                    className={`flex-1 py-2 rounded-lg text-[11px] font-bold border transition-all duration-200 ${item.condition === 'ok' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'border-divider-lt text-ink-80 hover:bg-surface-subtle'}`}>
                    ✓ Nguyên vẹn — nhập lại
                  </button>
                  <button onClick={() => setItemCond(idx, 'condition', 'damaged')}
                    className={`flex-1 py-2 rounded-lg text-[11px] font-bold border transition-all duration-200 ${item.condition === 'damaged' ? 'bg-red-600 text-white border-red-600 shadow-sm' : 'border-divider-lt text-ink-80 hover:bg-surface-subtle'}`}>
                    ✗ Hàng lỗi — xuất hủy
                  </button>
                </div>
                {item.condition === 'damaged' && (
                  <select value={item.damageReason} onChange={e => setItemCond(idx, 'damageReason', e.target.value)}
                    className="w-full px-3 py-1.5 border border-divider-lt rounded-xl text-[11px] font-bold focus:outline-none focus:border-ink bg-white shadow-sm">
                    <option value="">Chọn lý do lỗi…</option>
                    {DAMAGE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                )}
              </div>
            ))}

            <div>
              <label className="block text-[10px] font-bold text-ink-80 uppercase tracking-widest mb-1.5">Ghi chú biên bản</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                placeholder="Ghi chú thêm về biên bản kiểm hàng hoàn..."
                className="w-full px-4 py-2.5 border border-divider-lt rounded-xl text-[12.5px] font-medium focus:outline-none focus:border-ink resize-none transition-colors duration-200"/>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-divider-lt shrink-0 flex gap-3 bg-surface-warm/20">
            <button onClick={onClose} className="flex-1 py-2.5 border border-divider-lt rounded-xl text-[12.5px] font-bold text-ink-80 hover:bg-surface-warm transition-colors duration-200">Hủy</button>
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 py-2.5 bg-ink text-white rounded-xl text-[12.5px] font-bold hover:bg-ink-80 disabled:opacity-50 transition-colors duration-200 shadow-sm">
              {loading ? 'Đang lưu…' : 'Xác nhận xử lý'}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )
}

export default function WarehouseReturnsPage() {
  const showToast = useToastStore(s => s.show)
  const [orders,    setOrders]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [tab,       setTab]       = useState('')
  const [selected,  setSelected]  = useState(null)
  const [page,      setPage]      = useState(1)
  const [pagination, setPagination] = useState({})

  const fetchReturns = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 20 })
      if (tab) params.set('status', tab)
      const res = await api.get(`/api/warehouse/returns?${params}`)
      setOrders(res.data)
      setPagination(res.pagination || {})
    } catch (e) { showToast({ message: e.message, type: 'error' }) }
    finally { setLoading(false) }
  }, [page, tab])

  useEffect(() => { fetchReturns() }, [fetchReturns])
  useEffect(() => { setPage(1) }, [tab])

  return (
    <WarehouseLayout title="Hoàn / Hủy đơn">
      <div className="max-w-5xl mx-auto space-y-6 w-full py-4">
        {/* Title and stats summary */}
        <div className="flex flex-col items-center text-center gap-2 mb-2">
          <h1 className="font-display text-3xl font-bold text-ink leading-tight">Hoàn trả & Hủy đơn</h1>
          <div className="h-0.5 w-10 bg-accent rounded-full" />
          <p className="text-[12.5px] text-muted font-semibold max-w-xl">Nhận lại sách từ đơn hủy hoặc đơn hoàn của shipper, kiểm kê chất lượng sản phẩm nhập kho.</p>
        </div>

        {/* Tab filters */}
        <div className="flex gap-1.5 bg-white border border-divider-lt rounded-2xl p-1 w-fit shadow-sm mx-auto">
          {TABS.map(t => (
            <button key={t.status} onClick={() => setTab(t.status)}
              className={`px-4 py-1.5 rounded-lg text-[12px] font-bold tracking-wide transition-all duration-200 ${tab === t.status ? 'bg-ink text-white shadow-card' : 'text-ink-80 hover:text-ink hover:bg-surface-subtle'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Table list */}
        <div className="bg-white rounded-2xl border border-divider-lt overflow-hidden shadow-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-divider-lt bg-surface-warm/30">
                <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-subtle">Mã đơn</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-subtle">Khách hàng</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-subtle">Sản phẩm</th>
                <th className="px-5 py-3.5 text-right text-[10px] font-bold uppercase tracking-widest text-subtle">Tổng tiền</th>
                <th className="px-5 py-3.5 text-center text-[10px] font-bold uppercase tracking-widest text-subtle">Trạng thái</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-subtle">Ngày cập nhật</th>
                <th className="px-5 py-3.5 text-right text-[10px] font-bold uppercase tracking-widest text-subtle" />
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-divider-lt/50 animate-pulse">
                    {[80, 120, 100, 80, 80, 80, 60].map((w, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3.5 bg-surface-subtle rounded-full" style={{ width: w }}/>
                      </td>
                    ))}
                  </tr>
                ))
                : orders.length === 0
                  ? (
                    <tr><td colSpan={7} className="py-24 text-center">
                      <p className="text-[14px] font-semibold text-ink">Không tìm thấy đơn hoàn/hủy</p>
                      <p className="text-[12px] text-muted mt-1">Hệ thống chưa có đơn hoàn trả hoặc hủy ở mục này.</p>
                    </td></tr>
                  )
                  : orders.map((o, idx) => (
                    <motion.tr key={o._id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03, duration: 0.22 }}
                      className="border-t border-divider-lt hover:bg-surface-warm/30 transition-colors duration-200"
                    >
                      {/* Mã đơn */}
                      <td className="px-5 py-3.5">
                        <span className="text-[12px] font-mono font-bold text-ink tracking-wide">
                          {o.orderCode || `#${o._id.slice(-8).toUpperCase()}`}
                        </span>
                      </td>

                      {/* Khách hàng */}
                      <td className="px-5 py-3.5">
                        <p className="text-[12.5px] font-bold text-ink leading-tight">{o.user?.name || o.address?.name}</p>
                        <p className="text-[11px] text-muted mt-0.5 font-medium tabular-nums">{o.user?.phone || o.address?.phone}</p>
                      </td>

                      {/* Sản phẩm */}
                      <td className="px-5 py-3.5 text-[12px] font-semibold text-ink-80">{o.items?.length} sp</td>

                      {/* Tổng tiền */}
                      <td className="px-5 py-3.5 text-right font-bold text-ink tabular-nums text-[13px]">{formatPrice(o.total)}</td>

                      {/* Trạng thái */}
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10.5px] font-semibold border ${o.status === 'CANCELLED' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-orange-50 text-orange-800 border-orange-100'}`}>
                          {o.status === 'CANCELLED' ? 'Đã hủy' : 'Hoàn trả'}
                        </span>
                      </td>

                      {/* Ngày cập nhật */}
                      <td className="px-5 py-3.5 text-[11.5px] text-muted font-medium tabular-nums">
                        {new Date(o.updatedAt).toLocaleDateString('vi-VN')}
                      </td>

                      {/* Hành động */}
                      <td className="px-5 py-3.5 text-right">
                        <button onClick={() => setSelected(o)}
                          className="px-3 py-1.5 text-[11.5px] font-bold border border-divider-lt rounded-xl hover:border-ink hover:bg-surface-warm transition-all duration-200 whitespace-nowrap bg-white shadow-sm">
                          Xử lý hoàn
                        </button>
                      </td>
                    </motion.tr>
                  ))
              }
            </tbody>
          </table>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-divider-lt bg-surface-warm/20">
              <p className="text-[11px] text-muted font-medium tabular-nums">{pagination.total} đơn · Trang {pagination.page}/{pagination.totalPages}</p>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-[11px] font-bold border border-divider-lt rounded-xl disabled:opacity-40 hover:border-ink bg-white transition-colors duration-200 disabled:cursor-not-allowed">← Trước</button>
                <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-[11px] font-bold border border-divider-lt rounded-xl disabled:opacity-40 hover:border-ink bg-white transition-colors duration-200 disabled:cursor-not-allowed">Tiếp →</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <ReturnModal order={selected}
            onClose={() => setSelected(null)}
            onSuccess={() => { setSelected(null); fetchReturns() }} />
        )}
      </AnimatePresence>
    </WarehouseLayout>
  )
}
