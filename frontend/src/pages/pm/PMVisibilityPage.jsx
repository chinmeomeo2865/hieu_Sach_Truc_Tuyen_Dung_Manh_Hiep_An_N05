import { useEffect, useState, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import PMLayout from '../../components/pm/PMLayout'
import { api } from '../../services/api'
import { useToastStore } from '../../store/toastStore'
import { formatPrice } from '../../utils/format'

/* ─── Icons ─────────────────────────────────────────────────── */
const ICON_PATHS = {
  layers: <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />,
  eye:    <><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>,
  eyeoff: <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />,
  alert:  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
  search: <><circle cx="11" cy="11" r="8" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" /></>,
}
function Icon({ name, className = 'w-3.5 h-3.5' }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>{ICON_PATHS[name]}</svg>
}

function StatCard({ icon, label, value, accent = 'text-[#1A1A1A]', active, onClick }) {
  return (
    <button onClick={onClick}
      className={`bg-white rounded-lg border p-3 flex items-center gap-3 text-left transition-all ${active ? 'border-[#1A1A1A] shadow-sm' : 'border-[#EAE6DF] hover:border-[#D8D2CA] hover:shadow-sm'}`}>
      <div className={`border p-1.5 rounded-lg shrink-0 ${active ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white' : 'border-[#EAE6DF] bg-[#FAF8F5] text-[#615C56]'}`}><Icon name={icon} className="w-4 h-4" /></div>
      <div className="min-w-0">
        <p className="text-[9.5px] font-bold tracking-wider text-[#615C56] uppercase truncate">{label}</p>
        <p className={`font-display text-[17px] font-bold leading-tight ${accent}`}>{value}</p>
      </div>
    </button>
  )
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <button type="button" onClick={() => !disabled && onChange(!checked)} disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${checked ? 'bg-emerald-600' : 'bg-[#D8D2CA]'} ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
      <motion.span animate={{ x: checked ? 20 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="inline-block h-5 w-5 rounded-full bg-white shadow-sm"/>
    </button>
  )
}

const TABS = [
  { value: '',        label: 'Tất cả' },
  { value: 'visible', label: 'Đang hiện' },
  { value: 'hidden',  label: 'Đang ẩn' },
  { value: 'out',     label: 'Hết hàng' },
]

export default function PMVisibilityPage() {
  const showToast = useToastStore(s => s.show)
  const [searchParams, setSearchParams] = useSearchParams()
  const [products,  setProducts]  = useState([])
  const [stats,     setStats]     = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [toggling,  setToggling]  = useState({})
  const [search,    setSearch]    = useState('')
  const [page,      setPage]      = useState(1)
  const [pagination, setPagination] = useState({})
  const timerRef = useRef(null)

  const activeFilter = searchParams.get('filter') || ''

  const fetchProducts = useCallback(async (q = search) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 30 })
      if (q) params.set('search', q)
      const res = await api.get(`/api/products/admin/all?${params}`)
      let data = res.data
      if (activeFilter === 'visible') data = data.filter(p => p.visible)
      if (activeFilter === 'hidden')  data = data.filter(p => !p.visible)
      if (activeFilter === 'out')     data = data.filter(p => p.stock === 0)
      setProducts(data)
      setPagination(res.pagination || {})
    } catch (e) { showToast({ message: e.message, type: 'error' }) }
    finally { setLoading(false) }
  }, [page, activeFilter])

  const fetchStats = useCallback(() => { api.get('/api/pm/stats').then(r => setStats(r.data)).catch(() => {}) }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])
  useEffect(() => { fetchStats() }, [fetchStats])
  useEffect(() => { setPage(1) }, [activeFilter])

  function handleSearch(e) {
    const val = e.target.value; setSearch(val)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => { setPage(1); fetchProducts(val) }, 350)
  }

  function setFilter(v) { setSearchParams(v ? { filter: v } : {}) }

  async function handleToggle(product) {
    setToggling(prev => ({ ...prev, [product._id]: true }))
    try {
      await api.post('/api/pm/visibility', { productId: product._id, visible: !product.visible })
      setProducts(prev => prev.map(p => p._id === product._id ? { ...p, visible: !p.visible } : p))
      showToast({ message: !product.visible ? `Đã hiển thị "${product.title}"` : `Đã ẩn "${product.title}"`, type: 'success' })
      fetchStats()
    } catch (e) { showToast({ message: e.message, type: 'error' }) }
    finally { setToggling(prev => ({ ...prev, [product._id]: false })) }
  }

  return (
    <PMLayout title="Quản lý hiển thị">
      {/* Header */}
      <div className="border-b border-[#EAE6DF] pb-3 mb-5">
        <h2 className="font-display text-[14.5px] font-bold text-[#1A1A1A] uppercase tracking-wider">Quản lý hiển thị</h2>
        <p className="text-[11px] text-[#9B9389] mt-0.5">Bật/tắt hiển thị sách trên cửa hàng và xử lý sách hết hàng</p>
      </div>

      {/* Stat strip — clickable filter */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard icon="layers" label="Tổng sách"  value={stats?.total ?? '—'}   active={activeFilter === ''} onClick={() => setFilter('')} />
        <StatCard icon="eye"    label="Đang hiện"  value={stats?.visible ?? '—'} accent="text-emerald-600" active={activeFilter === 'visible'} onClick={() => setFilter('visible')} />
        <StatCard icon="eyeoff" label="Đang ẩn"    value={stats?.hidden ?? '—'}  accent={stats?.hidden > 0 ? 'text-[#615C56]' : 'text-[#1A1A1A]'} active={activeFilter === 'hidden'} onClick={() => setFilter('hidden')} />
        <StatCard icon="alert"  label="Hết hàng"   value={stats?.outOfStock ?? '—'} accent={stats?.outOfStock > 0 ? 'text-red-600' : 'text-[#1A1A1A]'} active={activeFilter === 'out'} onClick={() => setFilter('out')} />
      </motion.div>

      {/* Table card */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-white rounded-xl border border-[#EAE6DF] shadow-sm overflow-hidden">
        <div className="px-5 pt-3 border-b border-[#EAE6DF] flex items-end justify-between gap-3 flex-wrap">
          <div className="flex gap-0.5 -mb-px overflow-x-auto">
            {TABS.map(t => {
              const active = activeFilter === t.value
              return (
                <button key={t.value} onClick={() => setFilter(t.value)}
                  className={`px-3.5 py-2.5 text-[12px] font-semibold border-b-2 transition-colors whitespace-nowrap
                    ${active ? 'border-[#1A1A1A] text-[#1A1A1A]' : 'border-transparent text-[#9B9389] hover:text-[#1A1A1A]'}`}>
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>
        <div className="px-5 py-3 border-b border-[#EAE6DF] bg-[#FAF8F5]/40">
          <div className="relative max-w-sm">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9B9389]"><Icon name="search" className="w-4 h-4" /></span>
            <input value={search} onChange={handleSearch} placeholder="Tìm sách, tác giả…"
              className="w-full pl-9 pr-4 py-2 border border-[#EAE6DF] rounded-lg text-[12px] bg-white placeholder:text-[#D8D2CA] focus:outline-none focus:border-[#1A1A1A] transition-colors"/>
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="bg-[#FAF8F5] border-b border-[#EAE6DF]">
              {['Sản phẩm','Thể loại','Giá bán','Tồn kho','Hiển thị'].map((h,i) => (
                <th key={i} className={`px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[#9B9389] ${i===0?'pl-5':''}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({length:10}).map((_,i) => (
                <tr key={i} className="border-t border-[#FAF8F5] animate-pulse">
                  {[170,100,80,70,90].map((w,j) => <td key={j} className={`px-3 py-3 ${j===0?'pl-5':''}`}><div className="h-3.5 bg-[#F2EFEA] rounded" style={{width:w}}/></td>)}
                </tr>
              ))
              : products.length === 0
                ? <tr><td colSpan={5} className="py-16 text-center"><p className="text-[13px] font-semibold text-[#1A1A1A]">Không có sản phẩm</p><p className="text-[11px] text-[#9B9389] mt-1">Thử đổi bộ lọc hoặc từ khóa</p></td></tr>
                : products.map(p => (
                  <tr key={p._id} className={`border-t border-[#FAF8F5] transition-colors ${!p.visible ? 'bg-[#FAF8F5]/60' : 'hover:bg-[#FAF8F5]/50'}`}>
                    <td className="pl-5 pr-3 py-2.5">
                      <div className={`flex items-center gap-3 ${!p.visible ? 'opacity-60' : ''}`}>
                        {p.image
                          ? <img src={p.image} alt="" className="w-8 h-11 object-cover rounded-md shadow-sm shrink-0"/>
                          : <div className="w-8 h-11 bg-[#FAF8F5] border border-[#EAE6DF] rounded-md shrink-0"/>}
                        <div className="min-w-0">
                          <p className="text-[12.5px] font-semibold text-[#1A1A1A] line-clamp-1">{p.title}</p>
                          <p className="text-[10.5px] text-[#9B9389]">{p.author}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-[11.5px] text-[#615C56]">{p.category}</td>
                    <td className="px-3 py-2.5 font-display text-[12.5px] font-bold text-[#1A1A1A]">{formatPrice(p.price)}</td>
                    <td className="px-3 py-2.5">
                      {p.stock === 0
                        ? <span className="px-2 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wide border bg-red-50 text-red-600 border-red-200/50">Hết hàng</span>
                        : <span className={`font-display text-[13px] font-bold ${p.stock <= 10 ? 'text-amber-600' : 'text-[#1A1A1A]'}`}>{p.stock}</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <Toggle checked={p.visible} onChange={() => handleToggle(p)} disabled={toggling[p._id]}/>
                        <span className={`text-[10px] font-bold uppercase tracking-wide ${p.visible ? 'text-emerald-600' : 'text-[#9B9389]'}`}>{p.visible ? 'Hiện' : 'Ẩn'}</span>
                        {p.stock === 0 && p.visible && (
                          <span className="text-[9px] text-amber-600 font-bold uppercase ml-1">⚠ Nên ẩn</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </motion.div>
    </PMLayout>
  )
}
