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
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg pointer-events-auto max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f0f0] shrink-0">
            <p className="text-[14px] font-semibold text-[#1c1c1a]">Xử lý hoàn trả — #{order._id.slice(-8).toUpperCase()}</p>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f5f5f4] text-[#a3a3a3] transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <p className="text-[11px] text-[#a3a3a3]">Kiểm tra từng sản phẩm và chọn trạng thái khi nhận lại:</p>

            {items.map((item, idx) => (
              <div key={idx} className="border border-[#f0f0f0] rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  {item.image && <img src={item.image} alt="" className="w-10 h-14 object-cover rounded-lg bg-[#f0f0f0] shrink-0"/>}
                  <div>
                    <p className="text-[12.5px] font-semibold text-[#1c1c1a]">{item.title}</p>
                    <p className="text-[11px] text-[#a3a3a3]">×{item.qty} · {formatPrice(item.price)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setItemCond(idx, 'condition', 'ok')}
                    className={`flex-1 py-2 rounded-lg text-[11px] font-semibold border transition-colors ${item.condition === 'ok' ? 'bg-emerald-500 text-white border-emerald-500' : 'border-[#e8e8e6] text-[#737373] hover:border-emerald-300'}`}>
                    ✓ Nguyên vẹn — nhập lại kho
                  </button>
                  <button onClick={() => setItemCond(idx, 'condition', 'damaged')}
                    className={`flex-1 py-2 rounded-lg text-[11px] font-semibold border transition-colors ${item.condition === 'damaged' ? 'bg-red-500 text-white border-red-500' : 'border-[#e8e8e6] text-[#737373] hover:border-red-300'}`}>
                    ✗ Hàng lỗi — xuất hủy
                  </button>
                </div>
                {item.condition === 'damaged' && (
                  <select value={item.damageReason} onChange={e => setItemCond(idx, 'damageReason', e.target.value)}
                    className="w-full mt-2 px-3 py-1.5 border border-[#e8e8e6] rounded-lg text-[11px] focus:outline-none focus:border-[#1c1c1a] bg-white">
                    <option value="">Chọn lý do lỗi…</option>
                    {DAMAGE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                )}
              </div>
            ))}

            <div>
              <label className="block text-[11px] font-semibold text-[#525252] uppercase tracking-wider mb-1.5">Ghi chú biên bản</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                placeholder="Ghi chú thêm về tình trạng hàng hoàn…"
                className="w-full px-3.5 py-2.5 border border-[#e8e8e6] rounded-xl text-[12px] focus:outline-none focus:border-[#1c1c1a] resize-none transition-colors"/>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-[#f0f0f0] shrink-0 flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-[#e8e8e6] rounded-xl text-[13px] font-semibold text-[#525252] hover:border-[#a3a3a3] transition-colors">Hủy</button>
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 py-2.5 bg-[#1c1c1a] text-white rounded-xl text-[13px] font-semibold hover:bg-[#333] disabled:opacity-50 transition-colors">
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
      <div className="space-y-4">
        <div className="flex gap-1 bg-white border border-[#e8e8e6] rounded-xl p-1 w-fit">
          {TABS.map(t => (
            <button key={t.status} onClick={() => setTab(t.status)}
              className={`px-4 py-1.5 rounded-lg text-[12.5px] font-semibold transition-colors ${tab === t.status ? 'bg-[#1c1c1a] text-white' : 'text-[#737373] hover:text-[#1c1c1a]'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-[#e8e8e6] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#f0f0f0]">
                {['Mã đơn', 'Khách hàng', 'Sản phẩm', 'Tổng tiền', 'Trạng thái', 'Ngày', ''].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left text-[10.5px] font-bold uppercase tracking-wider text-[#a3a3a3]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-t border-[#f5f5f4] animate-pulse">
                    {[80, 120, 140, 80, 80, 80, 60].map((w, j) => (
                      <td key={j} className="px-4 py-3.5"><div className="h-3.5 bg-[#f0f0f0] rounded-full" style={{ width: w }}/></td>
                    ))}
                  </tr>
                ))
                : orders.length === 0
                  ? (
                    <tr><td colSpan={7} className="py-16 text-center">
                      <p className="text-[13px] font-semibold text-[#1c1c1a]">Không có đơn hoàn/hủy</p>
                    </td></tr>
                  )
                  : orders.map(o => (
                    <tr key={o._id} className="border-t border-[#f5f5f4] hover:bg-[#fafafa] transition-colors">
                      <td className="px-4 py-3.5">
                        <span className="text-[12px] font-mono font-bold text-[#1c1c1a]">#{o._id.slice(-8).toUpperCase()}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-[12.5px] font-semibold text-[#1c1c1a]">{o.user?.name || o.address?.name}</p>
                        <p className="text-[11px] text-[#a3a3a3]">{o.user?.phone || o.address?.phone}</p>
                      </td>
                      <td className="px-4 py-3.5 text-[11px] text-[#737373]">{o.items?.length} sp</td>
                      <td className="px-4 py-3.5 text-[12.5px] font-bold text-[#1c1c1a]">{formatPrice(o.total)}</td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${o.status === 'CANCELLED' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                          {o.status === 'CANCELLED' ? 'Đã hủy' : 'Hoàn trả'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[11px] text-[#a3a3a3]">
                        {new Date(o.updatedAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-4 py-3.5">
                        <button onClick={() => setSelected(o)}
                          className="px-3 py-1.5 text-[11px] font-semibold border border-[#e8e8e6] rounded-lg hover:border-[#1c1c1a] transition-colors whitespace-nowrap">
                          Xử lý
                        </button>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
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
