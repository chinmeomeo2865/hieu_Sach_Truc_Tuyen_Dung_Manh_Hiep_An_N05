import { useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import WarehouseLayout from '../../components/warehouse/WarehouseLayout'
import { api }         from '../../services/api'
import { useToastStore } from '../../store/toastStore'
import { formatPrice }   from '../../utils/format'

/* ─── Icons — đồng bộ với WarehouseDashboard ────────────────── */
const ICON_PATHS = {
  layers: <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />,
  alert: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
  book: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />,
  cash: <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />,
  search: <><circle cx="11" cy="11" r="8" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" /></>,
  close: <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />,
}

function Icon({ name, className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      {ICON_PATHS[name]}
    </svg>
  )
}

/* ─── Stat card — mirror WarehouseDashboard ─────────────────── */
function StatCard({ icon, label, value, valueColor = 'text-[#1A1A1A]', footer, footerColor = 'text-[#615C56]' }) {
  return (
    <div className="bg-white rounded-lg border border-[#EAE6DF] p-4 shadow-sm h-full">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-wider text-[#615C56] uppercase">{label}</span>
        <div className="border border-[#EAE6DF] p-0.5 bg-[#FAF8F5] rounded text-[#615C56]">
          <Icon name={icon} />
        </div>
      </div>
      <p className={`font-display text-[22px] font-bold mt-2 mb-2 ${valueColor}`}>{value}</p>
      <div className="border-t border-[#EAE6DF] pt-2 mt-2">
        <p className={`text-[11px] font-medium ${footerColor}`}>{footer}</p>
      </div>
    </div>
  )
}

function SkeletonStat() {
  return (
    <div className="bg-[#F2EFEA] border border-[#EAE6DF] rounded-lg p-4 h-[112px] animate-pulse">
      <div className="h-3 bg-[#E6E1DA] rounded w-1/2 mb-4" />
      <div className="h-7 bg-[#E6E1DA] rounded w-2/3 mb-4" />
      <div className="border-t border-[#E6E1DA] pt-3 mt-3">
        <div className="h-3 bg-[#E6E1DA] rounded w-3/4" />
      </div>
    </div>
  )
}

/* ─── Stock cell: số tồn + badge trạng thái ─────────────────── */
function StockCell({ stock }) {
  const numberColor = stock === 0 ? 'text-red-600' : stock <= 10 ? 'text-amber-600' : 'text-[#1A1A1A]'
  return (
    <div className="flex items-center gap-2">
      <span className={`font-display text-[13.5px] font-bold ${numberColor}`}>{stock}</span>
      {stock === 0 && (
        <span className="bg-red-50 text-red-600 border border-red-200/50 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide">Hết hàng</span>
      )}
      {stock > 0 && stock <= 10 && (
        <span className="bg-amber-50 text-amber-700 border border-amber-200/50 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide">Sắp hết</span>
      )}
    </div>
  )
}

/* ─── Modal khung chung cho Nhập / Xuất ─────────────────────── */
function ModalShell({ title, product, onClose, children }) {
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="bg-white rounded-xl border border-[#EAE6DF] shadow-2xl w-full max-w-md pointer-events-auto">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#EAE6DF]">
            <p className="font-display text-[13px] font-bold uppercase tracking-wider text-[#1A1A1A]">{title}</p>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#FAF8F5] text-[#9B9389] transition-colors">
              <Icon name="close" className="w-4 h-4" />
            </button>
          </div>

          <div className="px-5 py-4">
            <div className="flex items-center gap-3 p-3 bg-[#FAF8F5] rounded-lg border border-[#EAE6DF] mb-5">
              {product.image && <img src={product.image} alt="" className="w-10 h-14 object-cover rounded-md shadow-sm shrink-0" />}
              <div className="min-w-0">
                <p className="text-[12.5px] font-semibold text-[#1A1A1A] truncate">{product.title}</p>
                <p className="text-[10.5px] text-[#9B9389]">{product.author}</p>
                <p className="text-[11px] text-[#615C56] mt-0.5">Tồn hiện tại: <span className="font-display font-bold text-[#1A1A1A]">{product.stock}</span></p>
              </div>
            </div>
            {children}
          </div>
        </div>
      </motion.div>
    </>
  )
}

const FIELD_LABEL = 'block text-[10px] font-bold text-[#615C56] uppercase tracking-wider mb-1.5'
const FIELD_INPUT = 'w-full px-3.5 py-2.5 border border-[#EAE6DF] rounded-lg text-[13px] bg-white placeholder:text-[#D8D2CA] focus:outline-none focus:border-[#1A1A1A] transition-colors'

function ImportModal({ product, onClose, onSuccess }) {
  const showToast = useToastStore(s => s.show)
  const [form, setForm]     = useState({ quantity: '', notes: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const qty = parseInt(form.quantity)
    if (!qty || qty <= 0 || isNaN(qty)) {
      setError('Số lượng không hợp lệ — phải là số dương')
      return
    }
    setError('')
    setLoading(true)
    try {
      await api.post('/api/warehouse/inventory/import', {
        productId: product._id,
        quantity:  qty,
        notes:     form.notes || undefined,
      })
      showToast({ message: `Nhập kho thành công: +${qty} "${product.title}"`, type: 'success' })
      onSuccess()
    } catch (e) { showToast({ message: e.message, type: 'error' }) }
    finally { setLoading(false) }
  }

  return (
    <ModalShell title="Nhập kho" product={product} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={FIELD_LABEL}>Số lượng nhập *</label>
          <input
            type="number" min="1" step="1"
            value={form.quantity}
            onChange={e => { setForm(f => ({ ...f, quantity: e.target.value })); setError('') }}
            placeholder="Nhập số lượng…"
            className={error ? `${FIELD_INPUT} border-red-400 bg-red-50` : FIELD_INPUT}
          />
          {error && <p className="mt-1.5 text-[11px] text-red-500 font-medium">{error}</p>}
        </div>

        <div>
          <label className={FIELD_LABEL}>Ghi chú</label>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            rows={2} placeholder="Ghi chú thêm…" className={`${FIELD_INPUT} resize-none`}/>
        </div>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-[#EAE6DF] rounded-lg text-[12px] font-semibold text-[#615C56] hover:border-[#9B9389] transition-colors">Hủy</button>
          <button type="submit" disabled={loading}
            className="flex-1 py-2.5 bg-[#1A1A1A] text-white rounded-lg text-[12px] font-semibold hover:bg-[#333] disabled:opacity-50 transition-colors">
            {loading ? 'Đang lưu…' : 'Xác nhận nhập kho'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}

function ExportModal({ product, onClose, onSuccess }) {
  const showToast = useToastStore(s => s.show)
  const [form, setForm]     = useState({ quantity: '', reason: '', notes: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const qty = parseInt(form.quantity)
    if (!qty || qty <= 0 || isNaN(qty)) {
      setError('Số lượng không hợp lệ — phải là số dương')
      return
    }
    if (qty > product.stock) {
      setError(`Số lượng xuất vượt tồn kho hiện tại (${product.stock})`)
      return
    }
    setError('')
    setLoading(true)
    try {
      await api.post('/api/warehouse/inventory/export', {
        productId: product._id,
        quantity:  qty,
        reason:    form.reason || undefined,
        notes:     form.notes || undefined,
      })
      showToast({ message: `Xuất kho thành công: -${qty} "${product.title}"`, type: 'success' })
      onSuccess()
    } catch (e) { showToast({ message: e.message, type: 'error' }) }
    finally { setLoading(false) }
  }

  return (
    <ModalShell title="Xuất kho" product={product} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={FIELD_LABEL}>Số lượng xuất *</label>
          <input
            type="number" min="1" max={product.stock} step="1"
            value={form.quantity}
            onChange={e => { setForm(f => ({ ...f, quantity: e.target.value })); setError('') }}
            placeholder={`Tối đa ${product.stock}…`}
            className={error ? `${FIELD_INPUT} border-red-400 bg-red-50` : FIELD_INPUT}
          />
          {error && <p className="mt-1.5 text-[11px] text-red-500 font-medium">{error}</p>}
        </div>

        <div>
          <label className={FIELD_LABEL}>Lý do xuất</label>
          <input type="text" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
            placeholder="Hỏng/mất, trả nhà cung cấp, điều chuyển…" className={FIELD_INPUT}/>
        </div>

        <div>
          <label className={FIELD_LABEL}>Ghi chú</label>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            rows={2} placeholder="Ghi chú thêm…" className={`${FIELD_INPUT} resize-none`}/>
        </div>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-[#EAE6DF] rounded-lg text-[12px] font-semibold text-[#615C56] hover:border-[#9B9389] transition-colors">Hủy</button>
          <button type="submit" disabled={loading}
            className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-[12px] font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors">
            {loading ? 'Đang lưu…' : 'Xác nhận xuất kho'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}

const FILTERS = [
  { value: '', label: 'Tất cả' },
  { value: 'low', label: 'Sắp hết (≤10)' },
  { value: 'out', label: 'Hết hàng' },
]

export default function WarehouseInventoryPage() {
  const showToast = useToastStore(s => s.show)
  const [searchParams, setSearchParams] = useSearchParams()
  const [products,    setProducts]    = useState([])
  const [summary,     setSummary]     = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [importing,   setImporting]   = useState(null)
  const [exporting,   setExporting]   = useState(null)
  const [page,        setPage]        = useState(1)
  const [pagination,  setPagination]  = useState({})

  const activeFilter = searchParams.get('filter') || ''
  const timerRef = useRef(null)

  const fetchProducts = useCallback(async (q = search) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 30 })
      if (q) params.set('search', q)
      if (activeFilter) params.set('filter', activeFilter)
      const res = await api.get(`/api/warehouse/inventory?${params}`)
      setProducts(res.data)
      setSummary(res.summary || null)
      setPagination(res.pagination || {})
    } catch (e) { showToast({ message: e.message, type: 'error' }) }
    finally { setLoading(false) }
  }, [page, activeFilter])

  useEffect(() => { fetchProducts() }, [fetchProducts])
  useEffect(() => { setPage(1) }, [activeFilter])

  function handleSearch(e) {
    const val = e.target.value
    setSearch(val)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => { setPage(1); fetchProducts(val) }, 350)
  }

  const alertCount = summary ? summary.lowCount + summary.outCount : 0

  return (
    <WarehouseLayout title="Quản lý tồn kho">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#EAE6DF] pb-3 mb-5">
        <div>
          <h2 className="font-display text-[14.5px] font-bold text-[#1A1A1A] uppercase tracking-wider">Quản lý tồn kho</h2>
          <p className="text-[11px] text-[#9B9389] mt-0.5">Theo dõi số lượng, giá trị tồn và thao tác nhập / xuất kho</p>
        </div>
      </div>

      {/* Stat cards */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {!summary ? (
          <><SkeletonStat /><SkeletonStat /><SkeletonStat /><SkeletonStat /></>
        ) : (
          <>
            <StatCard
              icon="book" label="Tổng đầu sách" value={`${summary.totalSku} SKU`}
              footer="Sản phẩm đang kinh doanh"
            />
            <StatCard
              icon="layers" label="Tổng tồn kho" value={`${summary.totalUnits.toLocaleString('vi-VN')} cuốn`}
              footer="Trên toàn bộ kho hàng"
            />
            <StatCard
              icon="alert" label="Sắp hết / hết hàng" value={`${alertCount} đầu sách`}
              valueColor={alertCount > 0 ? 'text-red-600' : 'text-[#1A1A1A]'}
              footer={alertCount > 0 ? `${summary.outCount} hết hàng · ${summary.lowCount} sắp hết` : 'Tồn kho ổn định'}
              footerColor={alertCount > 0 ? 'text-red-600' : 'text-emerald-600'}
            />
            <StatCard
              icon="cash" label="Giá trị tồn kho" value={formatPrice(summary.totalValue)}
              footer="Tính theo giá bán hiện tại"
            />
          </>
        )}
      </motion.div>

      {/* Table card */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-white rounded-xl border border-[#EAE6DF] shadow-sm overflow-hidden">
        {/* Card header + toolbar */}
        <div className="px-5 py-4 border-b border-[#EAE6DF]">
          <div className="flex items-center justify-between mb-3">
            <p className="font-display text-[13px] font-bold uppercase tracking-wider text-[#1A1A1A]">Danh sách tồn kho</p>
            {pagination.total > 0 && (
              <span className="bg-[#FAF8F5] text-[#615C56] border border-[#EAE6DF] px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                {pagination.total} sản phẩm
              </span>
            )}
          </div>
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9B9389]"><Icon name="search" className="w-4 h-4" /></span>
              <input type="text" value={search} onChange={handleSearch}
                placeholder="Tìm sách, tác giả…"
                className="w-full pl-9 pr-4 py-2 border border-[#EAE6DF] rounded-lg text-[12.5px] bg-white placeholder:text-[#D8D2CA] focus:outline-none focus:border-[#1A1A1A] transition-colors"/>
            </div>
            <div className="flex gap-1 bg-[#FAF8F5] border border-[#EAE6DF] rounded-lg p-1">
              {FILTERS.map(f => (
                <button key={f.value}
                  onClick={() => setSearchParams(f.value ? { filter: f.value } : {})}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-colors ${activeFilter === f.value ? 'bg-[#1A1A1A] text-white' : 'text-[#615C56] hover:text-[#1A1A1A]'}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <table className="w-full">
          <thead>
            <tr className="bg-[#FAF8F5] border-b border-[#EAE6DF]">
              {['Sản phẩm', 'Thể loại', 'Giá bán', 'Tồn kho', 'Giá trị tồn', ''].map((h, i) => (
                <th key={i} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#9B9389]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="border-t border-[#FAF8F5] animate-pulse">
                  {[180, 90, 70, 70, 90, 110].map((w, j) => (
                    <td key={j} className="px-5 py-3.5"><div className="h-3.5 bg-[#F2EFEA] rounded" style={{ width: w }}/></td>
                  ))}
                </tr>
              ))
              : products.length === 0
                ? (
                  <tr><td colSpan={6} className="py-16 text-center">
                    <p className="text-[13px] font-semibold text-[#1A1A1A]">Không tìm thấy sản phẩm</p>
                    <p className="text-[11px] text-[#9B9389] mt-1">{search ? 'Thử từ khóa khác' : 'Kho trống'}</p>
                  </td></tr>
                )
                : products.map(p => (
                  <tr key={p._id} className="border-t border-[#FAF8F5] hover:bg-[#FAF8F5]/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {p.image
                          ? <img src={p.image} alt="" className="w-8 h-11 object-cover rounded-md shadow-sm shrink-0"/>
                          : <div className="w-8 h-11 bg-[#FAF8F5] rounded-md border border-[#EAE6DF] shrink-0"/>}
                        <div className="min-w-0">
                          <p className="text-[12.5px] font-semibold text-[#1A1A1A] line-clamp-1">{p.title}</p>
                          <p className="text-[10.5px] text-[#9B9389]">{p.author}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[11.5px] text-[#615C56]">{p.category}</td>
                    <td className="px-5 py-3.5 text-[12px] font-medium text-[#1A1A1A]">{formatPrice(p.price)}</td>
                    <td className="px-5 py-3.5"><StockCell stock={p.stock} /></td>
                    <td className="px-5 py-3.5">
                      {p.stock > 0
                        ? <span className="font-display text-[12.5px] font-bold text-[#1A1A1A]">{formatPrice(p.stock * p.price)}</span>
                        : <span className="text-[12px] text-[#D8D2CA]">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1.5 justify-end">
                        <button onClick={() => setImporting(p)}
                          className="px-2.5 py-1.5 text-[11px] font-semibold border border-[#EAE6DF] text-[#1A1A1A] rounded-lg hover:bg-[#1A1A1A] hover:border-[#1A1A1A] hover:text-white transition-colors whitespace-nowrap">
                          + Nhập
                        </button>
                        <button onClick={() => setExporting(p)} disabled={p.stock === 0}
                          className="px-2.5 py-1.5 text-[11px] font-semibold border border-red-200 text-red-600 rounded-lg hover:bg-red-600 hover:border-red-600 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-red-600 disabled:hover:border-red-200 transition-colors whitespace-nowrap">
                          − Xuất
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>

        {/* Footer / pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#EAE6DF] bg-[#FAF8F5]/50">
            <p className="text-[11px] text-[#9B9389] font-medium">{pagination.total} sản phẩm · Trang {pagination.page}/{pagination.totalPages}</p>
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
        {importing && (
          <ImportModal
            product={importing}
            onClose={() => setImporting(null)}
            onSuccess={() => { setImporting(null); fetchProducts() }}
          />
        )}
        {exporting && (
          <ExportModal
            product={exporting}
            onClose={() => setExporting(null)}
            onSuccess={() => { setExporting(null); fetchProducts() }}
          />
        )}
      </AnimatePresence>
    </WarehouseLayout>
  )
}
