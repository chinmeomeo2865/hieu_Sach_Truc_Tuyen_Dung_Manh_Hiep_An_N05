import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import WarehouseLayout from '../../components/warehouse/WarehouseLayout'
import { api }         from '../../services/api'
import { useToastStore } from '../../store/toastStore'

const REASONS = ['Rách/hỏng', 'Thất lạc', 'Lỗi vận chuyển', 'Mất mát', 'Kiểm đếm lại', 'Khác']

/* ─── Icons — đồng bộ với WarehouseDashboard ────────────────── */
const ICON_PATHS = {
  check: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
  alert: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
  book: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />,
  clipboard: <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
  search: <><circle cx="11" cy="11" r="8" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" /></>,
}

function Icon({ name, className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      {ICON_PATHS[name]}
    </svg>
  )
}

/* ─── Stat card — mirror WarehouseDashboard ─────────────────── */
function StatCard({ icon, label, value, valueColor = 'text-[#1A1A1A]', footer, footerColor = 'text-[#615C56]', children }) {
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
        {children || <p className={`text-[11px] font-medium ${footerColor}`}>{footer}</p>}
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

/* ─── Badge chênh lệch: chưa đếm / khớp / thừa / thiếu ──────── */
function DiffBadge({ diff }) {
  if (diff === null) return (
    <span className="bg-[#FAF8F5] text-[#9B9389] border border-[#EAE6DF] px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide">Chưa đếm</span>
  )
  if (diff === 0) return (
    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/50 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide">Khớp</span>
  )
  if (diff > 0) return (
    <span className="bg-sky-50 text-sky-700 border border-sky-200/50 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">+{diff} thừa</span>
  )
  return (
    <span className="bg-red-50 text-red-600 border border-red-200/50 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">{diff} thiếu</span>
  )
}

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

  const countedItems = products.filter(p => {
    const c = counts[p._id]
    return c?.actual !== undefined && c.actual !== ''
  })
  const changedItems = countedItems.filter(p => parseInt(counts[p._id].actual) !== p.stock)
  const matchedCount = countedItems.length - changedItems.length
  const surplusCount = changedItems.filter(p => getDiff(p) > 0).length
  const deficitCount = changedItems.filter(p => getDiff(p) < 0).length
  const progressPct  = products.length ? Math.round((countedItems.length / products.length) * 100) : 0

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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#EAE6DF] pb-3 mb-5">
        <div>
          <h2 className="font-display text-[14.5px] font-bold text-[#1A1A1A] uppercase tracking-wider">Kiểm kê kho</h2>
          <p className="text-[11px] text-[#9B9389] mt-0.5">Đối chiếu tồn kho thực tế với hệ thống và điều chỉnh sai lệch</p>
        </div>
        <button
          onClick={handleSubmit} disabled={submitting || !changedItems.length}
          className="px-5 py-2.5 bg-[#1A1A1A] text-white text-[12px] font-semibold rounded-lg hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0">
          {submitting ? 'Đang lưu…' : changedItems.length ? `Hoàn tất kiểm kê (${changedItems.length} điều chỉnh)` : 'Hoàn tất kiểm kê'}
        </button>
      </div>

      {/* Stat cards — tiến độ kiểm kê */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {loading && !products.length ? (
          <><SkeletonStat /><SkeletonStat /><SkeletonStat /><SkeletonStat /></>
        ) : (
          <>
            <StatCard
              icon="book" label="Sản phẩm kiểm kê" value={`${products.length} SKU`}
              footer={search ? 'Theo từ khóa tìm kiếm' : 'Toàn bộ danh sách hiển thị'}
            />
            <StatCard icon="clipboard" label="Tiến độ đếm" value={`${countedItems.length}/${products.length}`}>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-[#F2EFEA] rounded-full overflow-hidden">
                  <div className="h-full bg-[#1A1A1A] rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
                </div>
                <span className="text-[11px] font-bold text-[#615C56]">{progressPct}%</span>
              </div>
            </StatCard>
            <StatCard
              icon="check" label="Khớp hệ thống" value={`${matchedCount} sản phẩm`}
              valueColor={matchedCount > 0 ? 'text-emerald-600' : 'text-[#1A1A1A]'}
              footer={countedItems.length ? 'Không cần điều chỉnh' : 'Chưa có sản phẩm nào được đếm'}
              footerColor={matchedCount > 0 ? 'text-emerald-600' : 'text-[#9B9389]'}
            />
            <StatCard
              icon="alert" label="Chênh lệch" value={`${changedItems.length} sản phẩm`}
              valueColor={changedItems.length > 0 ? 'text-red-600' : 'text-[#1A1A1A]'}
              footer={changedItems.length > 0 ? `${surplusCount} thừa · ${deficitCount} thiếu` : 'Không có sai lệch'}
              footerColor={changedItems.length > 0 ? 'text-red-600' : 'text-emerald-600'}
            />
          </>
        )}
      </motion.div>

      {/* Cảnh báo chưa lưu */}
      <AnimatePresence>
        {changedItems.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="bg-amber-50 border border-amber-200/50 rounded-lg px-4 py-3 mb-5 flex items-center gap-2.5">
            <span className="text-amber-600 shrink-0"><Icon name="alert" className="w-4 h-4" /></span>
            <p className="text-[12px] font-semibold text-amber-800">
              {changedItems.length} sản phẩm có chênh lệch tồn kho — nhớ bấm "Hoàn tất kiểm kê" trước khi rời trang.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table card */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-white rounded-xl border border-[#EAE6DF] shadow-sm overflow-hidden">
        {/* Card header + toolbar */}
        <div className="px-5 py-4 border-b border-[#EAE6DF]">
          <div className="flex items-center justify-between mb-3">
            <p className="font-display text-[13px] font-bold uppercase tracking-wider text-[#1A1A1A]">Phiếu kiểm kê</p>
            {products.length > 0 && (
              <span className="bg-[#FAF8F5] text-[#615C56] border border-[#EAE6DF] px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                {products.length} sản phẩm
              </span>
            )}
          </div>
          <div className="relative max-w-sm">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9B9389]"><Icon name="search" className="w-4 h-4" /></span>
            <input type="text" value={search} onChange={handleSearch} placeholder="Tìm sách, tác giả…"
              className="w-full pl-9 pr-4 py-2 border border-[#EAE6DF] rounded-lg text-[12.5px] bg-white placeholder:text-[#D8D2CA] focus:outline-none focus:border-[#1A1A1A] transition-colors"/>
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="bg-[#FAF8F5] border-b border-[#EAE6DF]">
              {['Sản phẩm', 'Tồn hệ thống', 'Đếm thực tế', 'Chênh lệch', 'Lý do'].map((h, i) => (
                <th key={i} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#9B9389]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-t border-[#FAF8F5] animate-pulse">
                  {[180, 70, 90, 80, 120].map((w, j) => (
                    <td key={j} className="px-5 py-4"><div className="h-3.5 bg-[#F2EFEA] rounded" style={{ width: w }}/></td>
                  ))}
                </tr>
              ))
              : products.length === 0
                ? (
                  <tr><td colSpan={5} className="py-16 text-center">
                    <p className="text-[13px] font-semibold text-[#1A1A1A]">Không tìm thấy sản phẩm</p>
                    <p className="text-[11px] text-[#9B9389] mt-1">{search ? 'Thử từ khóa khác' : 'Kho trống'}</p>
                  </td></tr>
                )
                : products.map(p => {
                  const diff = getDiff(p)
                  const hasChange = diff !== null && diff !== 0
                  return (
                    <tr key={p._id}
                      className={`border-t border-[#FAF8F5] transition-colors ${
                        hasChange
                          ? diff < 0
                            ? 'bg-red-50/40 border-l-2 border-l-red-400'
                            : 'bg-sky-50/40 border-l-2 border-l-sky-400'
                          : 'hover:bg-[#FAF8F5]/50'
                      }`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {p.image
                            ? <img src={p.image} alt="" className="w-10 h-14 object-cover rounded-md shadow-sm shrink-0"/>
                            : <div className="w-10 h-14 bg-[#FAF8F5] rounded-md border border-[#EAE6DF] shrink-0"/>}
                          <div className="min-w-0">
                            <p className="text-[12.5px] font-semibold text-[#1A1A1A] line-clamp-1">{p.title}</p>
                            <p className="text-[10.5px] text-[#9B9389]">{p.author}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-display text-[14px] font-bold text-[#1A1A1A]">{p.stock}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <input
                          type="number" min="0" step="1"
                          value={counts[p._id]?.actual ?? ''}
                          onChange={e => setCount(p._id, 'actual', e.target.value)}
                          placeholder={String(p.stock)}
                          className="w-24 px-3 py-2 border border-[#EAE6DF] rounded-lg text-[13px] font-semibold bg-white placeholder:text-[#D8D2CA] placeholder:font-normal focus:outline-none focus:border-[#1A1A1A] transition-colors text-center"
                        />
                      </td>
                      <td className="px-5 py-3.5"><DiffBadge diff={diff} /></td>
                      <td className="px-5 py-3.5">
                        {hasChange ? (
                          <select value={counts[p._id]?.reason || ''} onChange={e => setCount(p._id, 'reason', e.target.value)}
                            className="px-3 py-2 border border-[#EAE6DF] rounded-lg text-[12px] text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] bg-white transition-colors">
                            <option value="">Chọn lý do…</option>
                            {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        ) : <span className="text-[12px] text-[#D8D2CA]">—</span>}
                      </td>
                    </tr>
                  )
                })
            }
          </tbody>
        </table>
      </motion.div>
    </WarehouseLayout>
  )
}
