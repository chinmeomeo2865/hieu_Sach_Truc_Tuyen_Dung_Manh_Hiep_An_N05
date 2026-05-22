import { useState, useEffect } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { api }     from '../../services/api'
import { useToastStore } from '../../store/toastStore'
import { formatPrice }   from '../../utils/format'

const PERIODS = [
  { value: 'today',  label: 'Hôm nay'  },
  { value: '7days',  label: '7 ngày'   },
  { value: '30days', label: '30 ngày'  },
]

const STATUS_LABEL = {
  PENDING:   'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  PACKING:   'Đóng gói',
  SHIPPING:  'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
  RETURNED:  'Hoàn trả',
}
const STATUS_COLOR = {
  PENDING:   'bg-amber-400',
  CONFIRMED: 'bg-sky-400',
  PACKING:   'bg-violet-400',
  SHIPPING:  'bg-orange-400',
  DELIVERED: 'bg-emerald-500',
  CANCELLED: 'bg-red-400',
  RETURNED:  'bg-gray-300',
}

const ORDER_STATUSES = ['DELIVERED', 'SHIPPING', 'PACKING', 'CONFIRMED', 'PENDING', 'CANCELLED', 'RETURNED']

/* ─── Mini Line Chart (SVG) ──────────────────────────────── */
function LineChart({ data = [] }) {
  if (data.length < 2) return (
    <div className="h-40 flex items-center justify-center text-[12px] text-[#a3a3a3]">Chưa đủ dữ liệu</div>
  )
  const W = 600, H = 120, PAD = 8
  const values = data.map(d => d.revenue)
  const maxV   = Math.max(...values) || 1
  const points = data.map((d, i) => {
    const x = PAD + (i / (data.length - 1)) * (W - PAD * 2)
    const y = H - PAD - ((d.revenue / maxV) * (H - PAD * 2))
    return `${x},${y}`
  }).join(' ')
  const areaPoints = `${PAD},${H} ${points} ${W - PAD},${H}`

  return (
    <div className="w-full" style={{ height: 120 }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0f0f0f" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#0f0f0f" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#chartGrad)" />
        <polyline points={points} fill="none" stroke="#0f0f0f" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) => {
          const x = PAD + (i / (data.length - 1)) * (W - PAD * 2)
          const y = H - PAD - ((d.revenue / maxV) * (H - PAD * 2))
          return <circle key={i} cx={x} cy={y} r="3" fill="#0f0f0f" />
        })}
      </svg>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-[#a3a3a3]">{data[0]?._id?.slice(5)}</span>
        <span className="text-[10px] text-[#a3a3a3]">{data[data.length - 1]?._id?.slice(5)}</span>
      </div>
    </div>
  )
}

/* ─── Skeleton ───────────────────────────────────────────── */
function SkeletonCard() {
  return <div className="bg-[#f5f5f4] rounded-xl h-24 animate-pulse" />
}

/* ─── Stat Card ──────────────────────────────────────────── */
function StatCard({ label, value, sub, accent }) {
  return (
    <div className={`bg-white rounded-xl border p-5 ${accent ? 'border-[#0f0f0f]' : 'border-[#e5e5e5]'}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#a3a3a3] mb-1.5">{label}</p>
      <p className={`text-[22px] font-bold leading-none tracking-tight ${accent ? 'text-[#0f0f0f]' : 'text-[#0f0f0f]'}`}>{value}</p>
      {sub && <p className="text-[11px] text-[#a3a3a3] mt-1.5">{sub}</p>}
    </div>
  )
}

const ORDER_STATUSES_ALL = ['DELIVERED', 'SHIPPING', 'PACKING', 'CONFIRMED', 'PENDING', 'CANCELLED', 'RETURNED']

export default function AdminAnalyticsPage() {
  const showToast          = useToastStore(s => s.show)
  const [period, setPeriod] = useState('30days')
  const [data, setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get(`/api/analytics?period=${period}`)
      .then(r => setData(r.data))
      .catch(err => showToast({ message: err.message, type: 'error' }))
      .finally(() => setLoading(false))
  }, [period])

  const s = data?.summary
  const totalOrdersForPct = Object.values(data?.ordersByStatus || {}).reduce((a, b) => a + b, 0) || 1
  const maxSold = Math.max(...(data?.topProducts?.map(p => p.soldQty) || [1]))

  return (
    <AdminLayout title="Dashboard">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[18px] font-semibold text-[#0f0f0f] tracking-tight">Tổng quan</h2>
          <p className="text-[12px] text-[#a3a3a3] mt-0.5">Báo cáo doanh thu và đơn hàng</p>
        </div>
        <div className="flex gap-1 p-1 bg-[#f5f5f4] rounded-lg">
          {PERIODS.map(p => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className={`px-3.5 py-1.5 rounded-md text-[12px] font-semibold transition-all duration-150
                ${period === p.value ? 'bg-white text-[#0f0f0f] shadow-sm' : 'text-[#737373] hover:text-[#0f0f0f]'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loading ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />) : <>
          <StatCard accent label="Doanh thu"      value={formatPrice(s?.totalRevenue || 0)} sub={`${s?.deliveredOrders || 0} đơn thành công`} />
          <StatCard label="Tổng đơn hàng"  value={s?.totalOrders || 0}    sub={`${s?.pendingOrders || 0} đang chờ xử lý`} />
          <StatCard label="Tỷ lệ thành công" value={`${s?.successRate || 0}%`} sub={`${s?.cancelledOrders || 0} đơn đã hủy`} />
          <StatCard label="Khách hàng mới" value={s?.newCustomers || 0}   sub={`/${s?.totalCustomers || 0} tổng khách hàng`} />
        </>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#e5e5e5] p-5">
          <p className="text-[13px] font-semibold text-[#0f0f0f] mb-1">Doanh thu theo ngày</p>
          <p className="text-[11px] text-[#a3a3a3] mb-4">Chỉ tính đơn đã giao</p>
          {loading ? <div className="h-40 bg-[#f5f5f4] rounded-xl animate-pulse" /> : <LineChart data={data?.revenueByDay || []} />}
        </div>

        {/* Order status */}
        <div className="bg-white rounded-xl border border-[#e5e5e5] p-5">
          <p className="text-[13px] font-semibold text-[#0f0f0f] mb-4">Trạng thái đơn hàng</p>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-7 bg-[#f5f5f4] rounded animate-pulse" />)}</div>
          ) : ORDER_STATUSES_ALL.filter(st => (data?.ordersByStatus?.[st] || 0) > 0).map(st => {
            const count = data?.ordersByStatus?.[st] || 0
            const pct   = Math.round((count / totalOrdersForPct) * 100)
            return (
              <div key={st} className="mb-3 last:mb-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] font-medium text-[#525252]">{STATUS_LABEL[st]}</span>
                  <span className="text-[12px] font-semibold text-[#0f0f0f]">{count}</span>
                </div>
                <div className="h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${STATUS_COLOR[st]} transition-all duration-500`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top products */}
        <div className="bg-white rounded-xl border border-[#e5e5e5] p-5">
          <p className="text-[13px] font-semibold text-[#0f0f0f] mb-4">Top sách bán chạy</p>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-[#f5f5f4] rounded-xl animate-pulse" />)}</div>
          ) : !data?.topProducts?.length ? (
            <p className="text-[12px] text-[#a3a3a3] text-center py-8">Chưa có dữ liệu</p>
          ) : data.topProducts.map((p, i) => (
            <div key={p._id?.toString() || i} className="flex items-center gap-3 mb-3 last:mb-0">
              <span className="text-[11px] font-bold text-[#a3a3a3] w-4 flex-shrink-0">{i + 1}</span>
              {p.image
                ? <img src={p.image} alt={p.title} className="w-9 h-12 object-cover rounded-lg flex-shrink-0" />
                : <div className="w-9 h-12 bg-[#f0f0f0] rounded-lg flex-shrink-0" />
              }
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-[#0f0f0f] line-clamp-1">{p.title}</p>
                <p className="text-[11px] text-[#a3a3a3] mt-0.5">{p.author}</p>
                <div className="h-1 bg-[#f0f0f0] rounded-full mt-1.5 overflow-hidden">
                  <div className="h-full bg-[#0f0f0f] rounded-full" style={{ width: `${(p.soldQty / maxSold) * 100}%` }} />
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[13px] font-bold text-[#0f0f0f]">{p.soldQty}</p>
                <p className="text-[10px] text-[#a3a3a3]">cuốn</p>
              </div>
            </div>
          ))}
        </div>

        {/* Recent orders */}
        <div className="bg-white rounded-xl border border-[#e5e5e5] p-5">
          <p className="text-[13px] font-semibold text-[#0f0f0f] mb-4">Đơn hàng gần đây</p>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-12 bg-[#f5f5f4] rounded-xl animate-pulse" />)}</div>
          ) : !data?.recentOrders?.length ? (
            <p className="text-[12px] text-[#a3a3a3] text-center py-8">Chưa có đơn hàng</p>
          ) : data.recentOrders.map(o => {
            const sc = { DELIVERED: 'bg-emerald-50 text-emerald-700', CANCELLED: 'bg-red-50 text-red-600', PENDING: 'bg-amber-50 text-amber-700', SHIPPING: 'bg-orange-50 text-orange-700', PACKING: 'bg-violet-50 text-violet-700', CONFIRMED: 'bg-sky-50 text-sky-700' }
            return (
              <div key={o._id} className="flex items-center justify-between py-2.5 border-b border-[#f5f5f4] last:border-0">
                <div>
                  <p className="text-[12px] font-semibold text-[#0f0f0f]">#{o._id.slice(-8).toUpperCase()}</p>
                  <p className="text-[11px] text-[#a3a3a3]">{o.user?.name || 'Khách'} · {new Date(o.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
                <div className="text-right">
                  <p className="text-[12px] font-semibold text-[#0f0f0f]">{formatPrice(o.total)}</p>
                  <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${sc[o.status] || 'bg-gray-50 text-gray-500'}`}>{STATUS_LABEL[o.status]}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AdminLayout>
  )
}
