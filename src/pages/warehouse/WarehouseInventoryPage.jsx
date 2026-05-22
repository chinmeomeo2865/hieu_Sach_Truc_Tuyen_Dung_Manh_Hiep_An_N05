import { useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import WarehouseLayout from '../../components/warehouse/WarehouseLayout'
import { api }         from '../../services/api'
import { useToastStore } from '../../store/toastStore'
import { formatPrice }   from '../../utils/format'

function StockBadge({ stock }) {
  if (stock === 0)    return <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold border border-red-200">Hết hàng</span>
  if (stock <= 5)     return <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold border border-red-200">Còn {stock}</span>
  if (stock <= 10)    return <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">Sắp hết ({stock})</span>
  return <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">{stock}</span>
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
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f0f0]">
            <p className="text-[14px] font-semibold text-[#1c1c1a]">Nhập kho</p>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f5f5f4] text-[#a3a3a3] transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <div className="px-6 py-4">
            <div className="flex items-center gap-3 p-3 bg-[#fafafa] rounded-xl border border-[#f0f0f0] mb-5">
              {product.image && <img src={product.image} alt="" className="w-10 h-14 object-cover rounded-lg bg-[#f0f0f0] shrink-0" />}
              <div className="min-w-0">
                <p className="text-[12.5px] font-semibold text-[#1c1c1a] truncate">{product.title}</p>
                <p className="text-[11px] text-[#a3a3a3]">{product.author}</p>
                <p className="text-[11px] text-[#737373] mt-0.5">Tồn hiện tại: <span className="font-bold">{product.stock}</span></p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-[#525252] uppercase tracking-wider mb-1.5">Số lượng nhập *</label>
                <input
                  type="number" min="1" step="1"
                  value={form.quantity}
                  onChange={e => { setForm(f => ({ ...f, quantity: e.target.value })); setError('') }}
                  placeholder="Nhập số lượng..."
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-[13px] focus:outline-none transition-colors ${error ? 'border-red-400 bg-red-50' : 'border-[#e8e8e6] focus:border-[#1c1c1a]'}`}
                />
                {error && <p className="mt-1.5 text-[11px] text-red-500 font-medium">{error}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#525252] uppercase tracking-wider mb-1.5">Giá nhập (₫)</label>
                  <input type="number" min="0" value={form.costPrice} onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))}
                    placeholder="0" className="w-full px-3.5 py-2.5 border border-[#e8e8e6] rounded-xl text-[13px] focus:outline-none focus:border-[#1c1c1a] transition-colors"/>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#525252] uppercase tracking-wider mb-1.5">Nhà cung cấp</label>
                  <input type="text" value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))}
                    placeholder="Tên NCC..." className="w-full px-3.5 py-2.5 border border-[#e8e8e6] rounded-xl text-[13px] focus:outline-none focus:border-[#1c1c1a] transition-colors"/>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#525252] uppercase tracking-wider mb-1.5">Ghi chú</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} placeholder="Ghi chú thêm..." className="w-full px-3.5 py-2.5 border border-[#e8e8e6] rounded-xl text-[13px] focus:outline-none focus:border-[#1c1c1a] transition-colors resize-none"/>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-[#e8e8e6] rounded-xl text-[13px] font-semibold text-[#525252] hover:border-[#a3a3a3] transition-colors">Hủy</button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-2.5 bg-[#1c1c1a] text-white rounded-xl text-[13px] font-semibold hover:bg-[#333] disabled:opacity-50 transition-colors">
                  {loading ? 'Đang lưu…' : 'Xác nhận nhập kho'}
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
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a3a3a3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35"/></svg>
            <input type="text" value={search} onChange={handleSearch}
              placeholder="Tìm sách, tác giả…"
              className="w-full pl-9 pr-4 py-2.5 border border-[#e8e8e6] rounded-xl text-[13px] bg-white placeholder:text-[#c4c4c4] focus:outline-none focus:border-[#1c1c1a] transition-colors"/>
          </div>
          <div className="flex gap-1 bg-white border border-[#e8e8e6] rounded-xl p-1">
            {FILTERS.map(f => (
              <button key={f.value}
                onClick={() => setSearchParams(f.value ? { filter: f.value } : {})}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${activeFilter === f.value ? 'bg-[#1c1c1a] text-white' : 'text-[#737373] hover:text-[#1c1c1a]'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-[#e8e8e6] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#f0f0f0]">
                {['Sản phẩm', 'Thể loại', 'Giá bán', 'Tồn kho', ''].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left text-[10.5px] font-bold uppercase tracking-wider text-[#a3a3a3]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-t border-[#f5f5f4] animate-pulse">
                    {[180, 100, 80, 80, 60].map((w, j) => (
                      <td key={j} className="px-4 py-3.5"><div className="h-3.5 bg-[#f0f0f0] rounded-full" style={{ width: w }}/></td>
                    ))}
                  </tr>
                ))
                : products.length === 0
                  ? (
                    <tr><td colSpan={5} className="py-16 text-center">
                      <p className="text-[13px] font-semibold text-[#1c1c1a]">Không tìm thấy sản phẩm</p>
                      <p className="text-[11px] text-[#a3a3a3] mt-1">{search ? 'Thử từ khóa khác' : 'Kho trống'}</p>
                    </td></tr>
                  )
                  : products.map(p => (
                    <tr key={p._id}
                      className={`border-t border-[#f5f5f4] hover:bg-[#fafafa] transition-colors ${p.stock <= 5 ? 'bg-red-50/30' : p.stock <= 10 ? 'bg-amber-50/30' : ''}`}>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {p.image && <img src={p.image} alt="" className="w-9 h-12 object-cover rounded-lg bg-[#f0f0f0] shrink-0"/>}
                          <div>
                            <p className="text-[12.5px] font-semibold text-[#1c1c1a] line-clamp-1">{p.title}</p>
                            <p className="text-[11px] text-[#a3a3a3]">{p.author}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-[11px] text-[#737373]">{p.category}</td>
                      <td className="px-4 py-3.5 text-[12px] font-semibold text-[#1c1c1a]">{formatPrice(p.price)}</td>
                      <td className="px-4 py-3.5"><StockBadge stock={p.stock} /></td>
                      <td className="px-4 py-3.5">
                        <button onClick={() => setImporting(p)}
                          className="px-3 py-1.5 text-[11px] font-semibold bg-[#1c1c1a] text-white rounded-lg hover:bg-[#333] transition-colors whitespace-nowrap">
                          + Nhập kho
                        </button>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#f0f0f0]">
              <p className="text-[11px] text-[#a3a3a3]">{pagination.total} sản phẩm · Trang {pagination.page}/{pagination.totalPages}</p>
              <div className="flex gap-1.5">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-[11px] border border-[#e8e8e6] rounded-lg disabled:opacity-40 hover:border-[#1c1c1a] transition-colors">← Trước</button>
                <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-[11px] border border-[#e8e8e6] rounded-lg disabled:opacity-40 hover:border-[#1c1c1a] transition-colors">Tiếp →</button>
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
