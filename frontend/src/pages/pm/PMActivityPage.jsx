import { useEffect, useState, useCallback } from 'react'
import PMLayout from '../../components/pm/PMLayout'
import { api } from '../../services/api'
import { useToastStore } from '../../store/toastStore'

const ACTION_CFG = {
  create_category:   { icon: '📂', label: 'Thêm danh mục',  color: 'bg-blue-50 text-blue-700' },
  update_category:   { icon: '✏️', label: 'Sửa danh mục',   color: 'bg-blue-50 text-blue-700' },
  delete_category:   { icon: '🗑', label: 'Xóa danh mục',   color: 'bg-red-50 text-red-600' },
  create_promotion:  { icon: '🏷', label: 'Tạo KM',          color: 'bg-violet-50 text-violet-700' },
  end_promotion:     { icon: '🔚', label: 'Kết thúc KM',     color: 'bg-orange-50 text-orange-700' },
  toggle_visibility: { icon: '👁', label: 'Đổi hiển thị',   color: 'bg-amber-50 text-amber-700' },
  create_product:    { icon: '📖', label: 'Thêm sách',        color: 'bg-emerald-50 text-emerald-700' },
  update_product:    { icon: '✏️', label: 'Sửa sách',         color: 'bg-emerald-50 text-emerald-700' },
  delete_product:    { icon: '🗑', label: 'Xóa sách',         color: 'bg-red-50 text-red-600' },
}

export default function PMActivityPage() {
  const showToast = useToastStore(s => s.show)
  const [logs,    setLogs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [page,    setPage]    = useState(1)
  const [pagination, setPagination] = useState({})

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(`/api/pm/activity?page=${page}&limit=30`)
      setLogs(res.data); setPagination(res.pagination || {})
    } catch (e) { showToast({ message: e.message, type: 'error' }) }
    finally { setLoading(false) }
  }, [page])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  return (
    <PMLayout title="Nhật ký thao tác">
      <div className="max-w-3xl">
        <div className="bg-white border border-[#ebebeb] rounded-xl overflow-hidden">
          {loading
            ? <div className="divide-y divide-[#f5f5f4]">{Array.from({length:10}).map((_,i) => (
                <div key={i} className="flex gap-3 px-5 py-4 animate-pulse">
                  <div className="w-9 h-9 bg-[#f0f0f0] rounded-xl shrink-0"/>
                  <div className="flex-1 space-y-2 pt-1"><div className="h-3 bg-[#f0f0f0] rounded w-2/3"/><div className="h-2.5 bg-[#f0f0f0] rounded w-1/3"/></div>
                </div>
              ))}</div>
            : logs.length === 0
              ? <div className="py-16 text-center"><p className="text-[13px] font-semibold text-[#0f0f0f]">Chưa có hoạt động</p></div>
              : <ul className="divide-y divide-[#f5f5f4]">
                  {logs.map((l,i) => {
                    const cfg = ACTION_CFG[l.action] || { icon:'🔧', label:l.action, color:'bg-gray-50 text-gray-600' }
                    return (
                      <li key={l._id||i} className="flex items-start gap-3.5 px-5 py-4 hover:bg-[#fafafa] transition-colors">
                        <span className={`text-base p-2 rounded-xl shrink-0 ${cfg.color}`}>{cfg.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[12.5px] text-[#0f0f0f] leading-snug">{l.description}</p>
                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${cfg.color}`}>{cfg.label}</span>
                          </div>
                          <p className="text-[11px] text-[#a3a3a3] mt-1">{l.performedBy?.name} · {new Date(l.createdAt).toLocaleString('vi-VN', { hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit', year:'numeric' })}</p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
          }
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-[#f0f0f0]">
              <p className="text-[11px] text-[#a3a3a3]">Trang {pagination.page}/{pagination.totalPages} · {pagination.total} thao tác</p>
              <div className="flex gap-1.5">
                <button disabled={page<=1} onClick={() => setPage(p=>p-1)} className="px-3 py-1.5 text-[11px] border border-[#e5e5e5] rounded-lg disabled:opacity-40 hover:border-[#0f0f0f] transition-colors">← Trước</button>
                <button disabled={page>=pagination.totalPages} onClick={() => setPage(p=>p+1)} className="px-3 py-1.5 text-[11px] border border-[#e5e5e5] rounded-lg disabled:opacity-40 hover:border-[#0f0f0f] transition-colors">Tiếp →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PMLayout>
  )
}
