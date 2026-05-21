import { useEffect, useState, useCallback } from 'react'
import { api }           from '../../services/api'
import { useToastStore } from '../../store/toastStore'
import { formatPrice }   from '../../utils/format'
import AdminLayout       from '../../components/admin/AdminLayout'

const LIMIT = 20

export default function AdminUsersPage() {
  const showToast = useToastStore(s => s.show)

  const [users, setUsers]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [query, setQuery]           = useState('')
  const [page, setPage]             = useState(1)
  const [pagination, setPagination] = useState(null)
  const [expanded, setExpanded]     = useState(null)
  const [detail, setDetail]         = useState({})
  const [detailLoading, setDL]      = useState(null)

  const fetchUsers = useCallback(async (q, pg) => {
    setLoading(true)
    try {
      const qs = new URLSearchParams({ page: pg, limit: LIMIT })
      if (q) qs.set('search', q)
      const res = await api.get(`/api/users?${qs}`)
      setUsers(res.data)
      setPagination(res.pagination || null)
    } catch (err) {
      showToast({ message: err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers(query, page) }, [query, page])

  function handleSearch(e) {
    e.preventDefault()
    setQuery(search)
    setPage(1)
  }

  async function toggleExpand(userId) {
    if (expanded === userId) { setExpanded(null); return }
    setExpanded(userId)
    if (detail[userId]) return
    setDL(userId)
    try {
      const res = await api.get(`/api/users/${userId}`)
      setDetail(prev => ({ ...prev, [userId]: res.data }))
    } catch (err) {
      showToast({ message: err.message, type: 'error' })
    } finally {
      setDL(null)
    }
  }

  const STATUS_COLOR = {
    PENDING:   'bg-yellow-50 text-yellow-700 border-yellow-200',
    CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-200',
    PACKING:   'bg-purple-50 text-purple-700 border-purple-200',
    SHIPPING:  'bg-orange-50 text-orange-700 border-orange-200',
    DELIVERED: 'bg-green-50 text-green-700 border-green-200',
    CANCELLED: 'bg-red-50 text-red-700 border-red-200',
    RETURNED:  'bg-gray-50 text-gray-600 border-gray-200',
  }
  const STATUS_TEXT = {
    PENDING:'Chờ xác nhận', CONFIRMED:'Đã xác nhận', PACKING:'Đóng gói',
    SHIPPING:'Đang giao', DELIVERED:'Đã giao', CANCELLED:'Đã hủy', RETURNED:'Hoàn trả',
  }

  return (
    <AdminLayout title="Quản lý khách hàng">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-5">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm theo tên hoặc email..."
          className="flex-1 border border-divider-lt rounded-sm px-3 py-2 text-sm text-ink placeholder:text-subtle focus:outline-none focus:border-ink transition-colors"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-ink text-white text-xs font-semibold tracking-label uppercase rounded-sm hover:bg-ink-80 transition-colors"
        >
          Tìm
        </button>
        {query && (
          <button
            type="button"
            onClick={() => { setSearch(''); setQuery(''); setPage(1) }}
            className="px-3 py-2 border border-divider-lt text-xs text-muted rounded-sm hover:border-divider hover:text-ink transition-colors"
          >
            Xóa
          </button>
        )}
      </form>

      {/* Total */}
      {pagination && (
        <p className="text-xs text-muted mb-4">
          {query ? `Kết quả cho "${query}": ` : 'Tổng: '}
          <span className="font-semibold text-ink">{pagination.total}</span> khách hàng
        </p>
      )}

      {/* Table */}
      {loading ? (
        <div className="space-y-2.5">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-16 bg-white border border-divider-lt rounded-sm animate-pulse" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white border border-divider-lt rounded-sm py-16 text-center">
          <p className="text-muted text-sm">Không tìm thấy khách hàng nào</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map(user => {
            const isExpanded = expanded === user._id
            const d = detail[user._id]
            const loading = detailLoading === user._id

            return (
              <div key={user._id} className="bg-white border border-divider-lt rounded-sm overflow-hidden">
                {/* Row */}
                <div
                  className="flex flex-wrap items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-surface-warm transition-colors"
                  onClick={() => toggleExpand(user._id)}
                >
                  <svg className={`w-3.5 h-3.5 text-muted shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>

                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-ink text-white flex items-center justify-center text-xs font-semibold shrink-0">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>

                  {/* Name + email */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{user.name}</p>
                    <p className="text-xs text-muted truncate">{user.email}</p>
                  </div>

                  {/* Phone */}
                  <p className="hidden md:block text-xs text-muted w-32 shrink-0">
                    {user.phone || '—'}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 shrink-0 text-right">
                    <div>
                      <p className="text-xs font-semibold text-ink">{user.orderCount} đơn</p>
                      <p className="text-[11px] text-muted">{formatPrice(user.orderTotal)}</p>
                    </div>
                    <p className="hidden sm:block text-[11px] text-muted w-24">
                      {new Date(user.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-divider-lt px-5 py-4 bg-surface-warm">
                    {loading ? (
                      <div className="space-y-2">
                        {[1,2].map(i => <div key={i} className="h-12 bg-white rounded-sm animate-pulse" />)}
                      </div>
                    ) : !d ? null : d.orders?.length === 0 ? (
                      <p className="text-xs text-muted">Khách hàng chưa có đơn hàng nào.</p>
                    ) : (
                      <div>
                        <p className="text-2xs font-semibold tracking-label-lg uppercase text-muted mb-3">
                          Lịch sử đơn hàng ({d.orders.length})
                        </p>
                        <div className="space-y-2">
                          {d.orders.map(order => (
                            <div key={order._id} className="bg-white border border-divider-lt rounded-sm px-4 py-3 flex flex-wrap items-center gap-3">
                              <span className="text-xs text-muted font-mono">#{order._id.slice(-8).toUpperCase()}</span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_COLOR[order.status] || ''}`}>
                                {STATUS_TEXT[order.status] || order.status}
                              </span>
                              <span className="text-xs text-muted flex-1">
                                {order.items.length} sản phẩm · {order.address?.city}
                              </span>
                              <span className="text-xs font-semibold text-ink">{formatPrice(order.total)}</span>
                              <span className="text-[11px] text-muted">
                                {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-xs text-muted">
            Trang {pagination.page}/{pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 text-xs font-semibold border border-divider-lt rounded-sm text-ink-60 hover:border-divider hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >← Trước</button>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 text-xs font-semibold border border-divider-lt rounded-sm text-ink-60 hover:border-divider hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >Tiếp →</button>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
