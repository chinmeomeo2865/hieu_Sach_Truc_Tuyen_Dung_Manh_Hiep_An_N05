import { useEffect, useState, useCallback, useMemo } from 'react'
import PMLayout from '../../components/pm/PMLayout'
import { api } from '../../services/api'
import { useToastStore } from '../../store/toastStore'

/* ─── Icons ──────────────────────────────────────────────── */
const ICON_PATHS = {
  book: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />,
  tag: <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />,
  folder: <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />,
  eye: (
    <>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </>
  ),
  pencil: <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />,
  trash: <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />,
  stop: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M5.636 5.636l12.728 12.728" />
    </>
  ),
  layers: <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
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

/* ─── Action config — đồng bộ với PMDashboard ───────────────── */
const ACTION_CFG = {
  create_category:   { icon: 'folder', label: 'Thêm danh mục',  badge: 'bg-sky-50 text-sky-700 border border-sky-200/50' },
  update_category:   { icon: 'pencil', label: 'Sửa danh mục',   badge: 'bg-sky-50 text-sky-700 border border-sky-200/50' },
  delete_category:   { icon: 'trash',  label: 'Xóa danh mục',   badge: 'bg-red-50 text-red-600 border border-red-200/50' },
  create_promotion:  { icon: 'tag',    label: 'Tạo KM',          badge: 'bg-violet-50 text-violet-700 border border-violet-200/50' },
  end_promotion:     { icon: 'stop',   label: 'Kết thúc KM',     badge: 'bg-orange-50 text-orange-700 border border-orange-200/50' },
  toggle_visibility: { icon: 'eye',    label: 'Đổi hiển thị',    badge: 'bg-amber-50 text-amber-700 border border-amber-200/50' },
  create_product:    { icon: 'book',   label: 'Thêm sách',       badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' },
  update_product:    { icon: 'pencil', label: 'Sửa sách',        badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' },
  delete_product:    { icon: 'trash',  label: 'Xóa sách',        badge: 'bg-red-50 text-red-600 border border-red-200/50' },
}
const FALLBACK_CFG = { icon: 'pencil', label: 'Khác', badge: 'bg-gray-50 text-gray-500 border border-gray-200/50' }

const ROLE_LABELS = { admin: 'Admin', product_manager: 'PM', warehouse: 'Kho', customer: 'Khách' }

const ENTITY_FILTERS = [
  { key: '',          label: 'Tất cả',     icon: 'layers' },
  { key: 'category',  label: 'Danh mục',   icon: 'folder' },
  { key: 'product',   label: 'Sản phẩm',   icon: 'book' },
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

/* ─── Chi tiết ghi chú / lý do từ metadata (đồng bộ với Kho) ── */
function LogMeta({ metadata }) {
  const m = metadata || {}
  const note   = m.notes
  const reason = m.reason
  const adjustments = Array.isArray(m.adjustments) ? m.adjustments : []
  if (!note && !reason && !adjustments.length) return null

  return (
    <div className="mt-2 rounded-lg border border-[#EAE6DF] bg-[#FAF8F5] px-3 py-2 space-y-1">
      {reason && (
        <p className="text-[11px] text-[#615C56]"><span className="font-semibold text-[#8E877F]">Lý do:</span> {reason}</p>
      )}
      {note && (
        <p className="text-[11px] text-[#615C56]"><span className="font-semibold text-[#8E877F]">Ghi chú:</span> {note}</p>
      )}
      {adjustments.length > 0 && (
        <ul className="space-y-1 pt-0.5">
          {adjustments.map((a, i) => (
            <li key={i} className="text-[11px] flex items-start gap-1.5">
              <span className={`font-bold shrink-0 font-display ${a.diff < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{a.diff > 0 ? '+' : ''}{a.diff}</span>
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
export default function PMActivityPage() {
  const showToast = useToastStore(s => s.show)
  const [logs,         setLogs]         = useState([])
  const [loading,      setLoading]      = useState(true)
  const [page,         setPage]         = useState(1)
  const [pagination,   setPagination]   = useState({})
  const [stats,        setStats]        = useState({ total: 0, today: 0, byEntity: {} })
  const [entityFilter, setEntityFilter] = useState('')
  const [search,       setSearch]       = useState('')
  const [datePreset,      setDatePreset]      = useState('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate,   setCustomEndDate]   = useState('')

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (entityFilter) params.set('entity', entityFilter)

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

      const res = await api.get(`/api/pm/activity?${params}`)
      setLogs(res.data)
      setPagination(res.pagination || {})
      setStats(res.stats || { total: 0, today: 0, byEntity: {} })
    } catch (e) { showToast({ message: e.message, type: 'error' }) }
    finally { setLoading(false) }
  }, [page, entityFilter, datePreset, customStartDate, customEndDate])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  function handleFilter(key) {
    setEntityFilter(key)
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
      l.metadata?.reason?.toLowerCase().includes(q)
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
    <PMLayout title="Nhật ký hoạt động">
      {/* Header */}
      <div className="border-b border-[#EAE6DF] pb-3 mb-5">
        <h2 className="font-display text-[14.5px] font-bold text-[#1A1A1A] uppercase tracking-wider">Nhật ký hoạt động</h2>
        <p className="text-[11px] text-[#9B9389] mt-0.5">Theo dõi lịch sử thao tác quản lý sản phẩm, danh mục và khuyến mãi</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Sidebar */}
        <aside className="lg:w-60 shrink-0 space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
            <StatBox icon="layers" label="Tổng hoạt động" value={stats.total} />
            <StatBox icon="clock" label="Hôm nay" value={stats.today} accent={stats.today > 0 ? 'text-[#2E4A3F]' : undefined} />
          </div>

          <div className="bg-white border border-[#EAE6DF] rounded-lg shadow-sm overflow-hidden">
            <p className="px-4 pt-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#8E877F]">Lọc theo loại</p>
            <div className="pb-2">
              {ENTITY_FILTERS.map(f => {
                const count = f.key ? (stats.byEntity[f.key] || 0) : stats.total
                const active = entityFilter === f.key
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
                    <p className="text-[11px] text-[#9B9389] mt-1">Các thao tác quản lý sẽ được ghi lại tại đây</p>
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
    </PMLayout>
  )
}
