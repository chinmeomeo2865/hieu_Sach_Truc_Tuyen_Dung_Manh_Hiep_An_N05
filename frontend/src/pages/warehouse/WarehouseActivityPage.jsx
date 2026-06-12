import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import WarehouseLayout from '../../components/warehouse/WarehouseLayout'
import { api }         from '../../services/api'
import { useToastStore } from '../../store/toastStore'

const ACTION_CFG = {
  import_stock:        { icon: '📦', label: 'Nhập kho',          color: 'bg-emerald-50 text-emerald-800 border-emerald-100' },
  update_order_status: { icon: '🚚', label: 'Cập nhật đơn',      color: 'bg-amber-50 text-amber-800 border-amber-100' },
  process_return:      { icon: '↩️', label: 'Xử lý hoàn trả',   color: 'bg-sand-100 text-sand-900 border-sand-200' },
  submit_audit:        { icon: '📋', label: 'Kiểm kê kho',       color: 'bg-blue-50 text-blue-800 border-blue-100' },
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } }
}

export default function WarehouseActivityPage() {
  const showToast = useToastStore(s => s.show)
  const [logs,    setLogs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [page,    setPage]    = useState(1)
  const [pagination, setPagination] = useState({})

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(`/api/warehouse/activity?page=${page}&limit=30`)
      setLogs(res.data)
      setPagination(res.pagination || {})
    } catch (e) { showToast({ message: e.message, type: 'error' }) }
    finally { setLoading(false) }
  }, [page])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  return (
    <WarehouseLayout title="Nhật ký thao tác">
      <div className="max-w-3xl space-y-6">
        {/* Title and stats summary */}
        <div className="flex flex-col gap-1.5">
          <h1 className="font-display text-2xl font-bold text-ink leading-tight">Nhật ký thao tác</h1>
          <p className="text-[12px] text-muted font-medium">Lịch sử ghi nhận toàn bộ hoạt động điều chỉnh tồn kho, kiểm kê và thay đổi trạng thái đơn hàng.</p>
        </div>

        {/* Timeline block */}
        <div className="bg-white rounded-2xl border border-divider-lt overflow-hidden shadow-card">
          {loading
            ? (
              <div className="divide-y divide-divider-lt/50">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex gap-4 px-6 py-5 animate-pulse">
                    <div className="w-9 h-9 bg-surface-subtle rounded-xl shrink-0"/>
                    <div className="flex-1 space-y-2.5 pt-1.5">
                      <div className="h-3.5 bg-surface-subtle rounded w-2/3"/>
                      <div className="h-3 bg-surface-subtle rounded w-1/3"/>
                    </div>
                  </div>
                ))}
              </div>
            )
            : logs.length === 0
              ? (
                <div className="py-24 text-center">
                  <div className="w-14 h-14 bg-surface-warm border border-divider-lt rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </div>
                  <p className="text-[14px] font-semibold text-ink">Chưa có hoạt động nào</p>
                  <p className="text-[12px] text-muted mt-1">Các hành động vận hành kho sẽ tự động xuất hiện tại đây.</p>
                </div>
              )
              : (
                <motion.ul
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="divide-y divide-divider-lt"
                >
                  {logs.map((log, i) => {
                    const cfg = ACTION_CFG[log.action] || { icon: '🔧', label: log.action, color: 'bg-surface-subtle text-ink-80 border-divider-lt' }
                    return (
                      <motion.li
                        variants={itemVariants}
                        key={log._id || i}
                        className="flex items-start gap-4 px-6 py-4.5 hover:bg-surface-warm/30 transition-all duration-200"
                      >
                        <span className={`text-base p-2 rounded-xl shrink-0 border ${cfg.color}`}>{cfg.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <p className="text-[13px] font-bold text-ink leading-snug flex-1">{log.description}</p>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border shrink-0 ${cfg.color}`}>{cfg.label}</span>
                          </div>
                          <p className="text-[11px] text-muted mt-1.5 font-medium">
                            Thực hiện bởi: <span className="font-semibold text-ink-80">{log.performedBy?.name}</span> ·{' '}
                            <span className="tabular-nums">
                              {new Date(log.createdAt).toLocaleString('vi-VN', {
                                hour: '2-digit', minute: '2-digit',
                                day: '2-digit', month: '2-digit', year: 'numeric',
                              })}
                            </span>
                          </p>
                        </div>
                      </motion.li>
                    )
                  })}
                </motion.ul>
              )
          }

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4.5 border-t border-divider-lt bg-surface-warm/20">
              <p className="text-[11px] text-muted font-medium tabular-nums">Trang {pagination.page} / {pagination.totalPages} · {pagination.total} nhật ký</p>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-[11px] font-bold border border-divider-lt rounded-xl disabled:opacity-40 hover:border-ink bg-white transition-colors duration-200 disabled:cursor-not-allowed">← Trước</button>
                <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-[11px] font-bold border border-divider-lt rounded-xl disabled:opacity-40 hover:border-ink bg-white transition-colors duration-200 disabled:cursor-not-allowed">Tiếp →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </WarehouseLayout>
  )
}
