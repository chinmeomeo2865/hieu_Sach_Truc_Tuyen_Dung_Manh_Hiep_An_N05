import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import WarehouseLayout from '../../components/warehouse/WarehouseLayout'
import { api }         from '../../services/api'
import { useToastStore } from '../../store/toastStore'
import { formatPrice }   from '../../utils/format'

/* ─── Icons — đồng bộ với các trang kho khác ────────────────── */
const ICON_PATHS = {
  undo:   <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />,
  inbox:  <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />,
  xcircle: <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />,
  clock:  <><circle cx="12" cy="12" r="9" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" /></>,
  search: <><circle cx="11" cy="11" r="8" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" /></>,
  refresh: <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />,
  eye: <><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>,
  close: <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />,
}

function Icon({ name, className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      {ICON_PATHS[name]}
    </svg>
  )
}

const DAMAGE_REASONS = ['Rách/hỏng', 'Móp méo', 'Ẩm mốc', 'Lỗi in ấn', 'Giao sai sản phẩm', 'Khác']

function StatusBadge({ status }) {
  const cfg = status === 'CANCELLED'
    ? { label: 'Đã hủy',   cls: 'bg-red-50 text-red-600 border-red-200/50' }
    : { label: 'Hoàn trả', cls: 'bg-orange-50 text-orange-700 border-orange-200/50' }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wide border whitespace-nowrap ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

/* ─── Stat compact card ─────────────────────────────────────── */
function ReturnStat({ icon, label, value, accent = 'text-[#1A1A1A]', active, onClick }) {
  return (
    <button onClick={onClick}
      className={`bg-white rounded-lg border p-3 flex items-center gap-3 text-left transition-all ${active ? 'border-[#1A1A1A] shadow-sm' : 'border-[#EAE6DF] hover:border-[#D8D2CA] hover:shadow-sm'}`}>
      <div className={`border p-1.5 rounded-lg shrink-0 ${active ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white' : 'border-[#EAE6DF] bg-[#FAF8F5] text-[#615C56]'}`}>
        <Icon name={icon} className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[9.5px] font-bold tracking-wider text-[#615C56] uppercase truncate">{label}</p>
        <p className={`font-display text-[17px] font-bold leading-tight ${accent}`}>{value}</p>
      </div>
    </button>
  )
}

/* ─── Modal chi tiết (chỉ xem) ──────────────────────────────── */
function DetailModal({ order, onClose, onProcess }) {
  const totalQty = order.items?.reduce((s, it) => s + it.qty, 0) || 0
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="w-full max-w-2xl max-h-[90vh] bg-white rounded-xl border border-[#EAE6DF] shadow-2xl flex flex-col overflow-hidden pointer-events-auto"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAE6DF] shrink-0">
            <div className="flex items-center gap-3">
              <p className="font-display text-[14px] font-bold text-[#1A1A1A]">
                Đơn {order.orderCode || `#${order._id.slice(-8).toUpperCase()}`}
              </p>
              <StatusBadge status={order.status} />
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#FAF8F5] text-[#9B9389] transition-colors">
              <Icon name="close" className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid md:grid-cols-5 gap-5 items-start">
              {/* Customer + meta */}
              <div className="md:col-span-2 space-y-4">
                <div className="bg-[#FAF8F5] rounded-lg p-4 border border-[#EAE6DF]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#615C56] mb-3">Khách hàng</p>
                  <p className="text-[13px] font-semibold text-[#1A1A1A]">{order.address?.name || order.user?.name}</p>
                  <p className="text-[12px] text-[#615C56] mt-0.5">{order.address?.phone || order.user?.phone}</p>
                  {order.address && (
                    <p className="text-[12px] text-[#615C56] mt-1">{order.address.street}, {order.address.city}</p>
                  )}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#EAE6DF]">
                    <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wide border ${order.payment === 'COD' ? 'bg-orange-50 text-orange-700 border-orange-200/50' : 'bg-sky-50 text-sky-700 border-sky-200/50'}`}>
                      {order.payment === 'COD' ? 'COD' : 'Online'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wide border ${order.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' : 'bg-[#FAF8F5] text-[#9B9389] border-[#EAE6DF]'}`}>
                      {order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                    </span>
                  </div>
                </div>

                <div className="bg-[#FAF8F5] rounded-lg p-4 border border-[#EAE6DF]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#615C56] mb-2">Lý do / Ghi chú</p>
                  <p className="text-[12px] text-[#1A1A1A] leading-relaxed">{order.note || <span className="text-[#9B9389] italic">Khách không để lại ghi chú</span>}</p>
                  <p className="text-[11px] text-[#9B9389] mt-3 pt-3 border-t border-[#EAE6DF]">
                    Cập nhật: {new Date(order.updatedAt).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div className="md:col-span-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#615C56] mb-3">
                  Sản phẩm hoàn về · {order.items?.length} đầu sách · {totalQty} cuốn
                </p>
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex gap-3 p-3 border border-[#EAE6DF] rounded-lg">
                      {item.image && <img src={item.image} alt={item.title} className="w-12 h-16 object-cover rounded-md shadow-sm shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-semibold text-[#1A1A1A] line-clamp-2">{item.title}</p>
                        <p className="text-[11px] text-[#9B9389] mt-0.5">{item.author}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[12px] font-bold text-[#1A1A1A]">×{item.qty}</span>
                          <span className="text-[12px] text-[#615C56]">{formatPrice(item.price)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#EAE6DF]">
                  <span className="text-[13px] font-semibold text-[#1A1A1A]">Tổng giá trị đơn</span>
                  <span className="font-display text-[16px] font-bold text-[#1A1A1A]">{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-[#EAE6DF] shrink-0 flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-[#EAE6DF] rounded-lg text-[12px] font-semibold text-[#615C56] hover:border-[#9B9389] transition-colors">Đóng</button>
            <button onClick={() => onProcess(order)}
              className="flex-1 py-2.5 bg-[#1A1A1A] text-white rounded-lg text-[12px] font-semibold hover:bg-[#333] transition-colors">
              Xử lý hàng hoàn
            </button>
          </div>
        </motion.div>
      </div>
    </>
  )
}

/* ─── Modal xử lý hoàn trả (action thật) ────────────────────── */
function ReturnModal({ order, onClose, onSuccess }) {
  const showToast = useToastStore(s => s.show)
  const [items, setItems]     = useState(order.items?.map(i => ({ ...i, condition: 'ok', damageReason: '' })) || [])
  const [notes, setNotes]     = useState('')
  const [loading, setLoading] = useState(false)

  function setItemCond(idx, field, val) {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: val } : it))
  }

  const okCount      = items.filter(i => i.condition === 'ok').length
  const damagedCount = items.length - okCount

  async function handleSubmit() {
    setLoading(true)
    try {
      const restockItems = items.filter(i => i.condition === 'ok').map(i => ({ productId: i.product?._id || i.product, quantity: i.qty }))
      const damagedItems = items.filter(i => i.condition === 'damaged').map(i => ({ productId: i.product?._id || i.product, quantity: i.qty, reason: i.damageReason || 'Hàng lỗi' }))
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="w-full max-w-lg max-h-[90vh] bg-white rounded-xl border border-[#EAE6DF] shadow-2xl flex flex-col overflow-hidden pointer-events-auto"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAE6DF] shrink-0">
            <div>
              <p className="font-display text-[14px] font-bold text-[#1A1A1A]">Xử lý hàng hoàn</p>
              <p className="text-[11px] text-[#9B9389] mt-0.5">{order.orderCode || `#${order._id.slice(-8).toUpperCase()}`}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#FAF8F5] text-[#9B9389] transition-colors">
              <Icon name="close" className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            <p className="text-[11px] text-[#9B9389]">Kiểm tra từng sản phẩm và chọn trạng thái khi nhận lại:</p>

            {items.map((item, idx) => (
              <div key={idx} className={`border rounded-lg p-3.5 transition-colors ${item.condition === 'damaged' ? 'border-red-200/60 bg-red-50/30' : 'border-[#EAE6DF]'}`}>
                <div className="flex items-center gap-3 mb-3">
                  {item.image && <img src={item.image} alt="" className="w-10 h-14 object-cover rounded-md shadow-sm shrink-0"/>}
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-semibold text-[#1A1A1A] line-clamp-1">{item.title}</p>
                    <p className="text-[11px] text-[#9B9389]">×{item.qty} · {formatPrice(item.price)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setItemCond(idx, 'condition', 'ok')}
                    className={`flex-1 py-2 rounded-lg text-[11px] font-semibold border transition-colors ${item.condition === 'ok' ? 'bg-emerald-600 text-white border-emerald-600' : 'border-[#EAE6DF] text-[#615C56] hover:border-emerald-300'}`}>
                    Nguyên vẹn — nhập lại kho
                  </button>
                  <button onClick={() => setItemCond(idx, 'condition', 'damaged')}
                    className={`flex-1 py-2 rounded-lg text-[11px] font-semibold border transition-colors ${item.condition === 'damaged' ? 'bg-red-600 text-white border-red-600' : 'border-[#EAE6DF] text-[#615C56] hover:border-red-300'}`}>
                    Hàng lỗi — xuất hủy
                  </button>
                </div>
                {item.condition === 'damaged' && (
                  <select value={item.damageReason} onChange={e => setItemCond(idx, 'damageReason', e.target.value)}
                    className="w-full mt-2 px-3 py-2 border border-[#EAE6DF] rounded-lg text-[11px] focus:outline-none focus:border-[#1A1A1A] bg-white transition-colors">
                    <option value="">Chọn lý do lỗi…</option>
                    {DAMAGE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                )}
              </div>
            ))}

            <div>
              <label className="block text-[10px] font-bold text-[#615C56] uppercase tracking-wider mb-1.5">Ghi chú biên bản</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                placeholder="Ghi chú thêm về tình trạng hàng hoàn…"
                className="w-full px-3.5 py-2.5 border border-[#EAE6DF] rounded-lg text-[12px] bg-white placeholder:text-[#D8D2CA] focus:outline-none focus:border-[#1A1A1A] resize-none transition-colors"/>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-[#EAE6DF] shrink-0">
            <div className="flex items-center justify-between mb-3 text-[11px] font-medium">
              <span className="text-emerald-600">{okCount} nhập lại kho</span>
              <span className="text-red-600">{damagedCount} xuất hủy</span>
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 border border-[#EAE6DF] rounded-lg text-[12px] font-semibold text-[#615C56] hover:border-[#9B9389] transition-colors">Hủy</button>
              <button onClick={handleSubmit} disabled={loading}
                className="flex-1 py-2.5 bg-[#1A1A1A] text-white rounded-lg text-[12px] font-semibold hover:bg-[#333] disabled:opacity-50 transition-colors">
                {loading ? 'Đang lưu…' : 'Xác nhận xử lý'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  )
}

const TABS = [
  { status: '',          label: 'Tất cả',   countKey: 'pending' },
  { status: 'CANCELLED', label: 'Đã hủy',   countKey: 'pendingCancelled' },
  { status: 'RETURNED',  label: 'Hoàn trả', countKey: 'pendingReturned' },
]

const DATE_FILTERS = [
  { value: '',       label: 'Tất cả thời gian' },
  { value: 'today',  label: 'Hôm nay' },
  { value: '7days',  label: '7 ngày qua' },
  { value: '30days', label: '30 ngày qua' },
]

export default function WarehouseReturnsPage() {
  const showToast = useToastStore(s => s.show)
  const [orders,     setOrders]     = useState([])
  const [counts,     setCounts]     = useState({})
  const [loading,    setLoading]    = useState(true)
  const [tab,        setTab]        = useState('')
  const [detail,     setDetail]     = useState(null)
  const [processing, setProcessing] = useState(null)
  const [page,       setPage]       = useState(1)
  const [pagination, setPagination] = useState({})
  const [search,     setSearch]     = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const timerRef = useRef(null)

  const fetchReturns = useCallback(async (q = search) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 20 })
      if (tab) params.set('status', tab)
      if (q) params.set('search', q)
      if (dateFilter) params.set('date', dateFilter)
      const res = await api.get(`/api/warehouse/returns?${params}`)
      setOrders(res.data)
      setCounts(res.counts || {})
      setPagination(res.pagination || {})
    } catch (e) { showToast({ message: e.message, type: 'error' }) }
    finally { setLoading(false) }
  }, [page, tab, dateFilter])

  useEffect(() => { fetchReturns() }, [fetchReturns])
  useEffect(() => { setPage(1) }, [tab, dateFilter])

  function handleSearch(e) {
    const val = e.target.value
    setSearch(val)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => { setPage(1); fetchReturns(val) }, 350)
  }

  function openProcess(o) {
    setDetail(null)
    setProcessing(o)
  }

  return (
    <WarehouseLayout title="Hoàn / Hủy đơn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#EAE6DF] pb-3 mb-5">
        <div>
          <h2 className="font-display text-[14.5px] font-bold text-[#1A1A1A] uppercase tracking-wider">Hoàn / Hủy đơn</h2>
          <p className="text-[11px] text-[#9B9389] mt-0.5">Tiếp nhận hàng hoàn, nhập lại kho hàng tốt và xuất hủy hàng lỗi</p>
        </div>
      </div>

      {/* Stat strip */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <ReturnStat icon="inbox" label="Tổng yêu cầu" value={counts.total ?? '—'}
          active={false} onClick={() => setTab('')} />
        <ReturnStat icon="clock" label="Chờ xử lý" value={counts.pending ?? 0}
          accent={counts.pending > 0 ? 'text-amber-600' : 'text-[#1A1A1A]'}
          active={tab === ''} onClick={() => setTab('')} />
        <ReturnStat icon="undo" label="Hoàn trả" value={counts.RETURNED ?? 0}
          accent={counts.pendingReturned > 0 ? 'text-orange-600' : 'text-[#1A1A1A]'}
          active={tab === 'RETURNED'} onClick={() => setTab('RETURNED')} />
        <ReturnStat icon="xcircle" label="Đã hủy" value={counts.CANCELLED ?? 0}
          accent={counts.pendingCancelled > 0 ? 'text-red-600' : 'text-[#1A1A1A]'}
          active={tab === 'CANCELLED'} onClick={() => setTab('CANCELLED')} />
      </motion.div>

      {/* Table card */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-white rounded-xl border border-[#EAE6DF] shadow-sm overflow-hidden">

        {/* Tabs */}
        <div className="px-5 pt-3 border-b border-[#EAE6DF]">
          <div className="flex gap-0.5 -mb-px overflow-x-auto">
            {TABS.map(t => {
              const active = tab === t.status
              const n = counts[t.countKey]
              return (
                <button key={t.status} onClick={() => setTab(t.status)}
                  className={`px-3.5 py-2.5 text-[12px] font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5
                    ${active ? 'border-[#1A1A1A] text-[#1A1A1A]' : 'border-transparent text-[#9B9389] hover:text-[#1A1A1A]'}`}>
                  {t.label}
                  {n !== undefined && (
                    <span className={`px-1.5 py-px rounded text-[10px] font-bold ${active ? 'bg-[#1A1A1A] text-white' : 'bg-[#FAF8F5] text-[#615C56] border border-[#EAE6DF]'}`}>
                      {n}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-5 py-3 border-b border-[#EAE6DF] bg-[#FAF8F5]/40">
          <div className="flex gap-2.5 flex-wrap items-center">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9B9389]"><Icon name="search" className="w-4 h-4" /></span>
              <input type="text" value={search} onChange={handleSearch}
                placeholder="Tìm mã đơn, tên khách, SĐT…"
                className="w-full pl-9 pr-4 py-2 border border-[#EAE6DF] rounded-lg text-[12px] bg-white placeholder:text-[#D8D2CA] focus:outline-none focus:border-[#1A1A1A] transition-colors"/>
            </div>
            <select value={dateFilter} onChange={e => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-[#EAE6DF] rounded-lg text-[12px] text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A1A1A] transition-colors">
              {DATE_FILTERS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <button onClick={() => fetchReturns()} title="Làm mới"
              className="w-9 h-9 flex items-center justify-center border border-[#EAE6DF] bg-white rounded-lg text-[#615C56] hover:border-[#1A1A1A] hover:text-[#1A1A1A] transition-colors">
              <Icon name="refresh" className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Table */}
        <table className="w-full">
          <thead>
            <tr className="bg-[#FAF8F5] border-b border-[#EAE6DF]">
              {['Mã đơn', 'Sản phẩm', 'Khách hàng', 'Tổng tiền', 'Lý do / Ghi chú', 'Trạng thái', 'Thao tác'].map((h, i) => (
                <th key={i} className={`px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[#9B9389] ${h === 'Thao tác' ? 'text-right pr-5' : ''} ${i === 0 ? 'pl-5' : ''}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-t border-[#FAF8F5] animate-pulse">
                  {[80, 170, 110, 70, 130, 80, 90].map((w, j) => (
                    <td key={j} className={`px-3 py-3 ${j === 0 ? 'pl-5' : ''}`}><div className="h-3.5 bg-[#F2EFEA] rounded" style={{ width: w }}/></td>
                  ))}
                </tr>
              ))
              : orders.length === 0
                ? (
                  <tr><td colSpan={7} className="py-16 text-center">
                    <p className="text-[13px] font-semibold text-[#1A1A1A]">Không có đơn hoàn/hủy cần xử lý</p>
                    <p className="text-[11px] text-[#9B9389] mt-1">
                      {search || dateFilter ? 'Thử đổi bộ lọc hoặc từ khóa' : 'Tất cả yêu cầu đã được xử lý'}
                    </p>
                  </td></tr>
                )
                : orders.map(o => {
                  const totalQty = o.items?.reduce((s, it) => s + it.qty, 0) || 0
                  return (
                    <tr key={o._id} onClick={() => setDetail(o)}
                      className="border-t border-[#FAF8F5] hover:bg-[#FAF8F5]/50 cursor-pointer transition-colors">
                      <td className="pl-5 pr-3 py-2.5">
                        <p className="text-[11.5px] font-mono font-bold text-[#1A1A1A] whitespace-nowrap">{o.orderCode || `#${o._id.slice(-8).toUpperCase()}`}</p>
                        <p className="text-[10px] text-[#9B9389] mt-0.5">{new Date(o.updatedAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex -space-x-2 shrink-0">
                            {o.items?.slice(0, 3).map((it, i) => (
                              it.image
                                ? <img key={i} src={it.image} alt="" className="w-7 h-10 object-cover rounded ring-2 ring-white shadow-sm" />
                                : <div key={i} className="w-7 h-10 bg-[#FAF8F5] border border-[#EAE6DF] rounded ring-2 ring-white" />
                            ))}
                            {o.items?.length > 3 && (
                              <div className="w-7 h-10 bg-[#1A1A1A]/80 rounded ring-2 ring-white flex items-center justify-center text-white text-[9px] font-bold">+{o.items.length - 3}</div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11.5px] font-medium text-[#1A1A1A] line-clamp-1 max-w-[180px]">{o.items?.[0]?.title}</p>
                            <p className="text-[10px] text-[#9B9389]">{o.items?.length} đầu sách · {totalQty} cuốn</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="text-[11.5px] font-semibold text-[#1A1A1A] line-clamp-1">{o.user?.name || o.address?.name}</p>
                        <p className="text-[10px] text-[#9B9389]">{o.user?.phone || o.address?.phone}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="font-display text-[12.5px] font-bold text-[#1A1A1A] whitespace-nowrap">{formatPrice(o.total)}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="text-[11px] text-[#615C56] line-clamp-2 max-w-[160px]">
                          {o.note || <span className="text-[#C9C2B8] italic">Không có ghi chú</span>}
                        </p>
                      </td>
                      <td className="px-3 py-2.5"><StatusBadge status={o.status} /></td>
                      <td className="px-3 py-2.5 pr-5" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1.5 justify-end items-center">
                          <button onClick={() => setProcessing(o)}
                            className="px-2.5 py-1.5 text-[10.5px] font-semibold bg-[#1A1A1A] text-white rounded-lg hover:bg-[#333] transition-colors whitespace-nowrap">
                            Xử lý
                          </button>
                          <button onClick={() => setDetail(o)} title="Xem chi tiết"
                            className="w-7 h-7 flex items-center justify-center border border-[#EAE6DF] rounded-lg text-[#615C56] hover:border-[#1A1A1A] hover:text-[#1A1A1A] transition-colors">
                            <Icon name="eye" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
            }
          </tbody>
        </table>

        {/* Footer / pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#EAE6DF] bg-[#FAF8F5]/50">
            <p className="text-[11px] text-[#9B9389] font-medium">{pagination.total} đơn · Trang {pagination.page}/{pagination.totalPages}</p>
            <div className="flex gap-1.5">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-[11px] font-semibold border border-[#EAE6DF] bg-white rounded-lg disabled:opacity-40 hover:border-[#1A1A1A] transition-colors">← Trước</button>
              <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-[11px] font-semibold border border-[#EAE6DF] bg-white rounded-lg disabled:opacity-40 hover:border-[#1A1A1A] transition-colors">Tiếp →</button>
            </div>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {detail && (
          <DetailModal key={`d-${detail._id}`} order={detail}
            onClose={() => setDetail(null)}
            onProcess={openProcess} />
        )}
        {processing && (
          <ReturnModal key={`p-${processing._id}`} order={processing}
            onClose={() => setProcessing(null)}
            onSuccess={() => { setProcessing(null); fetchReturns() }} />
        )}
      </AnimatePresence>
    </WarehouseLayout>
  )
}
