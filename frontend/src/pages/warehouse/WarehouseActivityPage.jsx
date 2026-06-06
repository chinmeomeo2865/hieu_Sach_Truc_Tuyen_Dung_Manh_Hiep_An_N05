import { useEffect, useState, useCallback } from 'react'
import WarehouseLayout from '../../components/warehouse/WarehouseLayout'
import { api }         from '../../services/api'
import { useToastStore } from '../../store/toastStore'

const ACTION_CFG = {
  import_stock:        { icon: '📦', label: 'Nhập kho',          color: 'bg-emerald-50 text-emerald-700' },
  update_order_status: { icon: '🚚', label: 'Cập nhật đơn',      color: 'bg-blue-50 text-blue-700' },
  process_return:      { icon: '↩️', label: 'Xử lý hoàn trả',   color: 'bg-orange-50 text-orange-700' },
  submit_audit:        { icon: '📋', label: 'Kiểm kê kho',       color: 'bg-violet-50 text-violet-700' },
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
      <div className="max-w-3xl space-y-4">
        <div className="bg-white rounded-xl border border-[#e8e8e6] overflow-hidden">
          {loading
            ? (
              <div className="divide-y divide-[#f5f5f4]">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex gap-3 px-5 py-4 animate-pulse">
                    <div className="w-9 h-9 bg-[#f0f0f0] rounded-xl shrink-0"/>
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-3 bg-[#f0f0f0] rounded w-2/3"/>
                      <div className="h-2.5 bg-[#f0f0f0] rounded w-1/3"/>
                    </div>
                  </div>
                ))}
              </div>
            )
            : logs.length === 0
              ? (
                <div className="py-16 text-center">
                  <p className="text-[13px] font-semibold text-[#1c1c1a]">Chưa có hoạt động nào</p>
                  <p className="text-[11px] text-[#a3a3a3] mt-1">Các thao tác kho sẽ được ghi lại tại đây</p>
                </div>
              )
              : (
                <ul className="divide-y divide-[#f5f5f4]">
                  {logs.map((log, i) => {
                    const cfg = ACTION_CFG[log.action] || { icon: '🔧', label: log.action, color: 'bg-gray-50 text-gray-600' }
                    return (
                      <li key={log._id || i} className="flex items-start gap-3.5 px-5 py-4 hover:bg-[#fafafa] transition-colors">
                        <span className={`text-base p-2 rounded-xl shrink-0 ${cfg.color}`}>{cfg.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[12.5px] text-[#1c1c1a] leading-snug">{log.description}</p>
                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${cfg.color}`}>{cfg.label}</span>
                          </div>
                          <p className="text-[11px] text-[#a3a3a3] mt-1">
                            {log.performedBy?.name} ·{' '}
                            {new Date(log.createdAt).toLocaleString('vi-VN', {
                              hour: '2-digit', minute: '2-digit',
                              day: '2-digit', month: '2-digit', year: 'numeric',
                            })}
                          </p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )
          }

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-[#f0f0f0]">
              <p className="text-[11px] text-[#a3a3a3]">Trang {pagination.page} / {pagination.totalPages} · {pagination.total} thao tác</p>
              <div className="flex gap-1.5">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-[11px] border border-[#e8e8e6] rounded-lg disabled:opacity-40 hover:border-[#1c1c1a] transition-colors">← Trước</button>
                <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-[11px] border border-[#e8e8e6] rounded-lg disabled:opacity-40 hover:border-[#1c1c1a] transition-colors">Tiếp →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </WarehouseLayout>
  )
}
