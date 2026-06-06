import { useEffect, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import AdminLayout  from '../../components/admin/AdminLayout'
import ConfirmModal from '../../components/admin/ui/ConfirmModal'
import { api }      from '../../services/api'
import { useToastStore }  from '../../store/toastStore'
import { useAuthStore }   from '../../store/authStore'

const STATUS_OPTS = [
  { value: 'PUBLISHED', label: 'Công khai',  color: 'bg-emerald-50 text-emerald-700' },
  { value: 'DRAFT',     label: 'Bản nháp',   color: 'bg-amber-50 text-amber-700' },
  { value: 'HIDDEN',    label: 'Tạm ẩn',     color: 'bg-gray-100 text-gray-500' },
]

const EMPTY = { title: '', summary: '', content: '', coverImage: '', category: 'Góc đọc sách', readTime: 3, status: 'DRAFT' }
const INPUT = 'w-full border border-[#e5e5e5] rounded-lg px-3 py-2 text-[13px] text-[#0f0f0f] placeholder:text-[#a3a3a3] focus:outline-none focus:border-[#0f0f0f] transition-colors'

function ArticleModal({ article, onClose, onSaved }) {
  const showToast = useToastStore(s => s.show)
  const isEdit    = !!article
  const [form, setForm] = useState(isEdit ? {
    title:      article.title,
    summary:    article.summary,
    content:    article.content,
    coverImage: article.coverImage,
    category:   article.category,
    readTime:   article.readTime,
    status:     article.status,
  } : { ...EMPTY })
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)

  const set = f => e => {
    setForm(p => ({ ...p, [f]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }))
    if (errors[f]) setErrors(p => ({ ...p, [f]: '' }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) { setErrors({ title: 'Tiêu đề là bắt buộc' }); return }
    setLoading(true)
    try {
      if (isEdit) await api.put(`/api/articles/${article._id}`, form)
      else        await api.post('/api/articles', form)
      showToast({ message: isEdit ? 'Đã cập nhật bài viết' : 'Đã tạo bài viết', type: 'success' })
      onSaved()
    } catch (err) {
      showToast({ message: err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" onClick={onClose}/>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto pointer-events-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f0f0] sticky top-0 bg-white">
            <p className="text-[14px] font-semibold">{isEdit ? 'Chỉnh sửa bài viết' : 'Thêm bài viết'}</p>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f5f5f4] text-[#a3a3a3]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-wider text-[#737373] mb-1.5">Tiêu đề *</label>
              <input value={form.title} onChange={set('title')} placeholder="Tiêu đề bài viết" className={INPUT} />
              {errors.title && <p className="text-[11px] text-red-500 mt-1">{errors.title}</p>}
            </div>
            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-wider text-[#737373] mb-1.5">Tóm tắt</label>
              <textarea rows={2} value={form.summary} onChange={set('summary')} placeholder="Một đoạn mô tả ngắn…" className={`${INPUT} resize-none`}/>
            </div>
            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-wider text-[#737373] mb-1.5">Nội dung</label>
              <textarea rows={8} value={form.content} onChange={set('content')} placeholder="Viết nội dung bài ở đây…" className={`${INPUT} resize-y`}/>
            </div>
            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-wider text-[#737373] mb-1.5">URL ảnh bìa</label>
              <input value={form.coverImage} onChange={set('coverImage')} placeholder="https://..." className={INPUT} />
              {form.coverImage && <img src={form.coverImage} alt="preview" className="mt-2 h-24 w-40 object-cover rounded-lg" />}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[10.5px] font-bold uppercase tracking-wider text-[#737373] mb-1.5">Chuyên mục</label>
                <input value={form.category} onChange={set('category')} placeholder="Góc đọc sách" className={INPUT}/>
              </div>
              <div>
                <label className="block text-[10.5px] font-bold uppercase tracking-wider text-[#737373] mb-1.5">Thời gian đọc (phút)</label>
                <input type="number" min={1} value={form.readTime} onChange={set('readTime')} className={INPUT}/>
              </div>
              <div>
                <label className="block text-[10.5px] font-bold uppercase tracking-wider text-[#737373] mb-1.5">Trạng thái</label>
                <select value={form.status} onChange={set('status')} className={INPUT}>
                  {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-[#f0f0f0]">
              <button type="button" onClick={onClose}
                className="px-4 py-2 text-[12px] font-semibold border border-[#e5e5e5] rounded-lg text-[#525252] hover:border-[#a3a3a3]">
                Hủy
              </button>
              <button type="submit" disabled={loading}
                className="px-4 py-2 text-[12px] font-semibold bg-[#0f0f0f] text-white rounded-lg hover:bg-[#3d3835] disabled:opacity-50">
                {loading ? 'Đang lưu…' : (isEdit ? 'Lưu thay đổi' : 'Đăng bài')}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  )
}

export default function AdminArticlesPage() {
  const showToast = useToastStore(s => s.show)
  const user      = useAuthStore(s => s.user)
  const [articles,   setArticles]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState('all')
  const [modal,      setModal]      = useState(null) // null | 'new' | article
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: 50 })
      if (filter !== 'all') params.set('status', filter)
      else params.set('status', 'all')
      const res = await api.get(`/api/articles?${params}`)
      setArticles(res.data)
    } catch {
      showToast({ message: 'Không tải được bài viết', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { load() }, [load])

  async function handleDelete() {
    try {
      await api.delete(`/api/articles/${deleteTarget._id}`)
      showToast({ message: 'Đã xóa bài viết', type: 'success' })
      setDeleteTarget(null)
      load()
    } catch (e) {
      showToast({ message: e.message, type: 'error' })
    }
  }

  const statusOf = s => STATUS_OPTS.find(o => o.value === s) || STATUS_OPTS[1]

  return (
    <AdminLayout title="Quản lý bài viết">
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-2">
          {[{ v: 'all', l: 'Tất cả' }, ...STATUS_OPTS.map(o => ({ v: o.value, l: o.label }))].map(f => (
            <button key={f.v} onClick={() => setFilter(f.v)}
              className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors ${filter === f.v ? 'bg-[#0f0f0f] text-white' : 'bg-white border border-[#e5e5e5] text-[#525252] hover:border-[#a3a3a3]'}`}>
              {f.l}
            </button>
          ))}
        </div>
        <button onClick={() => setModal('new')}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#0f0f0f] text-white text-[12px] font-semibold rounded-lg hover:bg-[#3d3835]">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          Viết bài mới
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#e5e5e5] overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-[13px] text-[#a3a3a3]">Đang tải…</div>
        ) : articles.length === 0 ? (
          <div className="py-20 text-center text-[13px] text-[#a3a3a3]">Chưa có bài viết nào</div>
        ) : (
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-[#f0f0f0] text-[10.5px] font-bold uppercase tracking-wider text-[#a3a3a3]">
                <th className="text-left px-5 py-3">Bài viết</th>
                <th className="text-left px-4 py-3 w-28">Chuyên mục</th>
                <th className="text-left px-4 py-3 w-24">Trạng thái</th>
                <th className="text-left px-4 py-3 w-28">Ngày tạo</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {articles.map(a => {
                const st = statusOf(a.status)
                return (
                  <tr key={a._id} className="border-b border-[#f7f7f7] hover:bg-[#fafafa]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {a.coverImage ? (
                          <img src={a.coverImage} alt="" className="w-12 h-8 object-cover rounded flex-shrink-0"/>
                        ) : (
                          <div className="w-12 h-8 bg-[#f5f5f4] rounded flex-shrink-0"/>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-[#0f0f0f] truncate max-w-[280px]">{a.title}</p>
                          <p className="text-[11px] text-[#a3a3a3] truncate max-w-[280px]">{a.summary}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#525252]">{a.category}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10.5px] font-semibold ${st.color}`}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3 text-[#a3a3a3]">{new Date(a.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setModal(a)}
                          className="p-1.5 rounded hover:bg-[#f5f5f4] text-[#a3a3a3] hover:text-[#0f0f0f]">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        </button>
                        {user?.role === 'admin' && (
                          <button onClick={() => setDeleteTarget(a)}
                            className="p-1.5 rounded hover:bg-red-50 text-[#a3a3a3] hover:text-red-500">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <AnimatePresence>
        {modal && (
          <ArticleModal
            article={modal === 'new' ? null : modal}
            onClose={() => setModal(null)}
            onSaved={() => { setModal(null); load() }}
          />
        )}
      </AnimatePresence>

      {deleteTarget && (
        <ConfirmModal
          title="Xóa bài viết"
          message={`Xóa bài "${deleteTarget.title}"? Hành động này không thể hoàn tác.`}
          confirmLabel="Xóa"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </AdminLayout>
  )
}
