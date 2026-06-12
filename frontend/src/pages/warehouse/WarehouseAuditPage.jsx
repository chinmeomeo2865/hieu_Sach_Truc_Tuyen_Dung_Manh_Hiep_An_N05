import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import WarehouseLayout from '../../components/warehouse/WarehouseLayout'
import { api }         from '../../services/api'
import { useToastStore } from '../../store/toastStore'

const REASONS = ['Rách/hỏng', 'Thất lạc', 'Lỗi vận chuyển', 'Mất mát', 'Kiểm đếm lại', 'Khác']

export default function WarehouseAuditPage() {
  const showToast = useToastStore(s => s.show)
  const [products,  setProducts]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [counts,    setCounts]    = useState({})   // { productId: { actual, reason } }
  const [submitting, setSubmitting] = useState(false)
  const timerRef = useRef(null)

  async function fetchProducts(q = search) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: 50 })
      if (q) params.set('search', q)
      const res = await api.get(`/api/warehouse/inventory?${params}`)
      setProducts(res.data)
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetchProducts() }, [])

  function handleSearch(e) {
    const val = e.target.value; setSearch(val)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => fetchProducts(val), 350)
  }

  function setCount(id, field, value) {
    setCounts(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
  }

  function getDiff(p) {
    const actual = counts[p._id]?.actual
    if (actual === '' || actual === undefined) return null
    return parseInt(actual) - p.stock
  }

  const changedItems = products.filter(p => {
    const c = counts[p._id]
    return c?.actual !== undefined && c.actual !== '' && parseInt(c.actual) !== p.stock
  })

  async function handleSubmit() {
    if (!changedItems.length) {
      showToast({ message: 'Không có thay đổi nào để lưu', type: 'info' }); return
    }
    setSubmitting(true)
    try {
      const items = changedItems.map(p => ({
        productId:   p._id,
        actualCount: parseInt(counts[p._id].actual),
        reason:      counts[p._id]?.reason || 'Kiểm kê',
      }))
      const res = await api.post('/api/warehouse/inventory/audit', { items })
      showToast({ message: `Đã cập nhật ${res.data.filter(r => r.diff !== 0).length} sản phẩm`, type: 'success' })
      setCounts({})
      fetchProducts()
    } catch (e) { showToast({ message: e.message, type: 'error' }) }
    finally { setSubmitting(false) }
  }

  return (
    <WarehouseLayout title="Kiểm kê kho">
      <div className="max-w-5xl mx-auto space-y-6 w-full py-4">
        {/* Title and subtitle */}
        <div className="flex flex-col items-center text-center gap-2 mb-2">
          <h1 className="font-display text-3xl font-bold text-ink leading-tight">Kiểm kê kho hàng</h1>
          <div className="h-0.5 w-10 bg-accent rounded-full" />
          <p className="text-[12.5px] text-muted font-semibold max-w-xl">Đối chiếu chênh lệch giữa số lượng tồn kho thực tế và trên hệ thống.</p>
        </div>

        {/* Action controls */}
        <div className="flex items-center justify-between gap-4 flex-wrap bg-white p-3 rounded-2xl border border-divider-lt shadow-sm">
          <div className="relative flex-1 max-w-xs min-w-[200px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35"/></svg>
            <input type="text" value={search} onChange={handleSearch} placeholder="Tìm sản phẩm kiểm kê…"
              className="w-full pl-9 pr-4 py-2 border border-divider-lt rounded-xl text-[12.5px] font-semibold bg-white placeholder:text-subtle focus:outline-none focus:border-ink transition-colors duration-200"/>
          </div>
          {changedItems.length > 0 && (
            <motion.button initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              onClick={handleSubmit} disabled={submitting}
              className="px-5 py-2.5 bg-ink text-white text-[12px] font-bold rounded-xl hover:bg-ink-80 disabled:opacity-50 transition-colors duration-200 shadow-sm whitespace-nowrap">
              {submitting ? 'Đang lưu…' : `Lưu thay đổi (${changedItems.length})`}
            </motion.button>
          )}
        </div>

        {/* Alert box */}
        {changedItems.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <p className="text-[11.5px] font-bold text-amber-800 flex items-center gap-1.5">
              <span>⚠️</span> Có {changedItems.length} sản phẩm bị chênh lệch số lượng. Bạn cần nhấn "Lưu thay đổi" để hệ thống cập nhật.
            </p>
          </motion.div>
        )}

        {/* Table Container */}
        <div className="bg-white rounded-2xl border border-divider-lt overflow-hidden shadow-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-divider-lt bg-surface-warm/30">
                <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-subtle">Sản phẩm</th>
                <th className="px-5 py-3.5 text-center text-[10px] font-bold uppercase tracking-widest text-subtle">Tồn hệ thống</th>
                <th className="px-5 py-3.5 text-center text-[10px] font-bold uppercase tracking-widest text-subtle">Thực tế</th>
                <th className="px-5 py-3.5 text-center text-[10px] font-bold uppercase tracking-widest text-subtle">Lệch</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-subtle">Lý do điều chỉnh</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-t border-divider-lt/50 animate-pulse">
                    {[200, 80, 80, 80, 120].map((w, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3.5 bg-surface-subtle rounded-full mx-auto" style={{ width: w }} />
                      </td>
                    ))}
                  </tr>
                ))
                : products.length === 0
                  ? (
                    <tr><td colSpan={5} className="py-24 text-center">
                      <p className="text-[13.5px] font-semibold text-ink">Không tìm thấy sản phẩm cần kiểm kê</p>
                    </td></tr>
                  )
                  : products.map((p, idx) => {
                    const diff = getDiff(p)
                    const hasChange = diff !== null && diff !== 0
                    return (
                      <motion.tr
                        key={p._id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03, duration: 0.2 }}
                        className={`border-t border-divider-lt transition-colors duration-200 ${hasChange ? (diff < 0 ? 'bg-red-50/20' : 'bg-emerald-50/20') : 'hover:bg-surface-warm/30'}`}
                      >
                        {/* Sản phẩm */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            {p.image && <img src={p.image} alt="" className="w-8 h-11 object-cover rounded-md bg-surface-warm shrink-0 shadow-sm border border-divider-lt/40"/>}
                            <div className="min-w-0">
                              <p className="text-[12.5px] font-bold text-ink line-clamp-1 leading-snug">{p.title}</p>
                              <p className="text-[11px] text-muted mt-0.5 font-medium">{p.author}</p>
                            </div>
                          </div>
                        </td>

                        {/* Tồn hệ thống */}
                        <td className="px-5 py-3 text-center">
                          <span className="text-[13px] font-bold text-ink tabular-nums">{p.stock}</span>
                        </td>

                        {/* Thực tế input */}
                        <td className="px-5 py-3 text-center">
                          <input
                            type="number" min="0" step="1"
                            value={counts[p._id]?.actual ?? ''}
                            onChange={e => setCount(p._id, 'actual', e.target.value)}
                            placeholder={String(p.stock)}
                            className="w-20 px-2.5 py-1.5 border border-divider-lt rounded-xl text-[12.5px] font-bold text-center focus:outline-none focus:border-ink transition-colors duration-200 bg-white"
                          />
                        </td>

                        {/* Lệch */}
                        <td className="px-5 py-3 text-center">
                          {diff === null ? <span className="text-subtle text-[11.5px]">—</span>
                            : diff === 0 ? <span className="text-[12.5px] text-emerald-600 font-bold">✓</span>
                            : <span className={`text-[12.5px] font-bold tabular-nums ${diff < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                                {diff > 0 ? '+' : ''}{diff}
                              </span>
                          }
                        </td>

                        {/* Lý do select */}
                        <td className="px-5 py-3">
                          {hasChange ? (
                            <select value={counts[p._id]?.reason || ''} onChange={e => setCount(p._id, 'reason', e.target.value)}
                              className="px-3 py-1.5 border border-divider-lt rounded-xl text-[11.5px] font-bold text-ink-80 focus:outline-none focus:border-ink bg-white shadow-sm">
                              <option value="">Chọn lý do…</option>
                              {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                          ) : <span className="text-subtle text-[11.5px]">—</span>}
                        </td>
                      </motion.tr>
                    )
                  })
              }
            </tbody>
          </table>
        </div>
      </div>
    </WarehouseLayout>
  )
}
