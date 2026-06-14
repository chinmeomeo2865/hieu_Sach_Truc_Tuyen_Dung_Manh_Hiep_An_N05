import { useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams }   from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import WarehouseLayout from '../../components/warehouse/WarehouseLayout'
import { api }         from '../../services/api'
import { useToastStore } from '../../store/toastStore'
import { formatPrice }   from '../../utils/format'

/* ─── Icons — đồng bộ với WarehouseDashboard ────────────────── */
const ICON_PATHS = {
  clipboard: <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
  layers: <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />,
  truck: <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m6 0a2 2 0 104 0" />,
  check: <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />,
  search: <><circle cx="11" cy="11" r="8" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" /></>,
  refresh: <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />,
  printer: <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />,
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

/* ─── Cấu hình trạng thái ───────────────────────────────────── */
const STATUS_CFG = {
  CONFIRMED: { label: 'Chờ đóng gói',  badge: 'bg-amber-50 text-amber-700 border-amber-200/50' },
  PACKING:   { label: 'Đang đóng gói', badge: 'bg-violet-50 text-violet-700 border-violet-200/50' },
  SHIPPING:  { label: 'Đang giao',     badge: 'bg-sky-50 text-sky-700 border-sky-200/50' },
  DELIVERED: { label: 'Đã giao',       badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/50' },
}

const NEXT_STATUS = {
  CONFIRMED: { label: 'Đóng gói',  full: 'Bắt đầu đóng gói',   next: 'PACKING' },
  PACKING:   { label: 'Giao vận',  full: 'Bàn giao vận chuyển', next: 'SHIPPING' },
  SHIPPING:  { label: 'Đã giao',   full: 'Xác nhận đã giao',    next: 'DELIVERED' },
}

const TIMELINE_STEPS = [
  { status: 'CONFIRMED', label: 'Đã xác nhận' },
  { status: 'PACKING',   label: 'Đang đóng gói' },
  { status: 'SHIPPING',  label: 'Bàn giao vận chuyển' },
  { status: 'DELIVERED', label: 'Đã giao hàng' },
]

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || { label: status, badge: 'bg-[#FAF8F5] text-[#9B9389] border-[#EAE6DF]' }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wide border whitespace-nowrap ${cfg.badge}`}>
      {cfg.label}
    </span>
  )
}

/* ─── In phiếu giao hàng ────────────────────────────────────── */
function printOrders(orders) {
  const slips = orders.map(o => `
    <div class="slip">
      <div class="head">
        <div>
          <h1>HIỆU SÁCH CHIN</h1>
          <p>Đường Nguyễn Trác, P. Yên Nghĩa, Q. Hà Đông, Hà Nội · 0383 687 670</p>
        </div>
        <div class="code">
          <p class="order-code">${o.orderCode || `#${o._id.slice(-8).toUpperCase()}`}</p>
          <p>${new Date(o.createdAt).toLocaleString('vi-VN')}</p>
        </div>
      </div>
      <div class="customer">
        <p><strong>Người nhận:</strong> ${o.address?.name || o.user?.name || ''} — ${o.address?.phone || ''}</p>
        <p><strong>Địa chỉ:</strong> ${o.address ? `${o.address.street}, ${o.address.city}` : ''}</p>
        <p><strong>Thanh toán:</strong> ${o.payment === 'COD' ? `COD — thu hộ ${formatPrice(o.total)}` : 'Đã thanh toán online'}</p>
        ${o.note ? `<p><strong>Ghi chú:</strong> ${o.note}</p>` : ''}
      </div>
      <table>
        <thead><tr><th>#</th><th>Sản phẩm</th><th class="r">SL</th><th class="r">Đơn giá</th><th class="r">Thành tiền</th></tr></thead>
        <tbody>
          ${o.items?.map((it, i) => `<tr><td>${i + 1}</td><td>${it.title}</td><td class="r">${it.qty}</td><td class="r">${formatPrice(it.price)}</td><td class="r">${formatPrice(it.price * it.qty)}</td></tr>`).join('')}
        </tbody>
        <tfoot><tr><td colspan="4" class="r"><strong>Tổng cộng</strong></td><td class="r"><strong>${formatPrice(o.total)}</strong></td></tr></tfoot>
      </table>
    </div>
  `).join('')

  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Phiếu giao hàng</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; color: #1A1A1A; font-size: 12px; }
      .slip { padding: 24px; page-break-after: always; }
      .head { display: flex; justify-content: space-between; border-bottom: 2px solid #1A1A1A; padding-bottom: 12px; margin-bottom: 12px; }
      h1 { font-size: 16px; letter-spacing: 1px; }
      .head p { color: #615C56; font-size: 10.5px; margin-top: 4px; }
      .code { text-align: right; }
      .order-code { font-size: 15px; font-weight: 700; font-family: monospace; color: #1A1A1A !important; }
      .customer p { margin: 3px 0; font-size: 12px; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th, td { border: 1px solid #D8D2CA; padding: 6px 8px; text-align: left; }
      th { background: #FAF8F5; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
      .r { text-align: right; }
    </style></head><body>${slips}<script>window.onload = () => window.print()</${'script'}></body></html>`)
  win.document.close()
}

/* ─── Timeline trong drawer ─────────────────────────────────── */
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
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold border-2 z-10 relative transition-all
                  ${done ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white' : 'bg-white border-[#EAE6DF] text-[#D8D2CA]'}
                  ${current ? 'ring-4 ring-[#1A1A1A]/10' : ''}`}
              >
                {done ? <Icon name="check" className="w-3.5 h-3.5" /> : i + 1}
              </motion.div>
              {i < TIMELINE_STEPS.length - 1 && (
                <div className="absolute top-4 left-1/2 w-full h-0.5 z-0">
                  <div className="h-full bg-[#EAE6DF]" />
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: done && i < doneIdx ? '100%' : '0%' }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    className="h-full bg-[#1A1A1A] absolute top-0 left-0"
                  />
                </div>
              )}
            </div>
            <div className="mt-2 text-center px-1">
              <p className={`text-[10px] font-semibold ${done ? 'text-[#1A1A1A]' : 'text-[#D8D2CA]'}`}>{step.label}</p>
              {hist && (
                <p className="text-[9px] text-[#9B9389] mt-0.5">
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

/* ─── Drawer chi tiết đơn ───────────────────────────────────── */
function OrderDetail({ order, onUpdate, onClose }) {
  const showToast = useToastStore(s => s.show)
  const [updating, setUpdating] = useState(false)
  const nextCfg = NEXT_STATUS[order.status]

  async function advance() {
    if (!nextCfg) return
    setUpdating(true)
    try {
      await api.put(`/api/warehouse/orders/${order._id}/status`, { status: nextCfg.next })
      showToast({ message: `Đã cập nhật: ${nextCfg.full}`, type: 'success' })
      onUpdate(order._id, nextCfg.next)
    } catch (e) { showToast({ message: e.message, type: 'error' }) }
    finally { setUpdating(false) }
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="w-full max-w-3xl max-h-[90vh] bg-white rounded-xl border border-[#EAE6DF] shadow-2xl flex flex-col overflow-hidden pointer-events-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAE6DF] shrink-0">
          <div>
            <p className="font-display text-[14px] font-bold text-[#1A1A1A]">
              Đơn {order.orderCode || `#${order._id.slice(-8).toUpperCase()}`}
            </p>
            <p className="text-[11px] text-[#9B9389] mt-0.5">
              {new Date(order.createdAt).toLocaleString('vi-VN')}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => printOrders([order])} title="In phiếu giao hàng"
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#EAE6DF] hover:border-[#1A1A1A] text-[#615C56] hover:text-[#1A1A1A] transition-colors">
              <Icon name="printer" className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#FAF8F5] text-[#9B9389] transition-colors">
              <Icon name="close" className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Timeline */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#615C56] mb-4">Tiến trình đơn hàng</p>
              <Timeline order={order} />
            </div>

            <div className="grid md:grid-cols-5 gap-5 items-start">
            {/* Customer */}
            <div className="bg-[#FAF8F5] rounded-lg p-4 border border-[#EAE6DF] md:col-span-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#615C56] mb-3">Thông tin giao hàng</p>
              <p className="text-[13px] font-semibold text-[#1A1A1A]">{order.address?.name || order.user?.name}</p>
              <p className="text-[12px] text-[#615C56] mt-0.5">{order.address?.phone || order.user?.phone}</p>
              {order.address && (
                <p className="text-[12px] text-[#615C56] mt-1">
                  {order.address.street}, {order.address.city}
                </p>
              )}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#EAE6DF]">
                <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wide border ${order.payment === 'COD' ? 'bg-orange-50 text-orange-700 border-orange-200/50' : 'bg-sky-50 text-sky-700 border-sky-200/50'}`}>
                  {order.payment === 'COD' ? 'COD' : 'Online'}
                </span>
                <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wide border ${order.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' : 'bg-[#FAF8F5] text-[#9B9389] border-[#EAE6DF]'}`}>
                  {order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                </span>
              </div>
              {order.note && (
                <p className="text-[11.5px] text-[#615C56] mt-2 italic">Ghi chú: {order.note}</p>
              )}
            </div>

            {/* Items */}
            <div className="md:col-span-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#615C56] mb-3">Danh sách sản phẩm</p>
              <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex gap-3 p-3 border border-[#EAE6DF] rounded-lg">
                    {item.image && (
                      <img src={item.image} alt={item.title} className="w-12 h-16 object-cover rounded-md shadow-sm shrink-0" />
                    )}
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
                <span className="text-[13px] font-semibold text-[#1A1A1A]">Tổng cộng</span>
                <span className="font-display text-[16px] font-bold text-[#1A1A1A]">{formatPrice(order.total)}</span>
              </div>
            </div>
            </div>
          </div>
        </div>

        {nextCfg && (
          <div className="px-6 py-4 border-t border-[#EAE6DF] shrink-0">
            <button onClick={advance} disabled={updating}
              className="w-full py-3 bg-[#1A1A1A] text-white text-[13px] font-semibold rounded-lg hover:bg-[#333] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {updating
                ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg> Đang cập nhật…</>
                : nextCfg.full}
            </button>
          </div>
        )}
      </motion.div>
      </div>
    </>
  )
}

/* ─── Stat compact card ─────────────────────────────────────── */
function OrderStat({ icon, label, value, accent = 'text-[#1A1A1A]', active, onClick }) {
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

const TABS = [
  { status: '',          label: 'Cần xử lý',     countKey: 'active' },
  { status: 'CONFIRMED', label: 'Chờ đóng gói',  countKey: 'CONFIRMED' },
  { status: 'PACKING',   label: 'Đang đóng gói', countKey: 'PACKING' },
  { status: 'SHIPPING',  label: 'Đang giao',     countKey: 'SHIPPING' },
  { status: 'DELIVERED', label: 'Đã giao',       countKey: 'DELIVERED' },
]

const DATE_FILTERS = [
  { value: '',       label: 'Tất cả thời gian' },
  { value: 'today',  label: 'Hôm nay' },
  { value: '7days',  label: '7 ngày qua' },
  { value: '30days', label: '30 ngày qua' },
]

export default function WarehouseOrdersPage() {
  const showToast = useToastStore(s => s.show)
  const [searchParams, setSearchParams] = useSearchParams()
  const [orders,      setOrders]      = useState([])
  const [counts,      setCounts]      = useState({})
  const [loading,     setLoading]     = useState(true)
  const [selected,    setSelected]    = useState(null)
  const [page,        setPage]        = useState(1)
  const [pagination,  setPagination]  = useState({})
  const [search,      setSearch]      = useState('')
  const [dateFilter,  setDateFilter]  = useState('')
  const [checkedIds,  setCheckedIds]  = useState([])
  const [advancingId, setAdvancingId] = useState(null)
  const [bulkRunning, setBulkRunning] = useState(false)
  const timerRef = useRef(null)

  const activeStatus = searchParams.get('status') || ''

  const fetchOrders = useCallback(async (q = search) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 20 })
      if (activeStatus) params.set('status', activeStatus)
      if (q) params.set('search', q)
      if (dateFilter) params.set('date', dateFilter)
      const res = await api.get(`/api/warehouse/orders?${params}`)
      setOrders(res.data)
      setCounts(res.counts || {})
      setPagination(res.pagination || {})
    } catch (e) { showToast({ message: e.message, type: 'error' }) }
    finally { setLoading(false) }
  }, [page, activeStatus, dateFilter])

  useEffect(() => { fetchOrders() }, [fetchOrders])
  useEffect(() => { setPage(1); setCheckedIds([]) }, [activeStatus, dateFilter])

  function handleSearch(e) {
    const val = e.target.value
    setSearch(val)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => { setPage(1); fetchOrders(val) }, 350)
  }

  function handleUpdate(id, newStatus) {
    setOrders(prev => prev.map(o => o._id === id ? { ...o, status: newStatus } : o))
    setSelected(prev => prev?._id === id ? { ...prev, status: newStatus } : prev)
    setCounts(prev => {
      const o = orders.find(x => x._id === id)
      if (!o) return prev
      const next = { ...prev }
      next[o.status] = Math.max(0, (next[o.status] || 0) - 1)
      next[newStatus] = (next[newStatus] || 0) + 1
      if (newStatus === 'DELIVERED') next.active = Math.max(0, (next.active || 0) - 1)
      return next
    })
  }

  async function advanceOrder(o) {
    const nextCfg = NEXT_STATUS[o.status]
    if (!nextCfg) return
    setAdvancingId(o._id)
    try {
      await api.put(`/api/warehouse/orders/${o._id}/status`, { status: nextCfg.next })
      showToast({ message: `${o.orderCode || `#${o._id.slice(-8).toUpperCase()}`}: ${nextCfg.full}`, type: 'success' })
      handleUpdate(o._id, nextCfg.next)
    } catch (e) { showToast({ message: e.message, type: 'error' }) }
    finally { setAdvancingId(null) }
  }

  /* ── Bulk actions ── */
  const checkedOrders   = orders.filter(o => checkedIds.includes(o._id))
  const advanceable     = checkedOrders.filter(o => NEXT_STATUS[o.status])
  const allPageChecked  = orders.length > 0 && orders.every(o => checkedIds.includes(o._id))

  function toggleAll() {
    setCheckedIds(allPageChecked ? [] : orders.map(o => o._id))
  }
  function toggleOne(id) {
    setCheckedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function bulkAdvance() {
    if (!advanceable.length) return
    setBulkRunning(true)
    const results = await Promise.allSettled(
      advanceable.map(o => api.put(`/api/warehouse/orders/${o._id}/status`, { status: NEXT_STATUS[o.status].next }))
    )
    const ok = results.filter(r => r.status === 'fulfilled').length
    const fail = results.length - ok
    showToast({
      message: fail ? `Đã chuyển ${ok} đơn, ${fail} đơn lỗi` : `Đã chuyển ${ok} đơn sang bước tiếp theo`,
      type: fail ? 'error' : 'success',
    })
    setCheckedIds([])
    setBulkRunning(false)
    fetchOrders()
  }

  return (
    <WarehouseLayout title="Xử lý đơn hàng">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#EAE6DF] pb-3 mb-5">
        <div>
          <h2 className="font-display text-[14.5px] font-bold text-[#1A1A1A] uppercase tracking-wider">Xử lý đơn hàng</h2>
          <p className="text-[11px] text-[#9B9389] mt-0.5">Đóng gói, bàn giao vận chuyển và theo dõi đơn trong kho</p>
        </div>
      </div>

      {/* Stat strip */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        <OrderStat icon="clipboard" label="Tổng đơn" value={counts.total ?? '—'}
          active={false} onClick={() => setSearchParams({})} />
        <OrderStat icon="clipboard" label="Chờ xử lý" value={counts.CONFIRMED ?? 0}
          accent={counts.CONFIRMED > 0 ? 'text-amber-600' : 'text-[#1A1A1A]'}
          active={activeStatus === 'CONFIRMED'} onClick={() => setSearchParams({ status: 'CONFIRMED' })} />
        <OrderStat icon="layers" label="Đang đóng gói" value={counts.PACKING ?? 0}
          accent={counts.PACKING > 0 ? 'text-violet-600' : 'text-[#1A1A1A]'}
          active={activeStatus === 'PACKING'} onClick={() => setSearchParams({ status: 'PACKING' })} />
        <OrderStat icon="truck" label="Đang giao" value={counts.SHIPPING ?? 0}
          accent={counts.SHIPPING > 0 ? 'text-sky-600' : 'text-[#1A1A1A]'}
          active={activeStatus === 'SHIPPING'} onClick={() => setSearchParams({ status: 'SHIPPING' })} />
        <OrderStat icon="check" label="Hoàn thành" value={counts.DELIVERED ?? 0}
          accent="text-emerald-600"
          active={activeStatus === 'DELIVERED'} onClick={() => setSearchParams({ status: 'DELIVERED' })} />
      </motion.div>

      {/* Table card */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-white rounded-xl border border-[#EAE6DF] shadow-sm overflow-hidden">

        {/* Tabs */}
        <div className="px-5 pt-3 border-b border-[#EAE6DF] flex items-end justify-between gap-3 flex-wrap">
          <div className="flex gap-0.5 -mb-px overflow-x-auto">
            {TABS.map(t => {
              const active = activeStatus === t.status
              const n = counts[t.countKey]
              return (
                <button key={t.status}
                  onClick={() => setSearchParams(t.status ? { status: t.status } : {})}
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

        {/* Toolbar / bulk bar */}
        <div className="px-5 py-3 border-b border-[#EAE6DF] bg-[#FAF8F5]/40">
          {checkedIds.length > 0 ? (
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-[12px] font-semibold text-[#1A1A1A]">Đã chọn {checkedIds.length} đơn</p>
              <button onClick={bulkAdvance} disabled={bulkRunning || !advanceable.length}
                className="px-3.5 py-1.5 bg-[#1A1A1A] text-white text-[11px] font-semibold rounded-lg hover:bg-[#333] disabled:opacity-40 transition-colors">
                {bulkRunning ? 'Đang xử lý…' : `Chuyển bước tiếp theo (${advanceable.length})`}
              </button>
              <button onClick={() => printOrders(checkedOrders)}
                className="px-3.5 py-1.5 border border-[#EAE6DF] bg-white text-[#1A1A1A] text-[11px] font-semibold rounded-lg hover:border-[#1A1A1A] transition-colors flex items-center gap-1.5">
                <Icon name="printer" /> In phiếu ({checkedIds.length})
              </button>
              <button onClick={() => setCheckedIds([])}
                className="text-[11px] font-semibold text-[#9B9389] hover:text-[#1A1A1A] transition-colors">
                Bỏ chọn
              </button>
            </div>
          ) : (
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
              <button onClick={() => fetchOrders()} title="Làm mới"
                className="w-9 h-9 flex items-center justify-center border border-[#EAE6DF] bg-white rounded-lg text-[#615C56] hover:border-[#1A1A1A] hover:text-[#1A1A1A] transition-colors">
                <Icon name="refresh" className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <table className="w-full">
          <thead>
            <tr className="bg-[#FAF8F5] border-b border-[#EAE6DF]">
              <th className="pl-5 pr-2 py-2.5 w-10">
                <input type="checkbox" checked={allPageChecked} onChange={toggleAll}
                  className="w-3.5 h-3.5 accent-[#1A1A1A] cursor-pointer" />
              </th>
              {['Mã đơn', 'Sản phẩm', 'Khách hàng', 'Tổng tiền', 'Trạng thái', 'Thao tác'].map((h, i) => (
                <th key={i} className={`px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[#9B9389] ${h === 'Thao tác' ? 'text-right pr-5' : ''}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="border-t border-[#FAF8F5] animate-pulse">
                  <td className="pl-5 pr-2 py-3"><div className="w-3.5 h-3.5 bg-[#F2EFEA] rounded" /></td>
                  {[80, 170, 110, 70, 90, 100].map((w, j) => (
                    <td key={j} className="px-3 py-3"><div className="h-3.5 bg-[#F2EFEA] rounded" style={{ width: w }}/></td>
                  ))}
                </tr>
              ))
              : orders.length === 0
                ? (
                  <tr><td colSpan={7} className="py-16 text-center">
                    <p className="text-[13px] font-semibold text-[#1A1A1A]">Không có đơn hàng</p>
                    <p className="text-[11px] text-[#9B9389] mt-1">
                      {search || dateFilter ? 'Thử đổi bộ lọc hoặc từ khóa' : activeStatus ? 'Không có đơn ở trạng thái này' : 'Tất cả đơn đã được xử lý'}
                    </p>
                  </td></tr>
                )
                : orders.map(o => {
                  const nextCfg = NEXT_STATUS[o.status]
                  const totalQty = o.items?.reduce((s, it) => s + it.qty, 0) || 0
                  const checked = checkedIds.includes(o._id)
                  return (
                    <tr key={o._id} onClick={() => setSelected(o)}
                      className={`border-t border-[#FAF8F5] cursor-pointer transition-colors ${checked ? 'bg-[#FAF8F5]' : 'hover:bg-[#FAF8F5]/50'}`}>
                      <td className="pl-5 pr-2 py-2.5" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={checked} onChange={() => toggleOne(o._id)}
                          className="w-3.5 h-3.5 accent-[#1A1A1A] cursor-pointer" />
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="text-[11.5px] font-mono font-bold text-[#1A1A1A] whitespace-nowrap">{o.orderCode || `#${o._id.slice(-8).toUpperCase()}`}</p>
                        <p className="text-[10px] text-[#9B9389] mt-0.5">{new Date(o.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</p>
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
                              <div className="w-7 h-10 bg-[#1A1A1A]/80 rounded ring-2 ring-white flex items-center justify-center text-white text-[9px] font-bold">
                                +{o.items.length - 3}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11.5px] font-medium text-[#1A1A1A] line-clamp-1 max-w-[200px]">{o.items?.[0]?.title}</p>
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
                        <p className={`text-[9.5px] font-bold uppercase tracking-wide mt-0.5 ${o.payment === 'COD' ? 'text-orange-600' : o.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-[#9B9389]'}`}>
                          {o.payment === 'COD' ? 'COD' : o.paymentStatus === 'PAID' ? 'Đã TT online' : 'Online'}
                        </p>
                      </td>
                      <td className="px-3 py-2.5"><StatusBadge status={o.status} /></td>
                      <td className="px-3 py-2.5 pr-5" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-1.5 justify-end items-center">
                          {nextCfg && (
                            <button onClick={() => advanceOrder(o)} disabled={advancingId === o._id}
                              className="px-2.5 py-1.5 text-[10.5px] font-semibold bg-[#1A1A1A] text-white rounded-lg hover:bg-[#333] disabled:opacity-50 transition-colors whitespace-nowrap">
                              {advancingId === o._id ? '…' : nextCfg.label}
                            </button>
                          )}
                          <button onClick={() => setSelected(o)} title="Xem chi tiết"
                            className="w-7 h-7 flex items-center justify-center border border-[#EAE6DF] rounded-lg text-[#615C56] hover:border-[#1A1A1A] hover:text-[#1A1A1A] transition-colors">
                            <Icon name="eye" />
                          </button>
                          <button onClick={() => printOrders([o])} title="In phiếu giao hàng"
                            className="w-7 h-7 flex items-center justify-center border border-[#EAE6DF] rounded-lg text-[#615C56] hover:border-[#1A1A1A] hover:text-[#1A1A1A] transition-colors">
                            <Icon name="printer" />
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
        {selected && (
          <OrderDetail key={selected._id} order={selected}
            onUpdate={handleUpdate}
            onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </WarehouseLayout>
  )
}
