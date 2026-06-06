import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PMLayout from '../../components/pm/PMLayout'
import { api } from '../../services/api'
import { useToastStore } from '../../store/toastStore'

function slugify(str = '') {
  return str.toLowerCase().replace(/[đĐ]/g,'d').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
}

function CategoryModal({ cat, onClose, onSaved }) {
  const showToast = useToastStore(s => s.show)
  const isEdit    = !!cat
  const [form, setForm]     = useState({ name: cat?.name || '', description: cat?.description || '', image: cat?.image || '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Tên danh mục là bắt buộc'); return }
    setError(''); setLoading(true)
    try {
      if (isEdit) await api.put(`/api/pm/categories/${cat._id}`, form)
      else        await api.post('/api/pm/categories', form)
      showToast({ message: isEdit ? 'Đã cập nhật danh mục' : 'Đã thêm danh mục', type: 'success' })
      onSaved()
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]" onClick={onClose}/>
      <motion.div initial={{ opacity:0, scale:0.96, y:8 }} animate={{ opacity:1, scale:1, y:0 }}
        exit={{ opacity:0, scale:0.96, y:8 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md pointer-events-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f0f0]">
            <p className="text-[14px] font-semibold">{isEdit ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}</p>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f5f5f4] text-[#a3a3a3] transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-wider text-[#737373] mb-1.5">Tên danh mục *</label>
              <input value={form.name} onChange={set('name')} placeholder="Văn học, Kỹ năng…"
                className={`w-full px-3.5 py-2.5 border rounded-xl text-[13px] focus:outline-none transition-colors ${error ? 'border-red-400 bg-red-50' : 'border-[#e5e5e5] focus:border-[#0f0f0f]'}`}/>
              {error && <p className="mt-1 text-[11px] text-red-500 font-medium">{error}</p>}
              {form.name && <p className="mt-1 text-[10px] text-[#a3a3a3]">Slug: <code className="bg-[#f5f5f3] px-1 py-0.5 rounded">{slugify(form.name)}</code></p>}
            </div>
            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-wider text-[#737373] mb-1.5">Mô tả</label>
              <textarea value={form.description} onChange={set('description')} rows={2} placeholder="Mô tả ngắn về danh mục…"
                className="w-full px-3.5 py-2.5 border border-[#e5e5e5] rounded-xl text-[13px] focus:outline-none focus:border-[#0f0f0f] transition-colors resize-none"/>
            </div>
            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-wider text-[#737373] mb-1.5">URL ảnh (tùy chọn)</label>
              <input value={form.image} onChange={set('image')} placeholder="https://…"
                className="w-full px-3.5 py-2.5 border border-[#e5e5e5] rounded-xl text-[13px] focus:outline-none focus:border-[#0f0f0f] transition-colors"/>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-[#e5e5e5] rounded-xl text-[13px] font-semibold text-[#525252] hover:border-[#a3a3a3] transition-colors">Hủy</button>
              <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-[#0f0f0f] text-white rounded-xl text-[13px] font-semibold hover:bg-[#333] disabled:opacity-50 transition-colors">
                {loading ? 'Đang lưu…' : isEdit ? 'Cập nhật' : 'Thêm danh mục'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  )
}

function ConfirmDelete({ cat, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false)
  return (
    <>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]" onClick={onClose}/>
      <motion.div initial={{ opacity:0, scale:0.96, y:8 }} animate={{ opacity:1, scale:1, y:0 }}
        exit={{ opacity:0, scale:0.96, y:8 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm pointer-events-auto p-6 text-center">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </div>
          <p className="text-[15px] font-semibold text-[#0f0f0f] mb-1">Xóa "{cat.name}"?</p>
          {cat.productCount > 0
            ? <p className="text-[12px] text-red-500 mb-4">Danh mục còn <strong>{cat.productCount}</strong> sản phẩm. Cần chuyển sang danh mục khác trước.</p>
            : <p className="text-[12px] text-[#737373] mb-4">Hành động này không thể hoàn tác.</p>
          }
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-[#e5e5e5] rounded-xl text-[13px] font-semibold hover:border-[#a3a3a3] transition-colors">Hủy</button>
            {cat.productCount === 0 && (
              <button disabled={loading} onClick={async () => { setLoading(true); await onConfirm(); setLoading(false) }}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-[13px] font-semibold hover:bg-red-600 disabled:opacity-50 transition-colors">
                {loading ? 'Đang xóa…' : 'Xóa'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </>
  )
}

export default function PMCategoriesPage() {
  const showToast = useToastStore(s => s.show)
  const [cats,    setCats]    = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(null) // null | 'new' | cat object
  const [delCat,  setDelCat]  = useState(null)

  async function fetchCats() {
    setLoading(true)
    try { const r = await api.get('/api/pm/categories'); setCats(r.data) }
    catch (e) { showToast({ message: e.message, type: 'error' }) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchCats() }, [])

  async function handleDelete(cat) {
    try {
      await api.del(`/api/pm/categories/${cat._id}`)
      showToast({ message: `Đã xóa "${cat.name}"`, type: 'success' })
      setDelCat(null); fetchCats()
    } catch (e) { showToast({ message: e.message, type: 'error' }) }
  }

  return (
    <PMLayout title="Quản lý danh mục">
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-[#737373]">{cats.length} danh mục</p>
          <button onClick={() => setModal('new')}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0f0f0f] text-white text-[12px] font-semibold rounded-xl hover:bg-[#333] transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            Thêm danh mục
          </button>
        </div>

        <div className="bg-white border border-[#ebebeb] rounded-xl overflow-hidden">
          {loading ? (
            <div className="divide-y divide-[#f5f5f4]">
              {Array.from({length:6}).map((_,i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                  <div className="w-10 h-10 bg-[#f0f0f0] rounded-xl shrink-0"/>
                  <div className="flex-1 space-y-2"><div className="h-3.5 bg-[#f0f0f0] rounded w-32"/><div className="h-2.5 bg-[#f0f0f0] rounded w-48"/></div>
                </div>
              ))}
            </div>
          ) : cats.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-[13px] font-semibold text-[#0f0f0f]">Chưa có danh mục</p>
              <p className="text-[11px] text-[#a3a3a3] mt-1">Bắt đầu bằng cách thêm danh mục đầu tiên</p>
            </div>
          ) : (
            <ul className="divide-y divide-[#f5f5f4]">
              {cats.map(cat => (
                <li key={cat._id} className="flex items-center gap-4 px-5 py-4 hover:bg-[#fafafa] transition-colors">
                  <div className="w-10 h-10 bg-[#f5f5f3] rounded-xl flex items-center justify-center shrink-0 text-lg">
                    {cat.image ? <img src={cat.image} alt="" className="w-full h-full object-cover rounded-xl"/> : '📂'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#0f0f0f]">{cat.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <code className="text-[10px] text-[#a3a3a3] bg-[#f5f5f3] px-1.5 py-0.5 rounded">{cat.slug}</code>
                      <span className="text-[10px] text-[#a3a3a3]">{cat.productCount} sản phẩm</span>
                    </div>
                    {cat.description && <p className="text-[11px] text-[#737373] mt-0.5 truncate">{cat.description}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setModal(cat)}
                      className="px-3 py-1.5 text-[11px] font-semibold border border-[#e5e5e5] rounded-lg hover:border-[#0f0f0f] transition-colors">Sửa</button>
                    <button onClick={() => setDelCat(cat)}
                      className="px-3 py-1.5 text-[11px] font-semibold border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors">Xóa</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <AnimatePresence>
        {modal && <CategoryModal cat={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); fetchCats() }}/>}
        {delCat && <ConfirmDelete cat={delCat} onClose={() => setDelCat(null)} onConfirm={() => handleDelete(delCat)}/>}
      </AnimatePresence>
    </PMLayout>
  )
}
