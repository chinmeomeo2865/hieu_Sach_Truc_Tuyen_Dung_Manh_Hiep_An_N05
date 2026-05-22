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
      <div className="space-y-4 max-w-5xl">

        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a3a3a3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35"/></svg>
            <input type="text" value={search} onChange={handleSearch} placeholder="Tìm sản phẩm…"
              className="w-full pl-9 pr-4 py-2.5 border border-[#e8e8e6] rounded-xl text-[13px] bg-white placeholder:text-[#c4c4c4] focus:outline-none focus:border-[#1c1c1a] transition-colors"/>
          </div>
          {changedItems.length > 0 && (
            <motion.button initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              onClick={handleSubmit} disabled={submitting}
              className="px-5 py-2.5 bg-[#1c1c1a] text-white text-[12.5px] font-semibold rounded-xl hover:bg-[#333] disabled:opacity-50 transition-colors">
              {submitting ? 'Đang lưu…' : `Lưu kiểm kê (${changedItems.length} thay đổi)`}
            </motion.button>
          )}
        </div>

        {changedItems.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <p className="text-[12px] font-semibold text-amber-800">
              ⚠️ {changedItems.length} sản phẩm có thay đổi tồn kho — nhớ lưu trước khi rời trang.
            </p>
          </motion.div>
        )}

        <div className="bg-white rounded-xl border border-[#e8e8e6] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#f0f0f0]">
                {['Sản phẩm', 'Tồn HT', 'Thực tế', 'Lệch', 'Lý do'].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left text-[10.5px] font-bold uppercase tracking-wider text-[#a3a3a3]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-t border-[#f5f5f4] animate-pulse">
                    {[180, 60, 80, 60, 120].map((w, j) => (
                      <td key={j} className="px-4 py-3.5"><div className="h-3.5 bg-[#f0f0f0] rounded-full" style={{ width: w }}/></td>
                    ))}
                  </tr>
                ))
                : products.map(p => {
                  const diff = getDiff(p)
                  const hasChange = diff !== null && diff !== 0
                  return (
                    <tr key={p._id} className={`border-t border-[#f5f5f4] transition-colors ${hasChange ? (diff < 0 ? 'bg-red-50/40' : 'bg-emerald-50/40') : 'hover:bg-[#fafafa]'}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {p.image && <img src={p.image} alt="" className="w-8 h-11 object-cover rounded-md bg-[#f0f0f0] shrink-0"/>}
                          <div>
                            <p className="text-[12px] font-semibold text-[#1c1c1a] line-clamp-1">{p.title}</p>
                            <p className="text-[10px] text-[#a3a3a3]">{p.author}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[13px] font-bold text-[#1c1c1a]">{p.stock}</span>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number" min="0" step="1"
                          value={counts[p._id]?.actual ?? ''}
                          onChange={e => setCount(p._id, 'actual', e.target.value)}
                          placeholder={String(p.stock)}
                          className="w-20 px-2.5 py-1.5 border border-[#e8e8e6] rounded-lg text-[12px] focus:outline-none focus:border-[#1c1c1a] transition-colors text-center"
                        />
                      </td>
                      <td className="px-4 py-3">
                        {diff === null ? <span className="text-[#d4d4d4] text-[11px]">—</span>
                          : diff === 0 ? <span className="text-[11px] text-emerald-600 font-semibold">✓</span>
                          : <span className={`text-[12px] font-bold ${diff < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                              {diff > 0 ? '+' : ''}{diff}
                            </span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        {hasChange ? (
                          <select value={counts[p._id]?.reason || ''} onChange={e => setCount(p._id, 'reason', e.target.value)}
                            className="px-2.5 py-1.5 border border-[#e8e8e6] rounded-lg text-[11px] focus:outline-none focus:border-[#1c1c1a] bg-white">
                            <option value="">Chọn lý do…</option>
                            {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        ) : <span className="text-[#d4d4d4] text-[11px]">—</span>}
                      </td>
                    </tr>
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
