import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import WarehouseLayout from '../../components/warehouse/WarehouseLayout'
import { api } from '../../services/api'
import { useAutoRefresh } from '../../hooks/useAutoRefresh'
import { formatPrice } from '../../utils/format'

const PERIODS = [
  { value: 'today',      label: 'Hôm nay'    },
  { value: 'yesterday',  label: 'Hôm qua'    },
  { value: '7days',      label: '7 ngày'     },
  { value: '30days',     label: '30 ngày'    },
  { value: 'this_month', label: 'Tháng này'  },
  { value: 'last_month', label: 'Tháng trước'},
  { value: 'custom',     label: 'Tùy chọn'   },
]

const WH_CHART = {
  imports:   { color: '#2E4A3F', label: 'Nhập kho' },
  exports:   { color: '#DC2626', label: 'Xuất kho' },
  delivered: { color: '#3B82F6', label: 'Đơn đã giao' },
}

/* Badge so sánh kỳ trước */
function CmpBadge({ pct }) {
  if (pct === undefined || pct === null) return null
  if (pct === 0) return <span className="inline-flex items-center text-[10px] font-bold text-[#9B9389]">— 0%</span>
  const up = pct > 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${up ? 'text-emerald-600' : 'text-red-600'}`} title="So với kỳ trước">
      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">{up ? <path d="M10 5l6 8H4l6-8z" /> : <path d="M10 15L4 7h12l-6 8z" />}</svg>
      {Math.abs(pct)}%
    </span>
  )
}

/* Thẻ chỉ số vận hành có so sánh */
function AnalyticsCard({ icon, label, value, unit, pct }) {
  return (
    <div className="bg-white rounded-lg border border-[#EAE6DF] p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-wider text-[#615C56] uppercase">{label}</span>
        <div className="border border-[#EAE6DF] p-0.5 bg-[#FAF8F5] rounded text-[#615C56]"><Icon name={icon} /></div>
      </div>
      <div className="flex items-end gap-2 mt-2 mb-1">
        <p className="font-display text-[22px] font-bold text-[#1A1A1A] leading-none">{value}<span className="text-[12px] font-semibold text-[#9B9389] ml-1">{unit}</span></p>
        <span className="mb-0.5"><CmpBadge pct={pct} /></span>
      </div>
      <p className="text-[10px] text-[#9B9389]">so với kỳ trước</p>
    </div>
  )
}

/* Biểu đồ vận hành theo ngày */
function WhChart({ data = [], metric = 'imports' }) {
  const meta = WH_CHART[metric] || WH_CHART.imports
  if (data.length < 2) return (
    <div className="h-56 flex items-center justify-center text-[12px] text-[#9B9389]">Chưa đủ dữ liệu để vẽ biểu đồ (chọn khoảng nhiều ngày hơn)</div>
  )
  const fmtX = (t) => { if (!t) return ''; const p = t.split('-'); return p.length >= 3 ? `${p[2]}/${p[1]}` : t }
  const Tip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload
      let ds = d._id
      if (d._id?.includes('-')) { const p = d._id.split('-'); if (p.length >= 3) ds = `${p[2]}/${p[1]}/${p[0]}` }
      return (
        <div className="bg-[#1A1A1A] rounded-lg p-3 shadow-xl text-[11px] text-white">
          <p className="font-bold border-b border-white/10 pb-1.5 mb-1.5 text-[#9B9389] uppercase tracking-wider">{ds}</p>
          <div className="space-y-1">
            <p className="flex justify-between gap-6"><span className="text-[#9B9389]">Nhập kho:</span><span className="font-bold">{d.imports || 0} cuốn</span></p>
            <p className="flex justify-between gap-6"><span className="text-[#9B9389]">Xuất kho:</span><span className="font-bold">{d.exports || 0} cuốn</span></p>
            <p className="flex justify-between gap-6"><span className="text-[#9B9389]">Đơn đã giao:</span><span className="font-bold">{d.delivered || 0}</span></p>
          </div>
        </div>
      )
    }
    return null
  }
  return (
    <div className="w-full h-56 text-[10px] font-medium text-[#8E877F]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="whGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={meta.color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={meta.color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#EAE6DF" vertical={false} />
          <XAxis dataKey="_id" tickFormatter={fmtX} tickLine={false} axisLine={false} dy={8} stroke="#9B9389" minTickGap={20} />
          <YAxis tickLine={false} axisLine={false} dx={-8} stroke="#9B9389" allowDecimals={false} />
          <Tooltip content={<Tip />} cursor={{ stroke: meta.color, strokeWidth: 1, strokeDasharray: '3 3' }} />
          <Area type="monotone" dataKey={metric} stroke={meta.color} strokeWidth={1.8} fillOpacity={1} fill="url(#whGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ─── Icons ──────────────────────────────────────────────── */
const ICON_PATHS = {
  clipboard: <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
  alert: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
  undo: <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />,
  layers: <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />,
  check: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
  arrow: <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />,
}

function Icon({ name, className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      {ICON_PATHS[name]}
    </svg>
  )
}

/* ─── Skeletons ──────────────────────────────────────────── */
function SkeletonStat() {
  return (
    <div className="bg-[#F2EFEA] border border-[#EAE6DF] rounded-xl p-4 h-[112px] animate-pulse">
      <div className="h-3 bg-[#E6E1DA] rounded w-1/2 mb-4" />
      <div className="h-7 bg-[#E6E1DA] rounded w-2/3 mb-4" />
      <div className="border-t border-[#E6E1DA] pt-3 mt-3">
        <div className="h-3 bg-[#E6E1DA] rounded w-3/4" />
      </div>
    </div>
  )
}

/* ─── Analytics-style stat card ─────────────────────────────
   Mirrors AdminAnalyticsPage / PMDashboard summary cards: bordered
   icon box, font-display headline, footer status line. */
function StatCard({ icon, label, value, valueColor = 'text-[#1A1A1A]', footer, footerColor = 'text-[#615C56]', to }) {
  const card = (
    <div className={`bg-white rounded-lg border border-[#EAE6DF] p-4 shadow-sm h-full ${to ? 'hover:shadow-md hover:border-[#D8D2CA] transition-all' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-wider text-[#615C56] uppercase">{label}</span>
        <div className="border border-[#EAE6DF] p-0.5 bg-[#FAF8F5] rounded text-[#615C56]">
          <Icon name={icon} />
        </div>
      </div>
      <p className={`font-display text-[22px] font-bold mt-2 mb-2 ${valueColor}`}>{value}</p>
      <div className="border-t border-[#EAE6DF] pt-2 mt-2">
        <p className={`text-[11px] font-medium ${footerColor}`}>{footer}</p>
      </div>
    </div>
  )
  return to ? <Link to={to} className="block h-full">{card}</Link> : card
}

const QUICK_ACTIONS = [
  { to: '/warehouse/orders?status=CONFIRMED', label: 'Xử lý đơn chờ', desc: 'Nhặt & đóng gói đơn hàng', icon: 'clipboard' },
  { to: '/warehouse/inventory', label: 'Nhập kho', desc: 'Cập nhật hàng mới về', icon: 'layers' },
  { to: '/warehouse/audit', label: 'Kiểm kê kho', desc: 'Đối chiếu tồn kho thực tế', icon: 'check' },
]

const ACTION_CFG = {
  import_stock:        { icon: 'layers',    label: 'Nhập kho',     badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' },
  export_stock:        { icon: 'layers',    label: 'Xuất kho',     badge: 'bg-red-50 text-red-600 border border-red-200/50' },
  update_order_status: { icon: 'clipboard', label: 'Cập nhật đơn', badge: 'bg-sky-50 text-sky-700 border border-sky-200/50' },
  process_return:      { icon: 'undo',      label: 'Hoàn trả',     badge: 'bg-orange-50 text-orange-700 border border-orange-200/50' },
  submit_audit:        { icon: 'check',     label: 'Kiểm kê',      badge: 'bg-violet-50 text-violet-700 border border-violet-200/50' },
}

export default function WarehouseDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [pendingOrders, setPendingOrders] = useState([])
  const [loadingExtra, setLoadingExtra] = useState(true)

  /* Phân tích vận hành theo thời gian */
  const [period, setPeriod] = useState('30days')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [analytics, setAnalytics] = useState(null)
  const [loadingAna, setLoadingAna] = useState(true)
  const [chartMetric, setChartMetric] = useState('imports')

  useEffect(() => {
    api.get('/api/warehouse/stats')
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))

    Promise.all([
      api.get('/api/warehouse/low-stock'),
      api.get('/api/warehouse/orders?status=CONFIRMED&limit=5'),
    ])
      .then(([low, orders]) => {
        setLowStockProducts(low.data || [])
        setPendingOrders(orders.data || [])
      })
      .catch(() => {})
      .finally(() => setLoadingExtra(false))
  }, [])

  useEffect(() => {
    if (period === 'custom' && (!startDate || !endDate)) return
    setLoadingAna(true)
    let url = `/api/warehouse/analytics?period=${period}`
    if (period === 'custom') url = `/api/warehouse/analytics?startDate=${startDate}&endDate=${endDate}`
    api.get(url)
      .then(r => setAnalytics(r.data))
      .catch(() => {})
      .finally(() => setLoadingAna(false))
  }, [period, startDate, endDate])

  /* Auto-refresh silent toàn bộ dashboard */
  useAutoRefresh(() => {
    api.get('/api/warehouse/stats').then(r => setStats(r.data)).catch(() => {})
    Promise.all([
      api.get('/api/warehouse/low-stock'),
      api.get('/api/warehouse/orders?status=CONFIRMED&limit=5'),
    ]).then(([low, orders]) => {
      setLowStockProducts(low.data || [])
      setPendingOrders(orders.data || [])
    }).catch(() => {})
    if (period === 'custom' && (!startDate || !endDate)) return
    let url = `/api/warehouse/analytics?period=${period}`
    if (period === 'custom') url = `/api/warehouse/analytics?startDate=${startDate}&endDate=${endDate}`
    api.get(url).then(r => setAnalytics(r.data)).catch(() => {})
  }, 30000)

  const a = analytics?.summary
  const ac = analytics?.comparison

  return (
    <WarehouseLayout title="Dashboard">
      {/* Header + bộ lọc thời gian */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#EAE6DF] pb-3 mb-5">
        <div>
          <h2 className="font-display text-[14.5px] font-bold text-[#1A1A1A] uppercase tracking-wider">Tổng quan kho hàng</h2>
          <p className="text-[11px] text-[#9B9389] mt-0.5">Phân tích vận hành theo thời gian & tình trạng kho hiện tại</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 self-start md:self-auto">
          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="px-2.5 py-1 border border-[#EAE6DF] rounded-md text-[11px] bg-white text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]" />
              <span className="text-[10px] text-[#9B9389]">đến</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="px-2.5 py-1 border border-[#EAE6DF] rounded-md text-[11px] bg-white text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]" />
            </div>
          )}
          <div className="flex flex-wrap gap-1 p-0.5 bg-[#F2EFEA] rounded-lg">
            {PERIODS.map(p => (
              <button key={p.value} onClick={() => setPeriod(p.value)}
                className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${period === p.value ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#8E877F] hover:text-[#1A1A1A]'}`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Phân tích vận hành — thẻ chỉ số có so sánh kỳ trước */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {loadingAna ? (
          <><SkeletonStat /><SkeletonStat /><SkeletonStat /><SkeletonStat /></>
        ) : (
          <>
            <AnalyticsCard icon="layers" label="Nhập kho"    value={(a?.imports ?? 0).toLocaleString('vi-VN')} unit="cuốn" pct={ac?.imports?.pct} />
            <AnalyticsCard icon="layers" label="Xuất kho"    value={(a?.exports ?? 0).toLocaleString('vi-VN')} unit="cuốn" pct={ac?.exports?.pct} />
            <AnalyticsCard icon="clipboard" label="Đơn đã giao" value={a?.delivered ?? 0} unit="đơn" pct={ac?.delivered?.pct} />
            <AnalyticsCard icon="undo" label="Hoàn trả"     value={a?.returns ?? 0} unit="lượt" pct={ac?.returns?.pct} />
          </>
        )}
      </motion.div>

      {/* Biểu đồ vận hành theo ngày */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-white rounded-xl border border-[#EAE6DF] p-5 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <p className="font-display text-[13px] font-bold text-[#1A1A1A] uppercase tracking-wider">Biểu đồ vận hành theo ngày</p>
            <p className="text-[11px] text-[#9B9389] mt-0.5">Di chuột để xem chi tiết từng ngày</p>
          </div>
          <div className="flex gap-1 p-0.5 bg-[#F2EFEA] rounded-lg self-start sm:self-auto">
            {Object.entries(WH_CHART).map(([k, m]) => (
              <button key={k} onClick={() => setChartMetric(k)}
                className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${chartMetric === k ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#8E877F] hover:text-[#1A1A1A]'}`}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
        {loadingAna ? (
          <div className="h-56 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl animate-pulse" />
        ) : (
          <WhChart data={analytics?.daily || []} metric={chartMetric} />
        )}
      </motion.div>

      {/* Tình trạng hiện tại */}
      <p className="font-display text-[12px] font-bold uppercase tracking-wider text-[#615C56] mb-3">Tình trạng kho hiện tại</p>

      {/* Stat cards */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {loading ? (
          <><SkeletonStat /><SkeletonStat /><SkeletonStat /><SkeletonStat /></>
        ) : stats && (
          <>
            <StatCard
              icon="clipboard" label="Đơn chờ xử lý" value={`${stats.pendingPacking} đơn`} to="/warehouse/orders?status=CONFIRMED"
              footer={stats.pendingPacking > 0 ? 'Cần đóng gói & bàn giao' : 'Không có đơn tồn đọng'}
              footerColor={stats.pendingPacking > 0 ? 'text-amber-600' : 'text-emerald-600'}
            />
            <StatCard
              icon="alert" label="Tồn kho thấp" value={`${stats.lowStock} đầu sách`} to="/warehouse/inventory?filter=low"
              valueColor={stats.lowStock > 0 ? 'text-red-600' : 'text-[#1A1A1A]'}
              footer={stats.lowStock > 0 ? 'Cần nhập thêm hàng sớm' : 'Tồn kho ổn định'}
              footerColor={stats.lowStock > 0 ? 'text-red-600' : 'text-emerald-600'}
            />
            <StatCard
              icon="undo" label="Hoàn / hủy hôm nay" value={`${stats.returns} đơn`} to="/warehouse/returns"
              footer={stats.returns > 0 ? 'Cần kiểm tra & xử lý' : 'Không phát sinh hôm nay'}
              footerColor={stats.returns > 0 ? 'text-orange-600' : 'text-emerald-600'}
            />
            <StatCard
              icon="layers" label="Nhập kho hôm nay" value={`${stats.importedToday} lượt`} to="/warehouse/inventory"
              footer={stats.importedToday > 0 ? 'Đã ghi nhận trong ngày' : 'Chưa có lượt nhập'}
              footerColor={stats.importedToday > 0 ? 'text-emerald-600' : 'text-[#9B9389]'}
            />
          </>
        )}
      </motion.div>

      {/* Quick actions */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        {QUICK_ACTIONS.map(a => (
          <Link key={a.to} to={a.to}
            className="bg-white border border-[#EAE6DF] rounded-lg p-4 flex items-center gap-3 hover:border-[#1A1A1A] hover:shadow-sm transition-all group">
            <div className="border border-[#EAE6DF] group-hover:border-[#1A1A1A] p-2 bg-[#FAF8F5] rounded-lg text-[#615C56] group-hover:text-[#1A1A1A] transition-colors shrink-0">
              <Icon name={a.icon} className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-[12.5px] font-semibold text-[#1A1A1A]">{a.label}</p>
              <p className="text-[10.5px] text-[#9B9389] mt-0.5">{a.desc}</p>
            </div>
            <Icon name="arrow" className="w-3.5 h-3.5 text-[#D8D2CA] group-hover:text-[#1A1A1A] transition-colors shrink-0" />
          </Link>
        ))}
      </motion.div>

      {/* Low stock + Pending orders */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {/* Sách sắp hết hàng */}
        <div className="bg-white rounded-xl border border-[#EAE6DF] p-5 shadow-sm flex flex-col">
          <p className="font-display text-[13px] font-bold uppercase tracking-wider text-[#1A1A1A] border-b border-[#EAE6DF] pb-2 mb-5 flex items-center justify-between">
            <span>Sách sắp hết hàng</span>
            {!loadingExtra && lowStockProducts.length > 0 && (
              <span className="bg-amber-50 text-amber-700 border border-amber-200/50 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                {lowStockProducts.length} đầu sách
              </span>
            )}
          </p>
          {loadingExtra ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 bg-[#FAF8F5] rounded animate-pulse" />)}</div>
          ) : !lowStockProducts.length ? (
            <p className="text-[12px] text-emerald-600 text-center py-8 font-semibold flex-1">Tất cả sản phẩm đều đủ lượng tồn kho</p>
          ) : (
            <div className="space-y-3.5 flex-1">
              {lowStockProducts.slice(0, 5).map(p => (
                <div key={p._id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {p.image ? (
                      <img src={p.image} alt={p.title} className="w-7 h-10 object-cover rounded-md shadow-sm shrink-0" />
                    ) : (
                      <div className="w-7 h-10 bg-[#FAF8F5] rounded-md border border-[#EAE6DF] shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-[#1A1A1A] line-clamp-1">{p.title}</p>
                      <p className="text-[10px] text-[#9B9389]">{p.author}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${p.stock === 0 ? 'bg-red-50 text-red-600 border border-red-200/50' : 'bg-amber-50 text-amber-700 border border-amber-200/50'}`}>
                    {p.stock === 0 ? 'Hết hàng' : `Còn ${p.stock}`}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="border-t border-[#EAE6DF] pt-3 mt-4">
            <Link to="/warehouse/inventory?filter=low" className="text-[11px] text-[#9B9389] hover:text-[#1A1A1A] transition-colors font-medium">
              Xem toàn bộ tồn kho →
            </Link>
          </div>
        </div>

        {/* Đơn cần đóng gói */}
        <div className="bg-white rounded-xl border border-[#EAE6DF] p-5 shadow-sm flex flex-col">
          <p className="font-display text-[13px] font-bold uppercase tracking-wider text-[#1A1A1A] border-b border-[#EAE6DF] pb-2 mb-5 flex items-center justify-between">
            <span>Đơn cần đóng gói</span>
            {!loadingExtra && stats?.pendingPacking > 0 && (
              <span className="bg-sky-50 text-sky-700 border border-sky-200/50 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                {stats.pendingPacking} đơn
              </span>
            )}
          </p>
          {loadingExtra ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 bg-[#FAF8F5] rounded animate-pulse" />)}</div>
          ) : !pendingOrders.length ? (
            <p className="text-[12px] text-emerald-600 text-center py-8 font-semibold flex-1">Không có đơn nào đang chờ đóng gói</p>
          ) : (
            <div className="space-y-1.5 flex-1">
              {pendingOrders.map(o => (
                <Link key={o._id} to="/warehouse/orders?status=CONFIRMED"
                  className="flex items-center justify-between gap-3 -mx-2 px-2 py-1 rounded-lg hover:bg-[#FAF8F5] transition-colors">
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-[#1A1A1A]">{o.orderCode || `#${o._id.slice(-8).toUpperCase()}`}</p>
                    <p className="text-[10px] text-[#9B9389] truncate">{o.user?.name || o.address?.name || 'Khách vãng lai'} · {o.items?.length} sản phẩm</p>
                  </div>
                  <span className="font-display text-[12.5px] font-bold text-[#1A1A1A] shrink-0">{formatPrice(o.total)}</span>
                </Link>
              ))}
            </div>
          )}
          <div className="border-t border-[#EAE6DF] pt-3 mt-4">
            <Link to="/warehouse/orders?status=CONFIRMED" className="text-[11px] text-[#9B9389] hover:text-[#1A1A1A] transition-colors font-medium">
              Xem tất cả đơn cần xử lý →
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Recent activity */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <div className="bg-white rounded-xl border border-[#EAE6DF] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#EAE6DF] flex items-center justify-between">
            <p className="font-display text-[13px] font-bold uppercase tracking-wider text-[#1A1A1A]">Hoạt động gần đây</p>
            <Link to="/warehouse/activity" className="text-[11px] text-[#9B9389] hover:text-[#1A1A1A] transition-colors font-medium">Xem tất cả →</Link>
          </div>
          {loading ? (
            <div className="divide-y divide-[#FAF8F5]">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3 animate-pulse">
                  <div className="w-8 h-8 bg-[#FAF8F5] border border-[#EAE6DF] rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2"><div className="h-3 bg-[#FAF8F5] rounded w-2/3" /><div className="h-2.5 bg-[#FAF8F5] rounded w-1/3" /></div>
                </div>
              ))}
            </div>
          ) : !stats?.recentActivity?.length ? (
            <p className="text-[12px] text-[#9B9389] text-center py-8">Chưa có hoạt động nào</p>
          ) : (
            <ul className="divide-y divide-[#FAF8F5]">
              {stats.recentActivity.map((a, i) => {
                const cfg = ACTION_CFG[a.action] || { icon: 'clipboard', label: a.action, badge: 'bg-gray-50 text-gray-500 border border-gray-200/50' }
                return (
                  <li key={a._id || i} className="flex items-center gap-3 px-5 py-3 hover:bg-[#FAF8F5]/50 transition-colors">
                    <span className="border border-[#EAE6DF] p-1.5 bg-[#FAF8F5] rounded-lg text-[#615C56] shrink-0">
                      <Icon name={cfg.icon} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-[#1A1A1A] truncate">{a.description}</p>
                      <p className="text-[10px] text-[#9B9389] mt-0.5">
                        {a.performedBy?.name} · {new Date(a.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                      </p>
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shrink-0 ${cfg.badge}`}>{cfg.label}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </motion.div>
    </WarehouseLayout>
  )
}
