import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import WarehouseLayout from '../../components/warehouse/WarehouseLayout'
import { api }         from '../../services/api'
import { useToastStore } from '../../store/toastStore'

const TYPE_CFG = {
  import:       { label: 'Nhập kho',      color: 'bg-emerald-50 text-emerald-800 border-emerald-100', sign: '+' },
  export:       { label: 'Xuất kho',      color: 'bg-rose-50 text-rose-800 border-rose-100',     sign: '' },
  return:       { label: 'Hoàn hàng',     color: 'bg-amber-50 text-amber-800 border-amber-100',   sign: '+' },
  audit_adjust: { label: 'Kiểm kê',       color: 'bg-blue-50 text-blue-800 border-blue-100',     sign: '' },
}

const TABS = [
  { value: '',             label: 'Tất cả' },
  { value: 'import',       label: 'Nhập kho' },
  { value: 'export',       label: 'Xuất kho' },
  { value: 'return',       label: 'Hoàn hàng' },
  { value: 'audit_adjust', label: 'Kiểm kê' },
]

export default function WarehouseTransactionsPage() {
  const showToast = useToastStore(s => s.show)
  const [txns,       setTxns]       = useState([])
  const [loading,    setLoading]    = useState(true)
  const [activeTab,  setActiveTab]  = useState('')
  const [page,       setPage]       = useState(1)
  const [pagination, setPagination] = useState({})

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 15 })
      const res = await api.get(`/api/warehouse/inventory/transactions?${params}`)
      
      // Filter transactions locally if tab is active (backend returns all by default)
      let filteredData = res.data || []
      if (activeTab) {
        filteredData = filteredData.filter(t => t.type === activeTab)
      }
      
      setTxns(filteredData)
      setPagination(res.pagination || {})
    } catch (e) {
      showToast({ message: e.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [page, activeTab])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  useEffect(() => {
    setPage(1)
  }, [activeTab])

  return (
    <WarehouseLayout title="Lịch sử kho">
      <div className="max-w-5xl mx-auto space-y-6 w-full py-4 font-sans">
        
        {/* Centered Page Header */}
        <div className="flex flex-col items-center text-center gap-2 mb-2">
          <h1 className="font-display text-3xl font-bold text-ink leading-tight">Lịch sử nhập / xuất kho</h1>
          <div className="h-0.5 w-10 bg-accent rounded-full" />
          <p className="text-[12.5px] text-muted font-semibold max-w-xl">
            Theo dõi dòng dịch chuyển hàng hóa bao gồm lịch sử nhập kho, xuất bán, hoàn trả và cân đối kiểm kê.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex gap-1.5 bg-white border border-divider-lt rounded-2xl p-1 w-fit shadow-sm mx-auto">
          {TABS.map(t => (
            <button
              key={t.value}
              onClick={() => setActiveTab(t.value)}
              className={`px-4 py-1.5 rounded-lg text-[12px] font-bold tracking-wide transition-all duration-200 ${
                activeTab === t.value
                  ? 'bg-ink text-white shadow-card'
                  : 'text-ink-80 hover:text-ink hover:bg-surface-subtle'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Transaction Table */}
        <div className="bg-white rounded-2xl border border-divider-lt overflow-hidden shadow-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-divider-lt bg-surface-warm/30">
                <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-subtle">Sản phẩm</th>
                <th className="px-5 py-3.5 text-center text-[10px] font-bold uppercase tracking-widest text-subtle">Giao dịch</th>
                <th className="px-5 py-3.5 text-center text-[10px] font-bold uppercase tracking-widest text-subtle">Thay đổi</th>
                <th className="px-5 py-3.5 text-center text-[10px] font-bold uppercase tracking-widest text-subtle">Tồn kho</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-subtle">Chi tiết / Lý do</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-subtle">Thời gian</th>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-subtle">Người thực hiện</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-t border-divider-lt/50 animate-pulse">
                    {[180, 80, 60, 80, 150, 100, 80].map((w, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3.5 bg-surface-subtle rounded-full mx-auto" style={{ width: w }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : txns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-24 text-center">
                    <div className="w-14 h-14 bg-surface-warm border border-divider-lt rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
                      </svg>
                    </div>
                    <p className="text-[14px] font-bold text-ink">Chưa ghi nhận biến động nào</p>
                    <p className="text-[12px] text-muted mt-1">Các hoạt động xuất nhập kho sẽ hiển thị danh sách tại đây.</p>
                  </td>
                </tr>
              ) : (
                txns.map((t, idx) => {
                  const cfg = TYPE_CFG[t.type] || { label: t.type, color: 'bg-surface-subtle text-ink-80 border-divider-lt', sign: '' }
                  const sign = t.quantity > 0 ? '+' : ''
                  const isChange = t.quantity !== 0

                  return (
                    <motion.tr
                      key={t._id || idx}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03, duration: 0.22 }}
                      className="border-t border-divider-lt hover:bg-surface-warm/30 transition-colors duration-200"
                    >
                      {/* Product details */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {t.product?.image && (
                            <img
                              src={t.product.image}
                              alt=""
                              className="w-8 h-11 object-cover rounded-md bg-surface-warm shrink-0 shadow-sm border border-divider-lt/40"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="text-[12.5px] font-bold text-ink line-clamp-1 leading-snug">
                              {t.product?.title || 'Sản phẩm đã bị xóa'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Transaction Type Badge */}
                      <td className="px-5 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </td>

                      {/* Quantity change */}
                      <td className="px-5 py-3 text-center">
                        <span className={`text-[12.5px] font-bold tabular-nums ${t.quantity > 0 ? 'text-emerald-700' : t.quantity < 0 ? 'text-rose-600' : 'text-subtle'}`}>
                          {isChange ? `${sign}${t.quantity}` : '—'}
                        </span>
                      </td>

                      {/* Stock flow Before -> After */}
                      <td className="px-5 py-3 text-center">
                        <span className="text-[12px] text-ink-80 font-bold tabular-nums">
                          {t.stockBefore} → {t.stockAfter}
                        </span>
                      </td>

                      {/* Notes / Reason */}
                      <td className="px-5 py-3 text-[12px] text-ink-80 font-medium">
                        {t.reason || t.notes || '—'}
                      </td>

                      {/* Timestamp */}
                      <td className="px-5 py-3 text-[11.5px] text-muted font-medium tabular-nums">
                        {new Date(t.createdAt).toLocaleString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </td>

                      {/* Performed by */}
                      <td className="px-5 py-3 text-[12px] text-ink-80 font-semibold">
                        {t.performedBy?.name || 'Hệ thống'}
                      </td>
                    </motion.tr>
                  )
                })
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-divider-lt bg-surface-warm/20">
              <p className="text-[11px] text-muted font-semibold tabular-nums">
                Trang {pagination.page}/{pagination.totalPages} · {pagination.total} bản ghi
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 text-[11px] font-bold border border-divider-lt rounded-xl bg-white disabled:opacity-40 hover:border-ink transition-colors duration-200 disabled:cursor-not-allowed"
                >
                  ← Trước
                </button>
                <button
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 text-[11px] font-bold border border-divider-lt rounded-xl bg-white disabled:opacity-40 hover:border-ink transition-colors duration-200 disabled:cursor-not-allowed"
                >
                  Tiếp →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </WarehouseLayout>
  )
}
