import { useEffect, useState, useCallback, useMemo } from 'react'
import WarehouseLayout from '../../components/warehouse/WarehouseLayout'
import { api } from '../../services/api'
import { useToastStore } from '../../store/toastStore'

/* ─── Icons ──────────────────────────────────────────────── */
const ICON_PATHS = {
  grid:      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />,
  clipboard: <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
  undo:      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />,
  layers:    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />,
  check:     <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
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

/* ─── Action config — đồng bộ với WarehouseDashboard ────────── */
const ACTION_CFG = {
  import_stock:        { icon: 'layers',    label: 'Nhập kho',     badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' },
  export_stock:        { icon: 'layers',    label: 'Xuất kho',     badge: 'bg-red-50 text-red-600 border border-red-200/50' },
  update_order_status: { icon: 'clipboard', label: 'Cập nhật đơn', badge: 'bg-sky-50 text-sky-700 border border-sky-200/50' },
  process_return:      { icon: 'undo',      label: 'Hoàn trả',     badge: 'bg-orange-50 text-orange-700 border border-orange-200/50' },
  submit_audit:        { icon: 'check',     label: 'Kiểm kê',      badge: 'bg-violet-50 text-violet-700 border border-violet-200/50' },
}
const FALLBACK_CFG = { icon: 'clipboard', label: 'Khác', badge: 'bg-gray-50 text-gray-500 border border-gray-200/50' }

const ROLE_LABELS = { admin: 'Admin', product_manager: 'PM', warehouse: 'Kho', customer: 'Khách' }

const ACTION_FILTERS = [
  { key: '',                    label: 'Tất cả',       icon: 'grid' },
  { key: 'import_stock',        label: 'Nhập kho',     icon: 'layers' },
  { key: 'export_stock',        label: 'Xuất kho',     icon: 'layers' },
  { key: 'update_order_status', label: 'Cập nhật đơn', icon: 'clipboard' },
  { key: 'process_return',      label: 'Hoàn trả',     icon: 'undo' },
  { key: 'submit_audit',        label: 'Kiểm kê',      icon: 'check' },
]

function dateLabel(dateStr) {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const sameDay = (a, b) => a.toDateString() === b.toDateString()
  if (sameDay(d, today)) return 'Hôm nay'
  if (sameDay(d, yesterday)) return 'Hôm qua'
  return d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
}

/* ─── Chi tiết ghi chú / lý do từ metadata ──────────────────── */
function LogMeta({ metadata }) {
  const m = metadata || {}
  const note   = m.notes
  const reason = m.reason
  const adjustments = Array.isArray(m.adjustments) ? m.adjustments : []
  if (!note && !reason && !adjustments.length) return null

  return (
    <div className="mt-2 rounded-lg border border-[#EAE6DF] bg-[#FAF8F5] px-3 py-2 space-y-1">
      {reason && (
        <p className="text-[11px] text-[#615C56]">
          <span className="font-semibold text-[#8E877F]">Lý do:</span> {reason}
        </p>
      )}
      {note && (
        <p className="text-[11px] text-[#615C56]">
          <span className="font-semibold text-[#8E877F]">Ghi chú:</span> {note}
        </p>
      )}
      {adjustments.length > 0 && (
        <ul className="space-y-1 pt-0.5">
          {adjustments.map((a, i) => (
            <li key={i} className="text-[11px] flex items-start gap-1.5">
              <span className={`font-bold shrink-0 font-display ${a.diff < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {a.diff > 0 ? '+' : ''}{a.diff}
              </span>
              <span className="min-w-0 text-[#615C56]">
                <span className="text-[#1A1A1A] font-medium">{a.title}</span>
                {a.reason && <span className="text-[#9B9389]"> — {a.reason}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ─── Sidebar stat box ───────────────────────────────────────── */
function StatBox({ icon, label, value, accent }) {
  return (
    <div className="bg-white rounded-lg border border-[#EAE6DF] p-3.5 shadow-sm">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[9px] font-bold tracking-wider text-[#8E877F] uppercase">{label}</p>
        <span className="text-[#9B9389]"><Icon name={icon} className="w-3.5 h-3.5" /></span>
      </div>
      <p className={`font-display text-[20px] font-bold ${accent || 'text-[#1A1A1A]'}`}>{value}</p>
    </div>
  )
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function WarehouseActivityPage() {
  const showToast = useToastStore(s => s.show)
  const [logs,         setLogs]         = useState([])
  const [loading,      setLoading]      = useState(true)
  const [page,         setPage]         = useState(1)
  const [pagination,   setPagination]   = useState({})
  const [stats,        setStats]        = useState({ total: 0, today: 0, byAction: {} })
  const [actionFilter, setActionFilter] = useState('')
  const [search,       setSearch]       = useState('')
  const [datePreset,      setDatePreset]      = useState('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate,   setCustomEndDate]   = useState('')

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (actionFilter) params.set('action', actionFilter)

      if (datePreset !== 'all') {
        if (datePreset === 'custom') {
          if (customStartDate) {
            const s = new Date(customStartDate + 'T00:00:00')
            if (!isNaN(s.getTime())) params.set('startDate', s.toISOString())
          }
          if (customEndDate) {
            const e = new Date(customEndDate + 'T23:59:59.999')
            if (!isNaN(e.getTime())) params.set('endDate', e.toISOString())
          }
        } else {
          const now = new Date()
          let startDaysAgo = 0
          let endDaysAgo = 0

          if (datePreset === 'today') {
            startDaysAgo = 0
            endDaysAgo = 0
          } else if (datePreset === 'yesterday') {
            startDaysAgo = 1
            endDaysAgo = 1
          } else if (datePreset === '7days') {
            startDaysAgo = 6
            endDaysAgo = 0
          } else if (datePreset === '30days') {
            startDaysAgo = 29
            endDaysAgo = 0
          }

          const s = new Date()
          s.setDate(now.getDate() - startDaysAgo)
          s.setHours(0, 0, 0, 0)

          const e = new Date()
          e.setDate(now.getDate() - endDaysAgo)
          e.setHours(23, 59, 59, 999)

          params.set('startDate', s.toISOString())
          params.set('endDate', e.toISOString())
        }
      }

      const res = await api.get(`/api/warehouse/activity?${params}`)
      setLogs(res.data)
      setPagination(res.pagination || {})
      setStats(res.stats || { total: 0, today: 0, byAction: {} })
    } catch (e) { showToast({ message: e.message, type: 'error' }) }
    finally { setLoading(false) }
  }, [page, actionFilter, datePreset, customStartDate, customEndDate])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  function handleFilter(key) {
    setActionFilter(key)
    setPage(1)
  }

  function handleDatePresetChange(val) {
    setDatePreset(val)
    if (val !== 'custom') {
      setCustomStartDate('')
      setCustomEndDate('')
    }
    setPage(1)
  }

  function handleCustomDateChange(type, val) {
    if (type === 'start') {
      setCustomStartDate(val)
    } else {
      setCustomEndDate(val)
    }
    setPage(1)
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return logs
    const q = search.trim().toLowerCase()
    return logs.filter(l =>
      l.description?.toLowerCase().includes(q) ||
      l.performedBy?.name?.toLowerCase().includes(q) ||
      l.metadata?.notes?.toLowerCase().includes(q) ||
      l.metadata?.reason?.toLowerCase().includes(q) ||
      l.metadata?.adjustments?.some(a => a.reason?.toLowerCase().includes(q))
    )
  }, [logs, search])

  const groups = useMemo(() => {
    const out = []
    filtered.forEach(l => {
      const label = dateLabel(l.createdAt)
      let g = out[out.length - 1]
      if (!g || g.label !== label) { g = { label, items: [] }; out.push(g) }
      g.items.push(l)
    })
    return out
  }, [filtered])

  return (
    <WarehouseLayout title="Nhật ký thao tác">
      {/* Header */}
      <div className="border-b border-[#EAE6DF] pb-3 mb-5">
        <h2 className="font-display text-[14.5px] font-bold text-[#1A1A1A] uppercase tracking-wider">Nhật ký thao tác</h2>
        <p className="text-[11px] text-[#9B9389] mt-0.5">Theo dõi lịch sử nhập kho, xử lý đơn, hoàn trả và kiểm kê</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Sidebar */}
        <aside className="lg:w-60 shrink-0 space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
            <StatBox icon="grid" label="Tổng hoạt động" value={stats.total} />
            <StatBox icon="clock" label="Hôm nay" value={stats.today} accent={stats.today > 0 ? 'text-[#2E4A3F]' : undefined} />
          </div>

          <div className="bg-white border border-[#EAE6DF] rounded-lg shadow-sm overflow-hidden">
            <p className="px-4 pt-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#8E877F]">Lọc theo loại</p>
            <div className="pb-2">
              {ACTION_FILTERS.map(f => {
                const count = f.key ? (stats.byAction[f.key] || 0) : stats.total
                const active = actionFilter === f.key
                return (
                  <button key={f.key} onClick={() => handleFilter(f.key)}
                    className={`w-full flex items-center justify-between gap-2 px-4 py-2 text-[12px] font-medium transition-colors ${active ? 'bg-[#1A1A1A] text-white' : 'text-[#615C56] hover:bg-[#FAF8F5]'}`}>
                    <span className="flex items-center gap-2"><Icon name={f.icon} /> {f.label}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${active ? 'bg-white/15 text-white' : 'bg-[#FAF8F5] text-[#9B9389]'}`}>{count}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </aside>

        {/* Timeline */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9B9389]" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo nội dung, người thực hiện…"
                className="w-full pl-9 pr-3 py-2.5 border border-[#EAE6DF] rounded-lg text-[12.5px] bg-white placeholder:text-[#9B9389] focus:outline-none focus:border-[#1A1A1A] transition-colors"/>
            </div>

            {/* Date Filter Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <select 
                  value={datePreset} 
                  onChange={e => handleDatePresetChange(e.target.value)}
                  className="pl-3 pr-8 py-2.5 border border-[#EAE6DF] rounded-lg text-[12.5px] bg-white text-[#615C56] focus:outline-none focus:border-[#1A1A1A] transition-colors cursor-pointer appearance-none font-medium"
                  style={{ 
                    backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%238E877F' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`, 
                    backgroundPosition: 'right 0.5rem center', 
                    backgroundSize: '1.25rem', 
                    backgroundRepeat: 'no-repeat' 
                  }}
                >
                  <option value="all">Tất cả thời gian</option>
                  <option value="today">Hôm nay</option>
                  <option value="yesterday">Hôm qua</option>
                  <option value="7days">7 ngày qua</option>
                  <option value="30days">30 ngày qua</option>
                  <option value="custom">Tùy chọn khoảng ngày...</option>
                </select>
              </div>

              {datePreset === 'custom' && (
                <div className="flex items-center gap-1.5 animate-fadeIn">
                  <input 
                    type="date" 
                    value={customStartDate} 
                    onChange={e => handleCustomDateChange('start', e.target.value)}
                    className="px-2.5 py-1.5 border border-[#EAE6DF] rounded-lg text-[12px] bg-white text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition-colors font-medium cursor-pointer"
                  />
                  <span className="text-[11px] text-[#9B9389] font-medium">đến</span>
                  <input 
                    type="date" 
                    value={customEndDate} 
                    onChange={e => handleCustomDateChange('end', e.target.value)}
                    className="px-2.5 py-1.5 border border-[#EAE6DF] rounded-lg text-[12px] bg-white text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A] transition-colors font-medium cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-[#EAE6DF] rounded-xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-6 space-y-6">
                {Array.from({ length: 2 }).map((_, gi) => (
                  <div key={gi}>
                    <div className="h-2.5 bg-[#F2EFEA] rounded w-20 mb-4 animate-pulse" />
                    <div className="space-y-5">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex gap-3 animate-pulse">
                          <div className="w-8 h-8 bg-[#F2EFEA] rounded-full shrink-0" />
                          <div className="flex-1 space-y-2 pt-1">
                            <div className="h-3 bg-[#F2EFEA] rounded w-2/3" />
                            <div className="h-2.5 bg-[#F2EFEA] rounded w-1/3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : groups.length === 0 ? (
              <div className="py-16 text-center">
                {logs.length === 0 ? (
                  <>
                    <p className="font-display text-[13px] font-bold text-[#1A1A1A]">Chưa có hoạt động nào</p>
                    <p className="text-[11px] text-[#9B9389] mt-1">Các thao tác kho sẽ được ghi lại tại đây</p>
                  </>
                ) : (
                  <>
                    <p className="font-display text-[13px] font-bold text-[#1A1A1A]">Không tìm thấy hoạt động phù hợp</p>
                    <button onClick={() => setSearch('')} className="text-[11px] text-[#615C56] hover:text-[#1A1A1A] underline mt-1.5">Xóa bộ lọc tìm kiếm</button>
                  </>
                )}
              </div>
            ) : (
              <div className="p-5 sm:p-6">
                {groups.map((g, gi) => (
                  <div key={g.label + gi} className={gi > 0 ? 'mt-7' : ''}>
                    <div className="flex items-center gap-3 mb-4">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#8E877F] shrink-0">{g.label}</p>
                      <div className="flex-1 h-px bg-[#EAE6DF]" />
                    </div>
                    {g.items.map((l, i) => {
                      const cfg = ACTION_CFG[l.action] || FALLBACK_CFG
                      const isLast = i === g.items.length - 1
                      return (
                        <div key={l._id || i} className="relative pl-10 pb-5 last:pb-0">
                          {!isLast && <div className="absolute left-[15px] top-8 bottom-0 w-px bg-[#EAE6DF]" />}
                          <div className={`absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center ${cfg.badge}`}>
                            <Icon name={cfg.icon} className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex items-start justify-between gap-3 pt-1">
                            <div className="min-w-0">
                              <p className="text-[12.5px] text-[#1A1A1A] font-medium leading-snug">{l.description}</p>
                              <LogMeta metadata={l.metadata} />
                              <p className="text-[11px] text-[#9B9389] mt-1 flex items-center flex-wrap gap-1.5">
                                <span className="font-medium text-[#615C56]">{l.performedBy?.name || 'Hệ thống'}</span>
                                {l.performedBy?.role && (
                                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-[#FAF8F5] border border-[#EAE6DF] text-[#9B9389]">
                                    {ROLE_LABELS[l.performedBy.role] || l.performedBy.role}
                                  </span>
                                )}
                                <span>·</span>
                                <span>{new Date(l.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                              </p>
                            </div>
                            <span className={`shrink-0 text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded ${cfg.badge}`}>{cfg.label}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#EAE6DF] bg-[#FAF8F5]">
                <p className="text-[11px] text-[#9B9389]">Trang {pagination.page}/{pagination.totalPages} · {pagination.total} hoạt động</p>
                <div className="flex gap-1.5">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1.5 text-[11px] font-medium border border-[#EAE6DF] rounded-lg disabled:opacity-40 hover:border-[#1A1A1A] hover:text-[#1A1A1A] text-[#615C56] transition-colors">← Trước</button>
                  <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1.5 text-[11px] font-medium border border-[#EAE6DF] rounded-lg disabled:opacity-40 hover:border-[#1A1A1A] hover:text-[#1A1A1A] text-[#615C56] transition-colors">Tiếp →</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </WarehouseLayout>
  )
}
