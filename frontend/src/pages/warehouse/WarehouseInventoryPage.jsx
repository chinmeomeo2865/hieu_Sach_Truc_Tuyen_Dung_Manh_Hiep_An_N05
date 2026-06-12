import { useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import WarehouseLayout from '../../components/warehouse/WarehouseLayout'
import { api }         from '../../services/api'
import { useToastStore } from '../../store/toastStore'
import { formatPrice }   from '../../utils/format'

function StockBadge({ stock }) {
  if (stock === 0)    return <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-[10.5px] font-semibold border border-red-100 whitespace-nowrap">Hết hàng</span>
  if (stock <= 5)     return <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-[10.5px] font-semibold border border-red-100 whitespace-nowrap">Còn {stock}</span>
  if (stock <= 10)    return <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10.5px] font-semibold border border-amber-100 whitespace-nowrap">Sắp hết ({stock})</span>
  return <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10.5px] font-semibold border border-emerald-100 whitespace-nowrap">{stock}</span>
}

function ImportModal({ product, onClose, onSuccess }) {
  const showToast = useToastStore(s => s.show)
  const [form, setForm]     = useState({ quantity: '', costPrice: '', supplier: '', notes: '' })
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
        costPrice: form.costPrice ? parseFloat(form.costPrice) : undefined,
        supplier:  form.supplier || undefined,
        notes:     form.notes || undefined,
      })
      showToast({ message: `Nhập kho thành công: +${qty} "${product.title}"`, type: 'success' })
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
        <div className="bg-white rounded-2xl shadow-card-h border border-divider-lt w-full max-w-md pointer-events-auto overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-divider-lt">
            <p className="font-display text-[15px] font-bold text-ink">Nhập kho bổ sung</p>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-subtle text-subtle hover:text-ink transition-colors duration-200">
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <div className="px-6 py-5">
            <div className="flex items-start gap-4 p-4 bg-surface-warm rounded-xl border border-divider-lt mb-5">
              {product.image && <img src={product.image} alt="" className="w-10 h-14 object-cover rounded-lg bg-white shrink-0 shadow-sm" />}
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-ink truncate leading-snug">{product.title}</p>
                <p className="text-[11px] text-muted font-medium mt-0.5">{product.author}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-subtle font-semibold uppercase tracking-wider">Tồn hiện tại:</span>
                  <StockBadge stock={product.stock} />
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-ink-80 uppercase tracking-widest mb-1.5">Số lượng nhập *</label>
                <input
                  type="number" min="1" step="1"
                  value={form.quantity}
                  onChange={e => { setForm(f => ({ ...f, quantity: e.target.value })); setError('') }}
                  placeholder="Nhập số lượng..."
                  className={`w-full px-4 py-2.5 border rounded-xl text-[13px] font-semibold focus:outline-none transition-all duration-200 ${error ? 'border-red-400 bg-red-50 text-red-900 focus:border-red-500' : 'border-divider-lt focus:border-ink focus:ring-1 focus:ring-ink/20'}`}
                />
                {error && <p className="mt-1.5 text-[10.5px] text-red-600 font-semibold">{error}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-ink-80 uppercase tracking-widest mb-1.5">Giá nhập (₫)</label>
                <input type="number" min="0" value={form.costPrice} onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))}
                  placeholder="Nhập giá nhập..." className="w-full px-4 py-2.5 border border-divider-lt rounded-xl text-[13px] font-semibold focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink/20 transition-all duration-200"/>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-ink-80 uppercase tracking-widest mb-1.5">Ghi chú</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} placeholder="Ghi chú thêm về lô hàng này..." className="w-full px-4 py-2.5 border border-divider-lt rounded-xl text-[13px] font-medium focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink/20 transition-all duration-200 resize-none"/>
              </div>

              <div className="flex gap-3 pt-3">
                <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-divider-lt rounded-xl text-[12.5px] font-bold text-ink-80 hover:bg-surface-warm transition-colors duration-200">Hủy</button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-2.5 bg-ink text-white rounded-xl text-[12.5px] font-bold hover:bg-ink-80 disabled:opacity-50 transition-colors duration-200 shadow-sm">
                  {loading ? 'Đang lưu…' : 'Xác nhận nhập'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </>
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
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [importing,   setImporting]   = useState(null)
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

  return (
    <WarehouseLayout title="Quản lý tồn kho">
      <div className="max-w-5xl mx-auto space-y-6 w-full py-4">
        {/* Title and stats summary */}
        <div className="flex flex-col items-center text-center gap-2 mb-2">
          <h1 className="font-display text-3xl font-bold text-ink leading-tight">Quản lý tồn kho</h1>
          <div className="h-0.5 w-10 bg-accent rounded-full" />
          <p className="text-[12.5px] text-muted font-semibold max-w-xl">Theo dõi số lượng tồn kho, nhập hàng và kiểm soát mức tồn tối thiểu.</p>
        </div>

        {/* Controls */}
        <div className="flex gap-4 flex-wrap justify-between items-center bg-white p-3 rounded-2xl border border-divider-lt shadow-sm">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35"/></svg>
            <input type="text" value={search} onChange={handleSearch}
              placeholder="Tìm sách theo tiêu đề hoặc tác giả…"
              className="w-full pl-9.5 pr-4 py-2 border border-divider-lt rounded-xl text-[12.5px] font-semibold bg-white placeholder:text-subtle focus:outline-none focus:border-ink transition-colors duration-200"/>
          </div>
          <div className="flex gap-1.5 bg-surface-warm border border-divider-lt rounded-xl p-1 shrink-0">
            {FILTERS.map(f => (
              <button key={f.value}
                onClick={() => setSearchParams(f.value ? { filter: f.value } : {})}
                className={`px-4 py-1.5 rounded-lg text-[11.5px] font-bold tracking-wide transition-all duration-200 ${activeFilter === f.value ? 'bg-ink text-white shadow-card' : 'text-ink-80 hover:text-ink hover:bg-surface-subtle'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-2xl border border-divider-lt overflow-hidden shadow-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-divider-lt bg-surface-warm/30">
                <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-subtle">Sản phẩm</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-subtle">Thể loại</th>
                <th className="px-5 py-3.5 text-right text-[10px] font-bold uppercase tracking-widest text-subtle">Giá bán</th>
                <th className="px-5 py-3.5 text-center text-[10px] font-bold uppercase tracking-widest text-subtle">Tồn kho</th>
                <th className="px-5 py-3.5 text-center text-[10px] font-bold uppercase tracking-widest text-subtle" />
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-t border-divider-lt/50 animate-pulse">
                    {[200, 100, 80, 80, 80].map((w, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3.5 bg-surface-subtle rounded-full" style={{ width: w }}/>
                      </td>
                    ))}
                  </tr>
                ))
                : products.length === 0
                  ? (
                    <tr><td colSpan={5} className="py-24 text-center">
                      <div className="w-14 h-14 bg-surface-warm border border-divider-lt rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" /></svg>
                      </div>
                      <p className="text-[14px] font-semibold text-ink">Không tìm thấy sản phẩm</p>
                      <p className="text-[12px] text-muted mt-1">{search ? 'Thử tìm với từ khóa khác' : 'Kho hàng chưa có dữ liệu sản phẩm'}</p>
                    </td></tr>
                  )
                  : products.map((p, idx) => (
                    <motion.tr key={p._id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03, duration: 0.22 }}
                      className={`border-t border-divider-lt hover:bg-surface-warm/30 transition-all duration-200 group`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3.5">
                          {p.image && <img src={p.image} alt="" className="w-9 h-13 object-cover rounded-lg bg-surface-warm shrink-0 shadow-sm border border-divider-lt/40"/>}
                          <div className="min-w-0">
                            <p className="text-[12.5px] font-bold text-ink line-clamp-1 leading-snug">{p.title}</p>
                            <p className="text-[11px] text-muted mt-0.5 font-medium">{p.author}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[11.5px] font-semibold text-ink-80">{p.category}</td>
                      <td className="px-5 py-3.5 text-[13px] font-bold text-ink text-right tabular-nums">{formatPrice(p.price)}</td>
                      <td className="px-5 py-3.5 text-center"><StockBadge stock={p.stock} /></td>
                      <td className="px-5 py-3.5 text-right">
                        <button onClick={() => setImporting(p)}
                          className="px-3.5 py-1.5 text-[11px] font-bold bg-white text-ink border border-divider rounded-xl hover:bg-ink hover:text-white hover:border-ink transition-all duration-200 whitespace-nowrap shadow-sm">
                          + Nhập kho
                        </button>
                      </td>
                    </motion.tr>
                  ))
              }
            </tbody>
          </table>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-divider-lt bg-surface-warm/20">
              <p className="text-[11px] text-muted font-medium tabular-nums">{pagination.total} sản phẩm · Trang {pagination.page}/{pagination.totalPages}</p>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-[11px] font-bold border border-divider-lt rounded-xl disabled:opacity-40 hover:border-ink bg-white transition-colors duration-200 disabled:cursor-not-allowed">← Trước</button>
                <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-[11px] font-bold border border-divider-lt rounded-xl disabled:opacity-40 hover:border-ink bg-white transition-colors duration-200 disabled:cursor-not-allowed">Tiếp →</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {importing && (
          <ImportModal
            product={importing}
            onClose={() => setImporting(null)}
            onSuccess={() => { setImporting(null); fetchProducts() }}
          />
        )}
      </AnimatePresence>
    </WarehouseLayout>
  )
}
