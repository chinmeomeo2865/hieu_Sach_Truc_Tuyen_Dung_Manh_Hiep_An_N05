import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import PMLayout from '../../components/pm/PMLayout'
import { api } from '../../services/api'
import { useToastStore } from '../../store/toastStore'

function slugify(str = '') {
  return str.toLowerCase().replace(/[đĐ]/g,'d').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
}

/* ─── Icons ──────────────────────────────────────────────── */
const ICON_PATHS = {
  folder: <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />,
  book: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />,
  layers: <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
  alert: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
  pencil: <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />,
  trash: <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />,
  plus: <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />,
  search: (
    <>
      <circle cx="11" cy="11" r="8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
    </>
  ),
  x: <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />,
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21" />
    </>
  ),
}

function Icon({ name, className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      {ICON_PATHS[name]}
    </svg>
  )
}

/* ─── Metric strip card ──────────────────────────────────── */
function MetricCard({ icon, label, value, valueColor = 'text-[#1A1A1A]' }) {
  return (
    <div className="bg-white rounded-lg border border-[#EAE6DF] p-4 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-[10px] font-bold tracking-wider text-[#615C56] uppercase mb-1.5">{label}</p>
        <p className={`font-display text-[20px] font-bold ${valueColor}`}>{value}</p>
      </div>
      <div className="border border-[#EAE6DF] p-2 bg-[#FAF8F5] rounded-lg text-[#615C56] shrink-0">
        <Icon name={icon} className="w-4 h-4" />
      </div>
    </div>
  )
}

/* ─── Modal: create / edit category ─────────────────────────── */
function CategoryModal({ cat, onClose, onSaved }) {
  const showToast = useToastStore(s => s.show)
  const isEdit    = !!cat
  const [form, setForm]     = useState({ name: cat?.name || '', description: cat?.description || '', image: cat?.image || '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }))
  const slug = slugify(form.name)

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
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md pointer-events-auto border border-[#EAE6DF]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAE6DF]">
            <p className="font-display text-[13px] font-bold uppercase tracking-wider text-[#1A1A1A]">
              {isEdit ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
            </p>
            <button onClick={onClose}
              className="border border-[#EAE6DF] hover:border-[#1A1A1A] p-1.5 rounded-lg text-[#615C56] hover:text-[#1A1A1A] transition-colors">
              <Icon name="x" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#615C56] mb-1.5">Tên danh mục *</label>
              <input value={form.name} onChange={set('name')} placeholder="Văn học, Kỹ năng sống…" autoFocus
                className={`w-full px-3.5 py-2.5 border rounded-lg text-[13px] bg-[#FAF8F5] focus:bg-white focus:outline-none transition-colors ${error ? 'border-red-300 bg-red-50' : 'border-[#EAE6DF] focus:border-[#1A1A1A]'}`}/>
              {error && <p className="mt-1.5 text-[11px] text-red-500 font-medium">{error}</p>}
              {form.name && (
                <p className="mt-1.5 text-[10px] text-[#9B9389]">
                  Slug: <span className="font-mono bg-[#FAF8F5] border border-[#EAE6DF] px-1.5 py-0.5 rounded text-[#615C56]">{slug}</span>
                </p>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#615C56] mb-1.5">Mô tả</label>
              <textarea value={form.description} onChange={set('description')} rows={2} placeholder="Mô tả ngắn về danh mục…"
                className="w-full px-3.5 py-2.5 border border-[#EAE6DF] rounded-lg text-[13px] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:border-[#1A1A1A] transition-colors resize-none"/>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#615C56] mb-1.5">Ảnh đại diện (URL)</label>
              <div className="flex gap-3 items-start">
                <div className="w-14 h-14 rounded-lg border border-[#EAE6DF] bg-[#FAF8F5] flex items-center justify-center shrink-0 overflow-hidden">
                  {form.image
                    ? <img src={form.image} alt="" className="w-full h-full object-cover"/>
                    : <Icon name="image" className="w-5 h-5 text-[#9B9389]"/>}
                </div>
                <input value={form.image} onChange={set('image')} placeholder="https://…"
                  className="flex-1 px-3.5 py-2.5 border border-[#EAE6DF] rounded-lg text-[13px] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:border-[#1A1A1A] transition-colors"/>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 border border-[#EAE6DF] rounded-lg text-[12px] font-bold uppercase tracking-wider text-[#615C56] hover:border-[#1A1A1A] hover:text-[#1A1A1A] transition-colors">
                Hủy
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 py-2.5 bg-[#1A1A1A] text-white rounded-lg text-[12px] font-bold uppercase tracking-wider hover:bg-black disabled:opacity-50 transition-colors">
                {loading ? 'Đang lưu…' : isEdit ? 'Cập nhật' : 'Thêm danh mục'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  )
}

/* ─── Modal: confirm delete ──────────────────────────────────── */
function ConfirmDelete({ cat, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false)
  const canDelete = cat.productCount === 0

  return (
    <>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]" onClick={onClose}/>
      <motion.div initial={{ opacity:0, scale:0.96, y:8 }} animate={{ opacity:1, scale:1, y:0 }}
        exit={{ opacity:0, scale:0.96, y:8 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-sm pointer-events-auto p-6 text-center border border-[#EAE6DF]">
          <div className="w-12 h-12 bg-red-50 border border-red-200/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="trash" className="w-5 h-5 text-red-500" />
          </div>
          <p className="font-display text-[14px] font-bold text-[#1A1A1A] mb-1">Xóa "{cat.name}"?</p>
          {canDelete
            ? <p className="text-[12px] text-[#615C56] mb-5">Hành động này không thể hoàn tác.</p>
            : (
              <p className="text-[11.5px] text-amber-700 bg-amber-50 border border-amber-200/50 rounded-lg px-3 py-2 mb-5 leading-relaxed">
                Danh mục còn <strong>{cat.productCount}</strong> sản phẩm. Cần chuyển sản phẩm sang danh mục khác trước khi xóa.
              </p>
            )
          }
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-2.5 border border-[#EAE6DF] rounded-lg text-[12px] font-bold uppercase tracking-wider text-[#615C56] hover:border-[#1A1A1A] hover:text-[#1A1A1A] transition-colors">
              Hủy
            </button>
            {canDelete && (
              <button disabled={loading} onClick={async () => { setLoading(true); await onConfirm(); setLoading(false) }}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-[12px] font-bold uppercase tracking-wider hover:bg-red-600 disabled:opacity-50 transition-colors">
                {loading ? 'Đang xóa…' : 'Xóa'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </>
  )
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function PMCategoriesPage() {
  const showToast = useToastStore(s => s.show)
  const [searchParams, setSearchParams] = useSearchParams()
  const [cats,    setCats]    = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(null) // null | 'new' | cat object
  const [delCat,  setDelCat]  = useState(null)
  const [search,  setSearch]  = useState('')
  const [sort,    setSort]    = useState('name-asc')

  async function fetchCats() {
    setLoading(true)
    try { const r = await api.get('/api/pm/categories'); setCats(r.data) }
    catch (e) { showToast({ message: e.message, type: 'error' }) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchCats() }, [])

  // Hỗ trợ deep-link "Thêm danh mục" từ Quick Actions trên Dashboard
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setModal('new')
      const next = new URLSearchParams(searchParams)
      next.delete('new')
      setSearchParams(next, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleDelete(cat) {
    try {
      await api.del(`/api/pm/categories/${cat._id}`)
      showToast({ message: `Đã xóa "${cat.name}"`, type: 'success' })
      setDelCat(null); fetchCats()
    } catch (e) { showToast({ message: e.message, type: 'error' }) }
  }

  const totalProducts = cats.reduce((sum, c) => sum + (c.productCount || 0), 0)
  const emptyCats     = cats.filter(c => !c.productCount).length
  const maxCount      = Math.max(1, ...cats.map(c => c.productCount || 0))

  const filtered = useMemo(() => {
    let list = cats
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q))
    }
    return [...list].sort((a, b) => {
      switch (sort) {
        case 'name-desc':  return b.name.localeCompare(a.name)
        case 'count-desc': return (b.productCount || 0) - (a.productCount || 0)
        case 'count-asc':  return (a.productCount || 0) - (b.productCount || 0)
        default:           return a.name.localeCompare(b.name)
      }
    })
  }, [cats, search, sort])

  return (
    <PMLayout title="Danh mục">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#EAE6DF] pb-3 mb-5">
        <div>
          <h2 className="font-display text-[14.5px] font-bold text-[#1A1A1A] uppercase tracking-wider">Quản lý danh mục</h2>
          <p className="text-[11px] text-[#9B9389] mt-0.5">Tổ chức và phân loại sách trong cửa hàng</p>
        </div>
        <button onClick={() => setModal('new')}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1A1A1A] text-white text-[11px] font-bold uppercase tracking-wider rounded-lg hover:bg-black transition-colors shrink-0">
          <Icon name="plus" />
          Thêm danh mục
        </button>
      </div>

      {/* Metric strip */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <MetricCard icon="layers" label="Tổng danh mục" value={cats.length} />
        <MetricCard icon="book" label="Sách đã phân loại" value={totalProducts} />
        <MetricCard icon="alert" label="Danh mục trống" value={emptyCats} valueColor={emptyCats > 0 ? 'text-amber-600' : 'text-[#1A1A1A]'} />
      </motion.div>

      {/* Search + sort */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9B9389]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm danh mục…"
            className="w-full pl-9 pr-3 py-2.5 border border-[#EAE6DF] rounded-lg text-[12.5px] bg-white placeholder:text-[#9B9389] focus:outline-none focus:border-[#1A1A1A] transition-colors"/>
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)}
          className="px-3 py-2.5 border border-[#EAE6DF] rounded-lg text-[12px] font-medium bg-white text-[#615C56] focus:outline-none focus:border-[#1A1A1A] transition-colors">
          <option value="name-asc">Tên (A → Z)</option>
          <option value="name-desc">Tên (Z → A)</option>
          <option value="count-desc">Nhiều sản phẩm nhất</option>
          <option value="count-asc">Ít sản phẩm nhất</option>
        </select>
        <p className="text-[11px] text-[#9B9389] sm:ml-auto">
          {search ? `${filtered.length}/${cats.length}` : cats.length} danh mục
        </p>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white rounded-xl border border-[#EAE6DF] shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#FAF8F5] border-b border-[#EAE6DF]">
              <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#8E877F]">Danh mục</th>
              <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#8E877F]">Mô tả</th>
              <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#8E877F]">Sản phẩm</th>
              <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-[#8E877F]">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F4F1EA]">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-[#F2EFEA] rounded-lg shrink-0" />
                      <div className="space-y-2"><div className="h-3 bg-[#F2EFEA] rounded w-28" /><div className="h-2.5 bg-[#F2EFEA] rounded w-16" /></div>
                    </div>
                  </td>
                  <td className="px-5 py-4"><div className="h-3 bg-[#F2EFEA] rounded w-40" /></td>
                  <td className="px-5 py-4"><div className="h-3 bg-[#F2EFEA] rounded w-24" /></td>
                  <td className="px-5 py-4"><div className="h-3 bg-[#F2EFEA] rounded w-16 ml-auto" /></td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-16 text-center">
                  {cats.length === 0 ? (
                    <>
                      <p className="font-display text-[13px] font-bold text-[#1A1A1A]">Chưa có danh mục nào</p>
                      <p className="text-[11px] text-[#9B9389] mt-1">Bắt đầu bằng cách thêm danh mục đầu tiên</p>
                    </>
                  ) : (
                    <>
                      <p className="font-display text-[13px] font-bold text-[#1A1A1A]">Không tìm thấy danh mục phù hợp</p>
                      <button onClick={() => setSearch('')} className="text-[11px] text-[#615C56] hover:text-[#1A1A1A] underline mt-1.5">Xóa bộ lọc tìm kiếm</button>
                    </>
                  )}
                </td>
              </tr>
            ) : filtered.map(cat => (
              <tr key={cat._id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-lg border border-[#EAE6DF] bg-[#FAF8F5] flex items-center justify-center shrink-0 overflow-hidden">
                      {cat.image
                        ? <img src={cat.image} alt="" className="w-full h-full object-cover"/>
                        : <Icon name="folder" className="w-4 h-4 text-[#9B9389]"/>}
                    </div>
                    <div className="min-w-0">
                      <p className="font-display text-[13px] font-semibold text-[#1A1A1A]">{cat.name}</p>
                      <code className="text-[10px] font-mono text-[#9B9389] bg-[#FAF8F5] border border-[#EAE6DF] px-1.5 py-0.5 rounded mt-0.5 inline-block">{cat.slug}</code>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-[12px] text-[#615C56] max-w-[260px]">
                  <p className="truncate">{cat.description || '—'}</p>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <span className="font-display text-[13px] font-bold text-[#1A1A1A] w-6 text-right shrink-0">{cat.productCount}</span>
                    <div className="w-20 h-1.5 bg-[#F2EFEA] rounded-sm overflow-hidden shrink-0">
                      <div className="h-full bg-[#2E4A3F] rounded-sm" style={{ width: `${((cat.productCount || 0) / maxCount) * 100}%` }} />
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-1.5">
                    <button onClick={() => setModal(cat)} title="Sửa danh mục"
                      className="border border-[#EAE6DF] hover:border-[#1A1A1A] p-1.5 rounded-lg text-[#615C56] hover:text-[#1A1A1A] transition-colors">
                      <Icon name="pencil" />
                    </button>
                    <button onClick={() => setDelCat(cat)} title="Xóa danh mục"
                      className="border border-[#EAE6DF] hover:border-red-300 hover:bg-red-50 p-1.5 rounded-lg text-[#615C56] hover:text-red-600 transition-colors">
                      <Icon name="trash" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      <AnimatePresence>
        {modal && <CategoryModal cat={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); fetchCats() }}/>}
        {delCat && <ConfirmDelete cat={delCat} onClose={() => setDelCat(null)} onConfirm={() => handleDelete(delCat)}/>}
      </AnimatePresence>
    </PMLayout>
  )
}
