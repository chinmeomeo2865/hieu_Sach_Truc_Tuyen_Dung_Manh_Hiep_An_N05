import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PMLayout from '../../components/pm/PMLayout'
import { api } from '../../services/api'
import { useToastStore } from '../../store/toastStore'
import { formatPrice } from '../../utils/format'

/* ─── Icons — đồng bộ với PMDashboard ───────────────────────── */
const ICON_PATHS = {
  book:   <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />,
  eye:    <><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>,
  alert:  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
  tag:    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />,
  search: <><circle cx="11" cy="11" r="8" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" /></>,
  plus:   <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />,
  close:  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />,
}
function Icon({ name, className = 'w-3.5 h-3.5' }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>{ICON_PATHS[name]}</svg>
}

function StatCard({ icon, label, value, accent = 'text-[#1A1A1A]' }) {
  return (
    <div className="bg-white rounded-lg border border-[#EAE6DF] p-3 flex items-center gap-3 shadow-sm">
      <div className="border border-[#EAE6DF] p-1.5 rounded-lg bg-[#FAF8F5] text-[#615C56] shrink-0"><Icon name={icon} className="w-4 h-4" /></div>
      <div className="min-w-0">
        <p className="text-[9.5px] font-bold tracking-wider text-[#615C56] uppercase truncate">{label}</p>
        <p className={`font-display text-[17px] font-bold leading-tight ${accent}`}>{value}</p>
      </div>
    </div>
  )
}

const BADGE_OPTS = [
  { value: '', label: 'Không có' },
  { value: 'new', label: 'Mới' },
  { value: 'best', label: 'Bán chạy' },
  { value: 'sale', label: 'Giảm giá' },
]
const BADGE_UI = {
  new:  'bg-sky-50 text-sky-700 border-sky-200/50',
  best: 'bg-amber-50 text-amber-700 border-amber-200/50',
  sale: 'bg-red-50 text-red-600 border-red-200/50',
}
const EMPTY = { title:'', author:'', price:'', originalPrice:'', category:'', categorySlug:'', description:'', image:'', stock:0, badge:'', featured:false, visible:true }

const FIELD_LABEL = 'block text-[10px] font-bold uppercase tracking-wider text-[#615C56] mb-1.5'

function ProductModal({ book, cats, onClose, onSaved }) {
  const showToast = useToastStore(s => s.show)
  const isEdit    = !!book
  const [form, setForm]     = useState(isEdit ? { title:book.title||'', author:book.author||'', price:book.price??'', originalPrice:book.originalPrice??'', category:book.category||'', categorySlug:book.categorySlug||'', description:book.description||'', image:book.image||'', stock:book.stock??0, badge:book.badge||'', featured:book.featured||false, visible:book.visible??true } : { ...EMPTY })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const set = f => e => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value
    setForm(p => ({ ...p, [f]: val }))
    if (errors[f]) setErrors(p => ({ ...p, [f]: '' }))
  }
  function setCat(e) {
    const cat = cats.find(c => c.slug === e.target.value)
    setForm(p => ({ ...p, category: cat?.name || '', categorySlug: cat?.slug || '' }))
  }
  function validate() {
    const e = {}
    if (!form.title.trim()) e.title = 'Tên sách là bắt buộc'
    if (!form.author.trim()) e.author = 'Tác giả là bắt buộc'
    if (form.price === '' || Number(form.price) < 0) e.price = 'Giá không hợp lệ'
    if (!form.categorySlug) e.category = 'Chọn thể loại'
    return e
  }
  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      const payload = { ...form, price: Number(form.price), originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined, stock: Number(form.stock), badge: form.badge || null }
      if (isEdit) await api.put(`/api/products/${book._id}`, payload)
      else        await api.post('/api/products', payload)
      showToast({ message: isEdit ? 'Đã cập nhật sách' : 'Đã thêm sách mới', type: 'success' })
      onSaved()
    } catch (e) { showToast({ message: e.message, type: 'error' }) }
    finally { setLoading(false) }
  }

  const Err  = ({ field }) => errors[field] ? <p className="mt-1 text-[11px] text-red-500 font-medium">{errors[field]}</p> : null
  const iCls = field => `w-full px-3.5 py-2.5 border rounded-lg text-[13px] bg-white focus:outline-none transition-colors ${errors[field] ? 'border-red-400 bg-red-50' : 'border-[#EAE6DF] focus:border-[#1A1A1A]'}`

  return (
    <>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]" onClick={onClose}/>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <motion.div initial={{ opacity:0, scale:0.96, y:12 }} animate={{ opacity:1, scale:1, y:0 }}
          exit={{ opacity:0, scale:0.96, y:12 }} transition={{ type:'spring', damping:28, stiffness:300 }}
          className="w-full max-w-2xl max-h-[92vh] bg-white rounded-xl border border-[#EAE6DF] shadow-2xl flex flex-col overflow-hidden pointer-events-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAE6DF] shrink-0">
            <p className="font-display text-[14px] font-bold text-[#1A1A1A]">{isEdit ? 'Chỉnh sửa sách' : 'Thêm sách mới'}</p>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#FAF8F5] text-[#9B9389] transition-colors"><Icon name="close" className="w-4 h-4" /></button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-4">
              {form.image && <img src={form.image} alt="" className="w-full h-40 object-contain bg-[#FAF8F5] rounded-lg border border-[#EAE6DF] mb-2"/>}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={FIELD_LABEL}>Tên sách *</label>
                  <input value={form.title} onChange={set('title')} placeholder="Nhập tên sách…" className={iCls('title')}/>
                  <Err field="title"/>
                </div>
                <div>
                  <label className={FIELD_LABEL}>Tác giả *</label>
                  <input value={form.author} onChange={set('author')} placeholder="Tên tác giả" className={iCls('author')}/>
                  <Err field="author"/>
                </div>
                <div>
                  <label className={FIELD_LABEL}>Thể loại *</label>
                  <select value={form.categorySlug} onChange={setCat} className={iCls('category')}>
                    <option value="">Chọn thể loại…</option>
                    {cats.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                  </select>
                  <Err field="category"/>
                </div>
                <div>
                  <label className={FIELD_LABEL}>Giá bán (₫) *</label>
                  <input type="number" min="0" value={form.price} onChange={set('price')} placeholder="85000" className={iCls('price')}/>
                  <Err field="price"/>
                </div>
                <div>
                  <label className={FIELD_LABEL}>Giá gốc (₫)</label>
                  <input type="number" min="0" value={form.originalPrice} onChange={set('originalPrice')} placeholder="100000 (nếu đang sale)" className={iCls('originalPrice')}/>
                </div>
                <div>
                  <label className={FIELD_LABEL}>Tồn kho</label>
                  <input type="number" min="0" value={form.stock} onChange={set('stock')} className={iCls('stock')}/>
                </div>
                <div>
                  <label className={FIELD_LABEL}>Badge</label>
                  <select value={form.badge} onChange={set('badge')} className={iCls('badge')}>
                    {BADGE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className={FIELD_LABEL}>URL ảnh bìa</label>
                  <input value={form.image} onChange={set('image')} placeholder="https://…" className={iCls('image')}/>
                </div>
                <div className="col-span-2">
                  <label className={FIELD_LABEL}>Mô tả</label>
                  <textarea value={form.description} onChange={set('description')} rows={3} placeholder="Giới thiệu về cuốn sách…"
                    className="w-full px-3.5 py-2.5 border border-[#EAE6DF] rounded-lg text-[13px] bg-white focus:outline-none focus:border-[#1A1A1A] resize-none transition-colors"/>
                </div>
                <div className="flex items-center gap-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.featured} onChange={set('featured')} className="w-3.5 h-3.5 accent-[#1A1A1A] rounded"/>
                    <span className="text-[12px] font-medium text-[#1A1A1A]">Nổi bật</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.visible} onChange={set('visible')} className="w-3.5 h-3.5 accent-[#1A1A1A] rounded"/>
                    <span className="text-[12px] font-medium text-[#1A1A1A]">Hiển thị</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#EAE6DF] shrink-0 flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-[#EAE6DF] rounded-lg text-[12px] font-semibold text-[#615C56] hover:border-[#9B9389] transition-colors">Hủy</button>
              <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-[#1A1A1A] text-white rounded-lg text-[12px] font-semibold hover:bg-[#333] disabled:opacity-50 transition-colors">
                {loading ? 'Đang lưu…' : isEdit ? 'Cập nhật' : 'Thêm sách'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </>
  )
}

export default function PMProductsPage() {
  const showToast = useToastStore(s => s.show)
  const [products,  setProducts]  = useState([])
  const [cats,      setCats]      = useState([])
  const [stats,     setStats]     = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [modal,     setModal]     = useState(null)
  const [delBook,   setDelBook]   = useState(null)
  const [search,    setSearch]    = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [page,      setPage]      = useState(1)
  const [pagination, setPagination] = useState({})
  const timerRef = useRef(null)

  const fetchProducts = useCallback(async (q = search) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 20 })
      if (q) params.set('search', q)
      if (catFilter) params.set('category', catFilter)
      const res = await api.get(`/api/products/admin/all?${params}`)
      setProducts(res.data); setPagination(res.pagination || {})
    } catch (e) { showToast({ message: e.message, type: 'error' }) }
    finally { setLoading(false) }
  }, [page, catFilter])

  const fetchStats = useCallback(() => { api.get('/api/pm/stats').then(r => setStats(r.data)).catch(() => {}) }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])
  useEffect(() => { fetchStats() }, [fetchStats])
  useEffect(() => { api.get('/api/pm/categories').then(r => setCats(r.data)).catch(() => {}) }, [])

  function handleSearch(e) {
    const val = e.target.value; setSearch(val)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => { setPage(1); fetchProducts(val) }, 350)
  }

  async function handleDelete(book) {
    try {
      await api.del(`/api/products/${book._id}`)
      showToast({ message: `Đã xóa "${book.title}"`, type: 'success' })
      setDelBook(null); fetchProducts(); fetchStats()
    } catch (e) { showToast({ message: e.message, type: 'error' }) }
  }

  function onSaved() { setModal(null); fetchProducts(); fetchStats() }

  return (
    <PMLayout title="Quản lý sách">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#EAE6DF] pb-3 mb-5">
        <div>
          <h2 className="font-display text-[14.5px] font-bold text-[#1A1A1A] uppercase tracking-wider">Quản lý sách</h2>
          <p className="text-[11px] text-[#9B9389] mt-0.5">Thêm, chỉnh sửa, cập nhật giá và tồn kho danh mục sách</p>
        </div>
        <button onClick={() => setModal('new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1A1A1A] text-white text-[12px] font-semibold rounded-lg hover:bg-[#333] transition-colors whitespace-nowrap shrink-0">
          <Icon name="plus" className="w-3.5 h-3.5" /> Thêm sách
        </button>
      </div>

      {/* Stat strip */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard icon="book"  label="Tổng đầu sách" value={stats?.total ?? '—'} />
        <StatCard icon="eye"   label="Đang hiển thị" value={stats?.visible ?? '—'} accent="text-emerald-600" />
        <StatCard icon="eye"   label="Đang ẩn"       value={stats?.hidden ?? '—'} accent="text-[#615C56]" />
        <StatCard icon="alert" label="Hết hàng"      value={stats?.outOfStock ?? '—'} accent={stats?.outOfStock > 0 ? 'text-red-600' : 'text-[#1A1A1A]'} />
      </motion.div>

      {/* Table card */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-white rounded-xl border border-[#EAE6DF] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#EAE6DF]">
          <div className="flex items-center justify-between mb-3">
            <p className="font-display text-[13px] font-bold uppercase tracking-wider text-[#1A1A1A]">Danh sách sách</p>
            {pagination.total > 0 && (
              <span className="bg-[#FAF8F5] text-[#615C56] border border-[#EAE6DF] px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">{pagination.total} sách</span>
            )}
          </div>
          <div className="flex gap-2.5 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9B9389]"><Icon name="search" className="w-4 h-4" /></span>
              <input value={search} onChange={handleSearch} placeholder="Tìm sách, tác giả…"
                className="w-full pl-9 pr-4 py-2 border border-[#EAE6DF] rounded-lg text-[12px] bg-white placeholder:text-[#D8D2CA] focus:outline-none focus:border-[#1A1A1A] transition-colors"/>
            </div>
            <select value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1) }}
              className="px-3 py-2 border border-[#EAE6DF] rounded-lg text-[12px] text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A1A1A] transition-colors">
              <option value="">Tất cả thể loại</option>
              {cats.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="bg-[#FAF8F5] border-b border-[#EAE6DF]">
              {['Sách','Thể loại','Giá bán','Tồn kho','Hiển thị','Thao tác'].map((h,i) => (
                <th key={i} className={`px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-[#9B9389] ${i===0?'pl-5':''} ${h==='Thao tác'?'text-right pr-5':''}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({length:10}).map((_,i) => (
                <tr key={i} className="border-t border-[#FAF8F5] animate-pulse">
                  {[170,90,80,60,70,90].map((w,j) => <td key={j} className={`px-3 py-3 ${j===0?'pl-5':''}`}><div className="h-3.5 bg-[#F2EFEA] rounded" style={{width:w}}/></td>)}
                </tr>
              ))
              : products.length === 0
                ? <tr><td colSpan={6} className="py-16 text-center"><p className="text-[13px] font-semibold text-[#1A1A1A]">Không tìm thấy sách</p><p className="text-[11px] text-[#9B9389] mt-1">{search ? 'Thử từ khóa khác' : 'Thêm sách đầu tiên'}</p></td></tr>
                : products.map(p => (
                  <tr key={p._id} className="border-t border-[#FAF8F5] hover:bg-[#FAF8F5]/50 transition-colors">
                    <td className="pl-5 pr-3 py-2.5">
                      <div className="flex items-center gap-3">
                        {p.image
                          ? <img src={p.image} alt="" className="w-8 h-11 object-cover rounded-md shadow-sm shrink-0"/>
                          : <div className="w-8 h-11 bg-[#FAF8F5] border border-[#EAE6DF] rounded-md shrink-0"/>}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-[12.5px] font-semibold text-[#1A1A1A] line-clamp-1 max-w-[180px]">{p.title}</p>
                            {p.badge && <span className={`shrink-0 text-[8.5px] font-bold px-1.5 py-px rounded border uppercase ${BADGE_UI[p.badge]||'bg-[#FAF8F5] text-[#9B9389] border-[#EAE6DF]'}`}>{p.badge}</span>}
                          </div>
                          <p className="text-[10.5px] text-[#9B9389]">{p.author}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-[11.5px] text-[#615C56]">{p.category}</td>
                    <td className="px-3 py-2.5">
                      <p className="font-display text-[12.5px] font-bold text-[#1A1A1A]">{formatPrice(p.price)}</p>
                      {p.originalPrice > p.price && <p className="text-[10px] text-[#9B9389] line-through">{formatPrice(p.originalPrice)}</p>}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`font-display text-[13px] font-bold ${p.stock === 0 ? 'text-red-600' : p.stock <= 10 ? 'text-amber-600' : 'text-[#1A1A1A]'}`}>{p.stock}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wide border ${p.visible ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' : 'bg-[#FAF8F5] text-[#9B9389] border-[#EAE6DF]'}`}>
                        {p.visible ? 'Đang hiện' : 'Đang ẩn'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 pr-5">
                      <div className="flex gap-1.5 justify-end">
                        <button onClick={() => setModal(p)}
                          className="px-2.5 py-1.5 text-[10.5px] font-semibold border border-[#EAE6DF] text-[#1A1A1A] rounded-lg hover:border-[#1A1A1A] transition-colors">Sửa</button>
                        <button onClick={() => setDelBook(p)}
                          className="px-2.5 py-1.5 text-[10.5px] font-semibold border border-red-200 text-red-600 rounded-lg hover:bg-red-600 hover:border-red-600 hover:text-white transition-colors">Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#EAE6DF] bg-[#FAF8F5]/50">
            <p className="text-[11px] text-[#9B9389] font-medium">{pagination.total} sách · Trang {pagination.page}/{pagination.totalPages}</p>
            <div className="flex gap-1.5">
              <button disabled={page<=1} onClick={() => setPage(p=>p-1)} className="px-3 py-1.5 text-[11px] font-semibold border border-[#EAE6DF] bg-white rounded-lg disabled:opacity-40 hover:border-[#1A1A1A] transition-colors">← Trước</button>
              <button disabled={page>=pagination.totalPages} onClick={() => setPage(p=>p+1)} className="px-3 py-1.5 text-[11px] font-semibold border border-[#EAE6DF] bg-white rounded-lg disabled:opacity-40 hover:border-[#1A1A1A] transition-colors">Tiếp →</button>
            </div>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {modal && <ProductModal book={modal==='new'?null:modal} cats={cats} onClose={() => setModal(null)} onSaved={onSaved}/>}
        {delBook && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]" onClick={() => setDelBook(null)}/>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div initial={{opacity:0,scale:0.96,y:12}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.96,y:12}} transition={{ type:'spring', damping:28, stiffness:300 }}
                className="bg-white rounded-xl border border-[#EAE6DF] shadow-2xl w-full max-w-sm pointer-events-auto p-6 text-center">
                <p className="font-display text-[15px] font-bold text-[#1A1A1A] mb-1">Xóa sách?</p>
                <p className="text-[12px] text-[#615C56] mb-4">"{delBook.title}" sẽ bị ẩn khỏi hệ thống.</p>
                <div className="flex gap-3">
                  <button onClick={() => setDelBook(null)} className="flex-1 py-2.5 border border-[#EAE6DF] rounded-lg text-[12px] font-semibold text-[#615C56] hover:border-[#9B9389] transition-colors">Hủy</button>
                  <button onClick={() => handleDelete(delBook)} className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-[12px] font-semibold hover:bg-red-700 transition-colors">Xóa</button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </PMLayout>
  )
}
