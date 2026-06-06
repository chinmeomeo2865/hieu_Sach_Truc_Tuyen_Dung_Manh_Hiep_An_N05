import { useEffect, useState, useCallback } from 'react'
import AdminLayout  from '../../components/admin/AdminLayout'
import ConfirmModal from '../../components/admin/ui/ConfirmModal'
import { api }      from '../../services/api'
import { useToastStore } from '../../store/toastStore'

const STAR_FILTERS = [
  { label: 'Tất cả', value: '' },
  { label: '5 sao',  value: '5' },
  { label: '4 sao',  value: '4' },
  { label: '3 sao',  value: '3' },
  { label: '2 sao',  value: '2' },
  { label: '1 sao',  value: '1' },
]

function Stars({ rating }) {
  return (
    <span className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className={`w-3.5 h-3.5 ${i <= rating ? 'text-amber-400' : 'text-gray-200'}`}
          viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </span>
  )
}

export default function AdminReviewsPage() {
  const showToast = useToastStore(s => s.show)
  const [reviews,    setReviews]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [pagination, setPagination] = useState(null)
  const [page,       setPage]       = useState(1)
  const [ratingFilter, setRatingFilter] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 20 })
      if (ratingFilter) params.set('rating', ratingFilter)
      const res = await api.get(`/api/reviews/admin/all?${params}`)
      setReviews(res.data)
      setPagination(res.pagination)
    } catch {
      showToast({ message: 'Không tải được đánh giá', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [page, ratingFilter])

  useEffect(() => { load() }, [load])

  async function handleDelete() {
    try {
      await api.delete(`/api/reviews/${deleteTarget._id}`)
      showToast({ message: 'Đã xóa đánh giá', type: 'success' })
      setDeleteTarget(null)
      load()
    } catch (e) {
      showToast({ message: e.message, type: 'error' })
    }
  }

  return (
    <AdminLayout title="Quản lý đánh giá">
      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-5">
        {STAR_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => { setRatingFilter(f.value); setPage(1) }}
            className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
              ratingFilter === f.value
                ? 'bg-[#0f0f0f] text-white'
                : 'bg-white border border-[#e5e5e5] text-[#525252] hover:border-[#a3a3a3]'
            }`}
          >
            {f.label}
          </button>
        ))}
        {pagination && (
          <span className="ml-auto text-[12px] text-[#a3a3a3]">
            {pagination.total} đánh giá
          </span>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#e5e5e5] overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-[13px] text-[#a3a3a3]">Đang tải…</div>
        ) : reviews.length === 0 ? (
          <div className="py-20 text-center text-[13px] text-[#a3a3a3]">Không có đánh giá nào</div>
        ) : (
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-[#f0f0f0] text-[10.5px] font-bold uppercase tracking-wider text-[#a3a3a3]">
                <th className="text-left px-5 py-3">Sách</th>
                <th className="text-left px-4 py-3">Khách hàng</th>
                <th className="text-left px-4 py-3 w-28">Sao</th>
                <th className="text-left px-4 py-3">Nội dung</th>
                <th className="text-left px-4 py-3 w-28">Ngày</th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {reviews.map(rv => (
                <tr key={rv._id} className="border-b border-[#f7f7f7] hover:bg-[#fafafa]">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      {rv.product?.image && (
                        <img src={rv.product.image} alt="" className="w-8 h-10 object-cover rounded flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-[#0f0f0f] truncate max-w-[140px]">{rv.product?.title || '—'}</p>
                        <p className="text-[11px] text-[#a3a3a3] truncate">{rv.product?.author}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#0f0f0f]">{rv.user?.name || '—'}</p>
                    <p className="text-[11px] text-[#a3a3a3]">{rv.user?.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Stars rating={rv.rating} />
                  </td>
                  <td className="px-4 py-3 max-w-[240px]">
                    <p className="text-[#404040] line-clamp-2">{rv.comment || <span className="italic text-[#a3a3a3]">Không có nhận xét</span>}</p>
                  </td>
                  <td className="px-4 py-3 text-[#a3a3a3] whitespace-nowrap">
                    {new Date(rv.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setDeleteTarget(rv)}
                      className="p-1.5 rounded-md text-[#a3a3a3] hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-5">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-md text-[12px] font-medium transition-colors ${
                p === page
                  ? 'bg-[#0f0f0f] text-white'
                  : 'bg-white border border-[#e5e5e5] text-[#525252] hover:border-[#a3a3a3]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Xóa đánh giá"
          message={`Xóa đánh giá ${deleteTarget.rating} sao của "${deleteTarget.user?.name}" cho sách "${deleteTarget.product?.title}"?`}
          confirmLabel="Xóa"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </AdminLayout>
  )
}
