import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence }                   from 'framer-motion'
import AdminLayout  from '../../components/admin/AdminLayout'
import ConfirmModal from '../../components/admin/ui/ConfirmModal'
import { api }      from '../../services/api'
import { useToastStore } from '../../store/toastStore'
import { formatPrice }   from '../../utils/format'

const STATUS_CFG = {
  PENDING:   { label: 'Chờ xác nhận', color: 'bg-amber-50 text-amber-700'    },
  CONFIRMED: { label: 'Đã xác nhận',  color: 'bg-sky-50 text-sky-700'        },
  PACKING:   { label: 'Đóng gói',     color: 'bg-violet-50 text-violet-700'  },
  SHIPPING:  { label: 'Đang giao',    color: 'bg-orange-50 text-orange-700'  },
  DELIVERED: { label: 'Đã giao',      color: 'bg-emerald-50 text-emerald-700'},
  CANCELLED: { label: 'Đã hủy',       color: 'bg-red-50 text-red-600'       },
  RETURNED:  { label: 'Hoàn trả',     color: 'bg-gray-50 text-gray-500'     },
}

/* ── helpers ──────────────────────────────────────────────── */

function normalizeStr(s = '') {
  return s.toLowerCase().replace(/[đĐ]/g, 'd').normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function Highlight({ text = '', query = '' }) {
  if (!query.trim()) return <>{text}</>
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex   = new RegExp(`(${escaped})`, 'gi')
  const parts   = text.split(regex)
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part)
          ? <span key={i} className="bg-yellow-100 text-[#0f0f0f] font-semibold rounded-sm px-px">{part}</span>
          : <span key={i}>{part}</span>
      )}
    </>
  )
}

/* ── skeleton ─────────────────────────────────────────────── */

function SkeletonRow() {
  return (
    <tr className="border-t border-[#f0f0f0] animate-pulse">
      {[32, 160, 180, 70, 90, 90].map((w, i) => (
        <td key={i} className="px-4 py-3.5">
          <div className="h-3.5 bg-[#f0f0f0] rounded-full" style={{ width: w }} />
        </td>
      ))}
    </tr>
  )
}

/* ── customer detail drawer ───────────────────────────────── */

function CustomerDetail({ uid, onClose, onToggle }) {
  const showToast = useToastStore(s => s.show)
  const [data,     setData]     = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [confirm,  setConfirm]  = useState(false)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get(`/api/users/${uid}`)
      .then(r => setData(r.data))
      .catch(err => showToast({ message: err.message, type: 'error' }))
      .finally(() => setLoading(false))
  }, [uid])

  async function handleToggle() {
    setToggling(true)
    try {
      await api.put(`/api/users/${uid}/status`)
      showToast({ message: data.active !== false ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản', type: 'info' })
      setConfirm(false)
      onToggle()
    } catch (err) { showToast({ message: err.message, type: 'error' }) }
    finally { setToggling(false) }
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed right-0 top-0 h-full w-[480px] bg-white z-50 shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f0f0] flex-shrink-0">
          <p className="text-[14px] font-semibold text-[#0f0f0f]">Hồ sơ khách hàng</p>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f5f5f4] text-[#a3a3a3] hover:text-[#0f0f0f] transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-6 space-y-4 animate-pulse">
              <div className="flex gap-4"><div className="w-14 h-14 rounded-full bg-[#f0f0f0]" /><div className="flex-1 space-y-2 pt-2"><div className="h-4 bg-[#f0f0f0] rounded-full w-2/3" /><div className="h-3 bg-[#f0f0f0] rounded-full w-1/2" /></div></div>
              {[1,2,3].map(i => <div key={i} className="h-16 bg-[#f0f0f0] rounded-xl" />)}
            </div>
          ) : data && (
            <div className="p-6 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-[#0f0f0f] text-white flex items-center justify-center text-xl font-bold flex-shrink-0">
                  {data.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[16px] font-semibold text-[#0f0f0f]">{data.name}</p>
                  <p className="text-[12px] text-[#737373] mt-0.5">{data.email}</p>
                  {data.phone && <p className="text-[12px] text-[#737373]">{data.phone}</p>}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${data.active !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${data.active !== false ? 'bg-emerald-500' : 'bg-red-400'}`} />
                      {data.active !== false ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                    <span className="text-[11px] text-[#a3a3a3]">
                      Tham gia {new Date(data.createdAt).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Tổng đơn', value: data.orderCount || 0 },
                  { label: 'Đã giao',  value: data.orders?.filter(o => o.status === 'DELIVERED').length || 0 },
                  { label: 'Chi tiêu', value: formatPrice(data.orderTotal || 0) },
                ].map(s => (
                  <div key={s.label} className="bg-[#fafafa] rounded-xl p-3 text-center border border-[#f0f0f0]">
                    <p className="text-[15px] font-bold text-[#0f0f0f] leading-none truncate">{s.value}</p>
                    <p className="text-[10px] text-[#a3a3a3] mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#a3a3a3] mb-3">
                  Đơn hàng gần đây ({data.orders?.length || 0})
                </p>
                {!data.orders?.length ? (
                  <p className="text-[13px] text-[#a3a3a3] text-center py-8">Chưa có đơn hàng</p>
                ) : (
                  <div className="space-y-2">
                    {data.orders.slice(0, 10).map(o => {
                      const sc = STATUS_CFG[o.status] || STATUS_CFG.PENDING
                      return (
                        <div key={o._id} className="flex items-center justify-between p-3 border border-[#f0f0f0] rounded-xl hover:bg-[#fafafa] transition-colors">
                          <div>
                            <p className="text-[12px] font-semibold text-[#0f0f0f]">{o.orderCode || `#${o._id.slice(-8).toUpperCase()}`}</p>
                            <p className="text-[11px] text-[#a3a3a3] mt-0.5">
                              {o.items?.length} sp · {new Date(o.createdAt).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[12px] font-semibold text-[#0f0f0f]">{formatPrice(o.total)}</p>
                            <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${sc.color}`}>{sc.label}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {data && (
          <div className="px-6 py-4 border-t border-[#f0f0f0] flex-shrink-0">
            <button onClick={() => setConfirm(true)}
              className={`w-full py-2.5 rounded-xl text-[13px] font-semibold border transition-colors ${
                data.active !== false ? 'border-red-200 text-red-500 hover:bg-red-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
              }`}>
              {data.active !== false ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
            </button>
          </div>
        )}
      </motion.div>

      <ConfirmModal
        open={confirm}
        title={data?.active !== false ? 'Khóa tài khoản?' : 'Mở khóa tài khoản?'}
        message={data?.active !== false
          ? `Khách hàng ${data?.name} sẽ không thể đăng nhập.`
          : `Tài khoản ${data?.name} sẽ được mở khóa.`}
        confirmLabel={data?.active !== false ? 'Khóa' : 'Mở khóa'}
        confirmClass={data?.active !== false ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}
        loading={toggling}
        onConfirm={handleToggle}
        onCancel={() => setConfirm(false)}
      />
    </>
  )
}

/* ── main page ────────────────────────────────────────────── */

export default function AdminUsersPage() {
  const showToast = useToastStore(s => s.show)

  // table state
  const [users,       setUsers]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [activeQuery, setActiveQuery] = useState('')
  const [page,        setPage]        = useState(1)
  const [pagination,  setPagination]  = useState({})
  const [selectedUid, setSelectedUid] = useState(null)

  // search dropdown state
  const [inputVal,      setInputVal]      = useState('')
  const [suggestions,   setSuggestions]   = useState([])
  const [suggestLoad,   setSuggestLoad]   = useState(false)
  const [dropOpen,      setDropOpen]      = useState(false)
  const [hiIdx,         setHiIdx]         = useState(-1)

  const searchRef = useRef(null)

  /* fetch main table */
  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, limit: 20 })
      if (activeQuery) params.set('search', activeQuery)
      const res = await api.get(`/api/users?${params}`)
      setUsers(res.data)
      setPagination(res.pagination || {})
    } catch (err) { showToast({ message: err.message, type: 'error' }) }
    finally { setLoading(false) }
  }, [page, activeQuery])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  /* debounce suggestions */
  useEffect(() => {
    if (!inputVal.trim()) {
      setSuggestions([])
      setDropOpen(false)
      return
    }
    const t = setTimeout(async () => {
      setSuggestLoad(true)
      try {
        const res = await api.get(`/api/users?search=${encodeURIComponent(inputVal.trim())}&limit=8&page=1`)
        setSuggestions(res.data)
        setDropOpen(true)
        setHiIdx(-1)
      } catch {}
      finally { setSuggestLoad(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [inputVal])

  /* click outside → close dropdown */
  useEffect(() => {
    function onClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setDropOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function commitSearch() {
    setActiveQuery(inputVal.trim())
    setPage(1)
    setDropOpen(false)
  }

  function clearSearch() {
    setInputVal('')
    setActiveQuery('')
    setPage(1)
    setSuggestions([])
    setDropOpen(false)
  }

  function handleKeyDown(e) {
    if (!dropOpen || !suggestions.length) {
      if (e.key === 'Enter') { e.preventDefault(); commitSearch() }
      return
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHiIdx(i => Math.min(i + 1, suggestions.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHiIdx(i => Math.max(i - 1, -1)) }
    else if (e.key === 'Enter') {
      e.preventDefault()
      if (hiIdx >= 0 && suggestions[hiIdx]) {
        setSelectedUid(suggestions[hiIdx]._id)
        setDropOpen(false)
      } else {
        commitSearch()
      }
    } else if (e.key === 'Escape') {
      setDropOpen(false)
    }
  }

  const fmtDate = d => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <AdminLayout title="Khách hàng">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-[18px] font-semibold text-[#0f0f0f] tracking-tight">Khách hàng</h2>
          <p className="text-[12px] text-[#a3a3a3] mt-0.5">{pagination.total || 0} khách hàng đã đăng ký</p>
        </div>
      </div>

      {/* ── Search bar ── */}
      <div ref={searchRef} className="relative mb-5">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            {/* search icon or spinner */}
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {suggestLoad
                ? <svg className="w-4 h-4 text-[#a3a3a3] animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                : <svg className="w-4 h-4 text-[#a3a3a3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
                  </svg>
              }
            </div>

            <input
              type="text"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => suggestions.length && setDropOpen(true)}
              placeholder="Tìm tên, email, số điện thoại…"
              className="w-full pl-9 pr-8 py-2.5 border border-[#e5e5e5] rounded-lg text-[13px] placeholder:text-[#c4c4c4] focus:outline-none focus:border-[#0f0f0f] transition-colors"
            />

            {inputVal && (
              <button onClick={clearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-[#a3a3a3] hover:text-[#0f0f0f] transition-colors rounded-full hover:bg-[#f0f0f0]">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <button onClick={commitSearch}
            className="px-4 py-2.5 bg-[#0f0f0f] text-white text-[12px] font-semibold rounded-lg hover:bg-[#292929] transition-colors whitespace-nowrap">
            Tìm kiếm
          </button>
        </div>

        {/* ── Dropdown suggestions ── */}
        <AnimatePresence>
          {dropOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 top-[calc(100%+6px)] bg-white border border-[#e5e5e5] rounded-xl shadow-lg z-30 overflow-hidden"
            >
              {suggestions.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <svg className="w-8 h-8 text-[#d4d4d4] mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-[13px] text-[#737373] font-medium">Không tìm thấy khách hàng</p>
                  <p className="text-[11px] text-[#a3a3a3] mt-0.5">Thử từ khóa khác</p>
                </div>
              ) : (
                <>
                  <div className="px-3 pt-2.5 pb-1.5 border-b border-[#f5f5f4]">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#a3a3a3]">
                      {suggestions.length} kết quả
                    </p>
                  </div>
                  <ul>
                    {suggestions.map((u, i) => (
                      <li key={u._id}>
                        <button
                          onMouseEnter={() => setHiIdx(i)}
                          onClick={() => { setSelectedUid(u._id); setDropOpen(false) }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${hiIdx === i ? 'bg-[#f5f5f4]' : 'hover:bg-[#fafafa]'}`}
                        >
                          <div className="w-8 h-8 rounded-full bg-[#0f0f0f] text-white text-[12px] font-bold flex items-center justify-center flex-shrink-0">
                            {u.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-[#0f0f0f] leading-tight truncate">
                              <Highlight text={u.name} query={inputVal} />
                            </p>
                            <p className="text-[11px] text-[#a3a3a3] truncate mt-0.5">
                              <Highlight text={u.email} query={inputVal} />
                              {u.phone && <> · <Highlight text={u.phone} query={inputVal} /></>}
                            </p>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <p className="text-[11px] font-semibold text-[#0f0f0f]">{u.orderCount} đơn</p>
                            <span className={`text-[10px] font-medium ${u.active !== false ? 'text-emerald-600' : 'text-red-500'}`}>
                              {u.active !== false ? '● Active' : '● Khóa'}
                            </span>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="px-3 py-2 border-t border-[#f5f5f4]">
                    <button onClick={commitSearch}
                      className="text-[11px] text-[#737373] hover:text-[#0f0f0f] transition-colors">
                      Xem tất cả kết quả cho "<span className="font-semibold">{inputVal}</span>" →
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* active filter chip */}
      {activeQuery && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[12px] text-[#737373]">Đang lọc:</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#0f0f0f] text-white rounded-full text-[11px] font-semibold">
            "{activeQuery}"
            <button onClick={clearSearch} className="opacity-70 hover:opacity-100 transition-opacity">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-[#e5e5e5] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#fafafa]">
              {['Khách hàng', 'Email', 'Số điện thoại', 'Đơn hàng', 'Tổng chi tiêu', 'Tham gia'].map((h, i) => (
                <th key={i} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[#a3a3a3] border-b border-[#f0f0f0]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              : users.length === 0
                ? (
                  <tr><td colSpan={6} className="py-20 text-center">
                    <svg className="w-10 h-10 text-[#d4d4d4] mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-[14px] font-semibold text-[#0f0f0f]">Không tìm thấy khách hàng</p>
                    <p className="text-[12px] text-[#a3a3a3] mt-1">{activeQuery ? `Không có kết quả cho "${activeQuery}"` : 'Chưa có khách hàng'}</p>
                    {activeQuery && (
                      <button onClick={clearSearch} className="mt-3 text-[12px] text-[#0f0f0f] underline underline-offset-2">Xóa bộ lọc</button>
                    )}
                  </td></tr>
                )
                : users.map(u => (
                  <tr key={u._id} onClick={() => setSelectedUid(u._id)}
                    className="border-t border-[#f5f5f4] hover:bg-[#fafafa] transition-colors cursor-pointer">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#f0f0f0] text-[#525252] flex items-center justify-center text-[12px] font-bold flex-shrink-0">
                          {u.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-[#0f0f0f]">
                            <Highlight text={u.name} query={activeQuery} />
                          </p>
                          <span className={`text-[10px] font-medium ${u.active !== false ? 'text-emerald-600' : 'text-red-500'}`}>
                            {u.active !== false ? '● Hoạt động' : '● Đã khóa'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[12px] text-[#525252]">
                      <Highlight text={u.email} query={activeQuery} />
                    </td>
                    <td className="px-4 py-3.5 text-[12px] text-[#737373]">
                      {u.phone ? <Highlight text={u.phone} query={activeQuery} /> : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-[13px] font-semibold text-[#0f0f0f]">{u.orderCount}</td>
                    <td className="px-4 py-3.5 text-[13px] font-semibold text-[#0f0f0f]">{formatPrice(u.orderTotal)}</td>
                    <td className="px-4 py-3.5 text-[12px] text-[#a3a3a3]">{fmtDate(u.createdAt)}</td>
                  </tr>
                ))
            }
          </tbody>
        </table>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#f0f0f0]">
            <p className="text-[12px] text-[#a3a3a3]">Trang {pagination.page} / {pagination.totalPages}</p>
            <div className="flex gap-1.5">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-[12px] border border-[#e5e5e5] rounded-lg disabled:opacity-40 hover:border-[#0f0f0f] transition-colors">← Trước</button>
              <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-[12px] border border-[#e5e5e5] rounded-lg disabled:opacity-40 hover:border-[#0f0f0f] transition-colors">Tiếp →</button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedUid && (
          <CustomerDetail key={selectedUid} uid={selectedUid}
            onClose={() => setSelectedUid(null)}
            onToggle={() => { setSelectedUid(null); fetchUsers() }} />
        )}
      </AnimatePresence>
    </AdminLayout>
  )
}
