import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PMLayout from '../../components/pm/PMLayout'
import { api } from '../../services/api'
import { useToastStore } from '../../store/toastStore'
import { formatPrice } from '../../utils/format'

const BADGE_OPTS = [
  { value: '', label: 'Không có' },
  { value: 'new', label: '🆕 Mới' },
  { value: 'best', label: '🏆 Bán chạy' },
  { value: 'sale', label: '🔖 Giảm giá' },
]

const EMPTY = { title:'', author:'', price:'', originalPrice:'', category:'', categorySlug:'', description:'', image:'', stock:0, badge:'', featured:false, visible:true }

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

  const Err  = ({ field }) => errors[field] ? <p className="mt-1 text-[11px] text-red-500">{errors[field]}</p> : null
  const Lbl  = ({ children }) => <label className="block text-[10.5px] font-bold uppercase tracking-wider text-[#737373] mb-1.5">{children}</label>
  const iCls = field => `w-full px-3.5 py-2.5 border rounded-xl text-[13px] focus:outline-none transition-colors ${errors[field] ? 'border-red-400 bg-red-50' : 'border-[#e5e5e5] focus:border-[#0f0f0f]'}`

  return (
    <>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" onClick={onClose}/>
      <motion.div initial={{ opacity:0, x:'100%' }} animate={{ opacity:1, x:0 }}
        exit={{ opacity:0, x:'100%' }} transition={{ type:'spring', damping:28, stiffness:300 }}
        className="fixed right-0 top-0 h-full w-[580px] bg-white z-50 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f0f0] shrink-0">
          <p className="text-[14px] font-semibold">{isEdit ? 'Chỉnh sửa sách' : 'Thêm sách mới'}</p>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f5f5f4] text-[#a3a3a3] transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            {form.image && <img src={form.image} alt="" className="w-full h-40 object-contain bg-[#f5f5f3] rounded-xl mb-2"/>}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Lbl>Tên sách *</Lbl>
                <input value={form.title} onChange={set('title')} placeholder="Nhập tên sách…" className={iCls('title')}/>
                <Err field="title"/>
              </div>
              <div>
                <Lbl>Tác giả *</Lbl>
                <input value={form.author} onChange={set('author')} placeholder="Tên tác giả" className={iCls('author')}/>
                <Err field="author"/>
              </div>
              <div>
                <Lbl>Thể loại *</Lbl>
                <select value={form.categorySlug} onChange={setCat} className={iCls('category')}>
                  <option value="">Chọn thể loại…</option>
                  {cats.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
                <Err field="category"/>
              </div>
              <div>
                <Lbl>Giá bán (₫) *</Lbl>
                <input type="number" min="0" value={form.price} onChange={set('price')} placeholder="85000" className={iCls('price')}/>
                <Err field="price"/>
              </div>
              <div>
                <Lbl>Giá gốc (₫)</Lbl>
                <input type="number" min="0" value={form.originalPrice} onChange={set('originalPrice')} placeholder="100000 (nếu đang sale)" className={iCls('originalPrice')}/>
              </div>
              <div>
                <Lbl>Tồn kho</Lbl>
                <input type="number" min="0" value={form.stock} onChange={set('stock')} className={iCls('stock')}/>
              </div>
              <div>
                <Lbl>Badge</Lbl>
                <select value={form.badge} onChange={set('badge')} className={iCls('badge')}>
                  {BADGE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <Lbl>URL ảnh bìa</Lbl>
                <input value={form.image} onChange={set('image')} placeholder="https://…" className={iCls('image')}/>
              </div>
              <div className="col-span-2">
                <Lbl>Mô tả</Lbl>
                <textarea value={form.description} onChange={set('description')} rows={3} placeholder="Giới thiệu về cuốn sách…"
                  className="w-full px-3.5 py-2.5 border border-[#e5e5e5] rounded-xl text-[13px] focus:outline-none focus:border-[#0f0f0f] resize-none transition-colors"/>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.featured} onChange={set('featured')} className="rounded"/>
                  <span className="text-[12px] font-medium text-[#0f0f0f]">Nổi bật</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.visible} onChange={set('visible')} className="rounded"/>
                  <span className="text-[12px] font-medium text-[#0f0f0f]">Hiển thị</span>
                </label>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-[#f0f0f0] shrink-0 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-[#e5e5e5] rounded-xl text-[13px] font-semibold text-[#525252] hover:border-[#a3a3a3] transition-colors">Hủy</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-[#0f0f0f] text-white rounded-xl text-[13px] font-semibold hover:bg-[#333] disabled:opacity-50 transition-colors">
              {loading ? 'Đang lưu…' : isEdit ? 'Cập nhật' : 'Thêm sách'}
            </button>
          </div>
        </form>
      </motion.div>
    </>
  )
}

const BADGE_UI = { new:'bg-blue-50 text-blue-700', best:'bg-amber-50 text-amber-700', sale:'bg-red-50 text-red-600' }

export default function PMProductsPage() {
  const showToast = useToastStore(s => s.show)
  const [products,  setProducts]  = useState([])
  const [cats,      setCats]      = useState([])
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

  useEffect(() => { fetchProducts() }, [fetchProducts])
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
      setDelBook(null); fetchProducts()
    } catch (e) { showToast({ message: e.message, type: 'error' }) }
  }

  return (
    <PMLayout title="Quản lý sách">
      <div className="space-y-4">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a3a3a3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35"/></svg>
            <input value={search} onChange={handleSearch} placeholder="Tìm sách, tác giả…"
              className="w-full pl-9 pr-4 py-2.5 border border-[#e5e5e5] rounded-xl text-[13px] bg-white placeholder:text-[#c4c4c4] focus:outline-none focus:border-[#0f0f0f] transition-colors"/>
          </div>
          <select value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1) }}
            className="px-3.5 py-2.5 border border-[#e5e5e5] rounded-xl text-[13px] bg-white focus:outline-none focus:border-[#0f0f0f] transition-colors">
            <option value="">Tất cả thể loại</option>
            {cats.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
          <button onClick={() => setModal('new')}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0f0f0f] text-white text-[12px] font-semibold rounded-xl hover:bg-[#333] transition-colors whitespace-nowrap">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            Thêm sách
          </button>
        </div>

        <div className="bg-white border border-[#ebebeb] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#f0f0f0]">
                {['Sách','Tác giả','Thể loại','Giá','Kho','Trạng thái',''].map((h,i) => (
                  <th key={i} className="px-4 py-3 text-left text-[10.5px] font-bold uppercase tracking-wider text-[#a3a3a3]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({length:8}).map((_,i) => (
                  <tr key={i} className="border-t border-[#f5f5f4] animate-pulse">
                    {[160,100,80,70,50,70,60].map((w,j) => <td key={j} className="px-4 py-3.5"><div className="h-3.5 bg-[#f0f0f0] rounded-full" style={{width:w}}/></td>)}
                  </tr>
                ))
                : products.length === 0
                  ? <tr><td colSpan={7} className="py-16 text-center"><p className="text-[13px] font-semibold text-[#0f0f0f]">Không tìm thấy sách</p></td></tr>
                  : products.map(p => (
                    <tr key={p._id} className="border-t border-[#f5f5f4] hover:bg-[#fafafa] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {p.image && <img src={p.image} alt="" className="w-9 h-12 object-cover rounded-lg bg-[#f0f0f0] shrink-0"/>}
                          <div>
                            <p className="text-[12.5px] font-semibold text-[#0f0f0f] line-clamp-1 max-w-[180px]">{p.title}</p>
                            {p.badge && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${BADGE_UI[p.badge]||'bg-gray-100 text-gray-600'}`}>{p.badge.toUpperCase()}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-[#737373]">{p.author}</td>
                      <td className="px-4 py-3 text-[11px] text-[#737373]">{p.category}</td>
                      <td className="px-4 py-3">
                        <p className="text-[12px] font-bold text-[#0f0f0f]">{formatPrice(p.price)}</p>
                        {p.originalPrice && <p className="text-[10px] text-[#a3a3a3] line-through">{formatPrice(p.originalPrice)}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-bold ${p.stock === 0 ? 'text-red-500' : p.stock <= 10 ? 'text-amber-600' : 'text-[#0f0f0f]'}`}>{p.stock}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${p.visible ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                          {p.visible ? 'Hiện' : 'Ẩn'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <button onClick={() => setModal(p)}
                            className="px-2.5 py-1.5 text-[10px] font-semibold border border-[#e5e5e5] rounded-lg hover:border-[#0f0f0f] transition-colors">Sửa</button>
                          <button onClick={() => setDelBook(p)}
                            className="px-2.5 py-1.5 text-[10px] font-semibold border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors">Xóa</button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#f0f0f0]">
              <p className="text-[11px] text-[#a3a3a3]">Trang {pagination.page}/{pagination.totalPages} · {pagination.total} sách</p>
              <div className="flex gap-1.5">
                <button disabled={page<=1} onClick={() => setPage(p=>p-1)} className="px-3 py-1.5 text-[11px] border border-[#e5e5e5] rounded-lg disabled:opacity-40 hover:border-[#0f0f0f] transition-colors">← Trước</button>
                <button disabled={page>=pagination.totalPages} onClick={() => setPage(p=>p+1)} className="px-3 py-1.5 text-[11px] border border-[#e5e5e5] rounded-lg disabled:opacity-40 hover:border-[#0f0f0f] transition-colors">Tiếp →</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {modal && <ProductModal book={modal==='new'?null:modal} cats={cats} onClose={() => setModal(null)} onSaved={() => { setModal(null); fetchProducts() }}/>}
        {delBook && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 bg-black/30" onClick={() => setDelBook(null)}/>
            <motion.div initial={{opacity:0,scale:0.96,y:8}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.96,y:8}} className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm pointer-events-auto p-6 text-center">
                <p className="text-[15px] font-semibold mb-1">Xóa sách?</p>
                <p className="text-[12px] text-[#737373] mb-4">"{delBook.title}" sẽ bị ẩn khỏi hệ thống.</p>
                <div className="flex gap-3">
                  <button onClick={() => setDelBook(null)} className="flex-1 py-2.5 border border-[#e5e5e5] rounded-xl text-[13px] font-semibold hover:border-[#a3a3a3] transition-colors">Hủy</button>
                  <button onClick={() => handleDelete(delBook)} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-[13px] font-semibold hover:bg-red-600 transition-colors">Xóa</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </PMLayout>
  )
}
