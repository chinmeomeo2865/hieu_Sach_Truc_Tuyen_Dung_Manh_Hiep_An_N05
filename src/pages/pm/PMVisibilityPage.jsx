import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import PMLayout from '../../components/pm/PMLayout'
import { api } from '../../services/api'
import { useToastStore } from '../../store/toastStore'
import { formatPrice } from '../../utils/format'

function Toggle({ checked, onChange, disabled }) {
  return (
    <button type="button" onClick={() => !disabled && onChange(!checked)} disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${checked ? 'bg-emerald-500' : 'bg-[#d4d4d4]'} ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
      <motion.span animate={{ x: checked ? 20 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="inline-block h-5 w-5 rounded-full bg-white shadow-sm"/>
    </button>
  )
}

const FILTERS = [
  { value: '', label: 'Tất cả' },
  { value: 'visible', label: 'Đang hiện' },
  { value: 'hidden', label: 'Đang ẩn' },
  { value: 'out', label: 'Hết hàng' },
]

export default function PMVisibilityPage() {
  const showToast = useToastStore(s => s.show)
  const [searchParams, setSearchParams] = useSearchParams()
  const [products,  setProducts]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [toggling,  setToggling]  = useState({})
  const [search,    setSearch]    = useState('')
  const [page,      setPage]      = useState(1)
  const [pagination, setPagination] = useState({})
  const timerRef = useRef(null)

  const activeFilter = searchParams.get('filter') || ''

  async function fetchProducts(q = search) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 30 })
      if (q) params.set('search', q)
      // use admin products endpoint (returns all including hidden)
      const res = await api.get(`/api/products/admin/all?${params}`)
      let data = res.data
      if (activeFilter === 'visible') data = data.filter(p => p.visible)
      if (activeFilter === 'hidden')  data = data.filter(p => !p.visible)
      if (activeFilter === 'out')     data = data.filter(p => p.stock === 0)
      setProducts(data)
      setPagination(res.pagination || {})
    } catch (e) { showToast({ message: e.message, type: 'error' }) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchProducts() }, [page, activeFilter])

  function handleSearch(e) {
    const val = e.target.value; setSearch(val)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => { setPage(1); fetchProducts(val) }, 350)
  }

  async function handleToggle(product) {
    setToggling(prev => ({ ...prev, [product._id]: true }))
    try {
      await api.post('/api/pm/visibility', { productId: product._id, visible: !product.visible })
      setProducts(prev => prev.map(p => p._id === product._id ? { ...p, visible: !p.visible } : p))
      showToast({ message: !product.visible ? `Đã hiển thị "${product.title}"` : `Đã ẩn "${product.title}"`, type: 'success' })
    } catch (e) { showToast({ message: e.message, type: 'error' }) }
    finally { setToggling(prev => ({ ...prev, [product._id]: false })) }
  }

  return (
    <PMLayout title="Quản lý hiển thị">
      <div className="space-y-4">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a3a3a3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35"/></svg>
            <input value={search} onChange={handleSearch} placeholder="Tìm sách…"
              className="w-full pl-9 pr-4 py-2.5 border border-[#e5e5e5] rounded-xl text-[13px] bg-white placeholder:text-[#c4c4c4] focus:outline-none focus:border-[#0f0f0f] transition-colors"/>
          </div>
          <div className="flex gap-1 bg-white border border-[#e5e5e5] rounded-xl p-1">
            {FILTERS.map(f => (
              <button key={f.value} onClick={() => setSearchParams(f.value ? {filter:f.value} : {})}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors ${activeFilter===f.value ? 'bg-[#0f0f0f] text-white' : 'text-[#737373] hover:text-[#0f0f0f]'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#ebebeb] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#f0f0f0]">
                {['Sản phẩm','Thể loại','Giá','Tồn kho','Hiển thị'].map((h,i) => (
                  <th key={i} className="px-4 py-3 text-left text-[10.5px] font-bold uppercase tracking-wider text-[#a3a3a3]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({length:10}).map((_,i) => (
                  <tr key={i} className="border-t border-[#f5f5f4] animate-pulse">
                    {[160,100,80,80,60].map((w,j) => <td key={j} className="px-4 py-3.5"><div className="h-3.5 bg-[#f0f0f0] rounded-full" style={{width:w}}/></td>)}
                  </tr>
                ))
                : products.length === 0
                  ? <tr><td colSpan={5} className="py-14 text-center text-[13px] text-[#a3a3a3]">Không có sản phẩm nào</td></tr>
                  : products.map(p => (
                    <tr key={p._id} className={`border-t border-[#f5f5f4] transition-colors ${!p.visible ? 'bg-[#fafafa] opacity-70' : 'hover:bg-[#fafafa]'}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {p.image && <img src={p.image} alt="" className="w-9 h-12 object-cover rounded-lg bg-[#f0f0f0] shrink-0"/>}
                          <div>
                            <p className="text-[12.5px] font-semibold text-[#0f0f0f] line-clamp-1">{p.title}</p>
                            <p className="text-[10px] text-[#a3a3a3]">{p.author}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-[#737373]">{p.category}</td>
                      <td className="px-4 py-3 text-[12px] font-semibold text-[#0f0f0f]">{formatPrice(p.price)}</td>
                      <td className="px-4 py-3">
                        {p.stock === 0
                          ? <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-500 text-[10px] font-bold border border-red-200">Hết hàng</span>
                          : <span className="text-[12px] font-semibold text-[#0f0f0f]">{p.stock}</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Toggle checked={p.visible} onChange={() => handleToggle(p)} disabled={toggling[p._id]}/>
                          <span className={`text-[10px] font-semibold ${p.visible ? 'text-emerald-600' : 'text-[#a3a3a3]'}`}>
                            {p.visible ? 'Hiện' : 'Ẩn'}
                          </span>
                        </div>
                        {p.stock === 0 && p.visible && (
                          <p className="text-[9px] text-amber-600 mt-0.5 font-medium">⚠ Nên ẩn</p>
                        )}
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </PMLayout>
  )
}
