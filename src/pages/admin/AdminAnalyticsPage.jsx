import { useState, useEffect } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { api }     from '../../services/api'
import { useToastStore } from '../../store/toastStore'
import { formatPrice }   from '../../utils/format'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

const PERIODS = [
  { value: 'today',  label: 'Hôm nay'  },
  { value: '7days',  label: '7 ngày'   },
  { value: '30days', label: '30 ngày'  },
  { value: 'custom', label: 'Tùy chọn' },
]

const STATUS_LABEL = {
  PENDING:   'CHỜ XÁC NHẬN',
  CONFIRMED: 'ĐÃ XÁC NHẬN',
  PACKING:   'ĐÓNG GÓI',
  SHIPPING:  'ĐANG GIAO',
  DELIVERED: 'ĐÃ GIAO',
  CANCELLED: 'ĐÃ HỦY',
  RETURNED:  'HOÀN TRẢ',
}

const STATUS_COLOR = {
  PENDING:   'bg-[#F59E0B]',   // Orange
  CONFIRMED: 'bg-[#3B82F6]',   // Blue
  PACKING:   'bg-[#8B5CF6]',   // Purple
  SHIPPING:  'bg-[#F97316]',   // Orange/Amber
  DELIVERED: 'bg-[#059669]',   // Green
  CANCELLED: 'bg-[#DC2626]',   // Red
  RETURNED:  'bg-[#9B9389]',   // Grey
}

const STATUS_LIST_DISPLAY = ['PENDING', 'CONFIRMED', 'PACKING', 'SHIPPING', 'DELIVERED', 'CANCELLED']

/* ─── Premium Area Chart (Recharts) ──────────────────────── */
function LineChart({ data = [] }) {
  if (data.length < 2) return (
    <div className="h-64 flex items-center justify-center text-[12px] text-[#9B9389]">Chưa đủ dữ liệu</div>
  )

  const formatYAxis = (tick) => {
    if (tick >= 1000000) {
      return `${(tick / 1000000).toFixed(1).replace(/\.0$/, '')}M`
    }
    if (tick >= 1000) {
      return `${(tick / 1000).toFixed(0)}k`
    }
    return tick
  }

  const formatXAxis = (tick) => {
    if (!tick) return ''
    const parts = tick.split('-')
    if (parts.length >= 3) {
      return `${parts[2]}/${parts[1]}`
    }
    return tick
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload
      let dateStr = d._id
      if (d._id && d._id.includes('-')) {
        const parts = d._id.split('-')
        if (parts.length >= 3) {
          dateStr = `${parts[2]}/${parts[1]}/${parts[0]}`
        }
      }
      return (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-3 shadow-xl text-[11px] text-white">
          <p className="font-bold border-b border-white/10 pb-1.5 mb-1.5 text-[#9B9389] uppercase tracking-wider">{dateStr}</p>
          <div className="space-y-1">
            <p className="flex justify-between gap-6">
              <span className="text-[#9B9389]">Doanh thu:</span>
              <span className="font-bold text-white">{formatPrice(d.revenue || 0)}</span>
            </p>
            <p className="flex justify-between gap-6">
              <span className="text-[#9B9389]">Đơn hàng:</span>
              <span className="font-bold text-white">{d.count || 0} đơn</span>
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full h-64 text-[10px] font-medium text-[#8E877F]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#B08968" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#B08968" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#EAE6DF" vertical={false} />
          <XAxis 
            dataKey="_id" 
            tickFormatter={formatXAxis} 
            tickLine={false} 
            axisLine={false} 
            dy={8} 
            stroke="#9B9389"
          />
          <YAxis 
            tickFormatter={formatYAxis} 
            tickLine={false} 
            axisLine={false} 
            dx={-8}
            stroke="#9B9389"
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#B08968', strokeWidth: 1, strokeDasharray: '3 3' }} />
          <Area 
            type="monotone" 
            dataKey="revenue" 
            stroke="#1A1A1A" 
            strokeWidth={1.8} 
            fillOpacity={1} 
            fill="url(#colorRevenue)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ─── Skeleton Card ──────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="bg-[#F2EFEA] border border-[#EAE6DF] rounded-xl p-5 h-44 animate-pulse">
      <div className="h-4 bg-[#E6E1DA] rounded w-1/2 mb-4" />
      <div className="h-8 bg-[#E6E1DA] rounded w-3/4 mb-4" />
      <div className="border-t border-[#E6E1DA] pt-3 mt-3 space-y-2">
        <div className="h-3 bg-[#E6E1DA] rounded w-full" />
        <div className="h-3 bg-[#E6E1DA] rounded w-5/6" />
      </div>
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const showToast          = useToastStore(s => s.show)
  const [period, setPeriod] = useState('30days')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [data, setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  // Order detail modal states
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Search & Filter states for Recent Orders
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Inline stock edit states
  const [editingProductId, setEditingProductId] = useState(null)
  const [editingStockValue, setEditingStockValue] = useState(0)

  const handleUpdateStock = (productId, newStock) => {
    if (newStock < 0) {
      showToast({ message: 'Số lượng tồn kho không thể âm!', type: 'error' })
      return
    }
    api.put(`/api/products/${productId}/stock`, { stock: newStock })
      .then(() => {
        showToast({ message: 'Cập nhật số lượng tồn kho thành công!', type: 'success' })
        setEditingProductId(null)
        // Refresh data
        setLoading(true)
        let url = `/api/analytics?period=${period}`
        if (period === 'custom') {
          url = `/api/analytics?startDate=${startDate}&endDate=${endDate}`
        }
        api.get(url)
          .then(r => setData(r.data))
          .catch(err => showToast({ message: err.message, type: 'error' }))
          .finally(() => setLoading(false))
      })
      .catch(err => showToast({ message: err.message || 'Lỗi cập nhật tồn kho', type: 'error' }))
  }

  useEffect(() => {
    if (period === 'custom' && (!startDate || !endDate)) {
      return
    }
    setLoading(true)
    let url = `/api/analytics?period=${period}`
    if (period === 'custom') {
      url = `/api/analytics?startDate=${startDate}&endDate=${endDate}`
    }
    api.get(url)
      .then(r => setData(r.data))
      .catch(err => showToast({ message: err.message, type: 'error' }))
      .finally(() => setLoading(false))
  }, [period, startDate, endDate, showToast])

  const exportToCSV = () => {
    if (!data?.recentOrders?.length) return

    const headers = ['Mã Đơn Hàng', 'Tên Khách Hàng', 'Email', 'Ngày Mua', 'Tổng Tiền (VND)', 'Trạng Thái']
    const rows = data.recentOrders.map(o => [
      o.orderCode || `#${o._id.slice(-8).toUpperCase()}`,
      o.user?.name || 'Khách vãng lai',
      o.user?.email || 'N/A',
      new Date(o.createdAt).toLocaleDateString('vi-VN'),
      o.total,
      STATUS_LABEL[o.status] || o.status
    ])

    const BOM = '\uFEFF'
    const csvContent = BOM + [headers.join(','), ...rows.map(row => row.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(','))].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `don_hang_gan_day_${new Date().toISOString().slice(0, 10)}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    showToast({ message: 'Xuất file Excel thành công!', type: 'success' })
  }

  useEffect(() => {
    if (!selectedOrderId) {
      setSelectedOrder(null)
      return
    }
    setLoadingDetail(true)
    api.get(`/api/orders/${selectedOrderId}`)
      .then(r => setSelectedOrder(r.data))
      .catch(err => showToast({ message: err.message, type: 'error' }))
      .finally(() => setLoadingDetail(false))
  }, [selectedOrderId, showToast])

  // Reset page when criteria changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterDate, period])

  const s = data?.summary
  const totalOrdersForPct = Object.values(data?.ordersByStatus || {}).reduce((a, b) => a + b, 0) || 1
  const maxSold = Math.max(...(data?.topProducts?.map(p => p.soldQty) || [1]))

  // Filtered & Paginated Recent Orders
  const filteredOrders = data?.recentOrders?.filter(o => {
    const term = searchTerm.toLowerCase().trim()
    const matchesSearch = !term || 
      o._id.toLowerCase().includes(term) ||
      (o.orderCode && o.orderCode.toLowerCase().includes(term)) ||
      (o.user?.name && o.user.name.toLowerCase().includes(term)) ||
      (o.user?.email && o.user.email.toLowerCase().includes(term))

    let matchesDate = true
    if (filterDate) {
      const orderDate = new Date(o.createdAt).toISOString().split('T')[0]
      matchesDate = (orderDate === filterDate)
    }

    return matchesSearch && matchesDate
  }) || []

  const ITEMS_PER_PAGE = 8
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE) || 1
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  return (
    <AdminLayout title="Dashboard">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#EAE6DF] pb-3 mb-5">
        <div>
          <h2 className="font-display text-[14.5px] font-bold text-[#1A1A1A] uppercase tracking-wider">SỐ LIỆU PHÂN TÍCH KINH DOANH</h2>
          <p className="text-[11px] text-[#9B9389] mt-0.5">Các chỉ số được cập nhật theo khoảng thời gian lựa chọn</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 self-start md:self-auto">
          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="px-2.5 py-1 border border-[#EAE6DF] rounded-md text-[11px] bg-white text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
              />
              <span className="text-[10px] text-[#8E877F]">đến</span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="px-2.5 py-1 border border-[#EAE6DF] rounded-md text-[11px] bg-white text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
              />
            </div>
          )}
          <div className="flex gap-1 p-0.5 bg-[#F2EFEA] rounded-lg">
            {PERIODS.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all duration-150 ${
                  period === p.value ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#8E877F] hover:text-[#1A1A1A]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Analytical stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            {/* Card 1: DOANH THU THỰC TẾ */}
            <div className="bg-white rounded-lg border border-[#EAE6DF] p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider text-[#615C56] uppercase">DOANH THU THỰC TẾ</span>
                <div className="border border-[#EAE6DF] p-0.5 bg-[#FAF8F5] rounded text-[#615C56]">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="font-display text-[22px] font-bold text-[#1A1A1A] mt-2 mb-2">
                {formatPrice(s?.totalRevenue || 0)}
              </p>
              <div className="border-t border-[#EAE6DF] pt-2 mt-2 space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#615C56]">Khuyến mãi đã giảm</span>
                  <span className="font-bold text-[#DC2626]">-{formatPrice(s?.totalDiscount || 0)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#615C56]">Trung bình/Đơn (AOV)</span>
                  <span className="font-semibold text-[#1A1A1A]">{formatPrice(s?.avgOrderValue || 0)}</span>
                </div>
              </div>
            </div>

            {/* Card 2: SỐ LƯỢNG ĐƠN ĐẶT */}
            <div className="bg-white rounded-lg border border-[#EAE6DF] p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider text-[#615C56] uppercase">SỐ LƯỢNG ĐƠN ĐẶT</span>
                <div className="border border-[#EAE6DF] p-0.5 bg-[#FAF8F5] rounded text-[#615C56]">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
              </div>
              <p className="font-display text-[22px] font-bold text-[#1A1A1A] mt-2 mb-2">
                {s?.totalOrders || 0} đơn
              </p>
              <div className="border-t border-[#EAE6DF] pt-2 mt-2 space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#615C56]">Giao thành công</span>
                  <span className="font-bold text-[#059669]">{s?.deliveredOrders || 0} đơn</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#615C56]">Hủy đơn (Tỷ lệ %)</span>
                  <span className="font-bold text-[#DC2626]">
                    {s?.cancelledOrders || 0} đơn ({s?.totalOrders > 0 ? Math.round((s.cancelledOrders / s.totalOrders) * 100) : 0}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: THÀNH VIÊN */}
            <div className="bg-white rounded-lg border border-[#EAE6DF] p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider text-[#615C56] uppercase">THÀNH VIÊN</span>
                <div className="border border-[#EAE6DF] p-0.5 bg-[#FAF8F5] rounded text-[#615C56]">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <p className="font-display text-[22px] font-bold text-[#1A1A1A] mt-2 mb-2">
                {s?.totalMembers || 0} người
              </p>
              <div className="border-t border-[#EAE6DF] pt-2 mt-2 space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#615C56]">Quản trị viên (Admin)</span>
                  <span className="font-semibold text-[#1A1A1A]">{s?.rolesCount?.admin || 0}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#615C56]">Biên tập viên (Curator)</span>
                  <span className="font-semibold text-[#1A1A1A]">{s?.rolesCount?.product_manager || 0}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#615C56]">Khách hàng thành viên</span>
                  <span className="font-semibold text-[#1A1A1A]">{s?.rolesCount?.customer || 0}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Row 2: Chart (Single full-width row, centered titles) */}
      <div className="bg-white rounded-xl border border-[#EAE6DF] p-5 shadow-sm mb-6">
        <div className="text-center mb-5">
          <p className="font-display text-[13.5px] font-bold text-[#1A1A1A] uppercase tracking-wider">Doanh thu theo ngày</p>
          <p className="text-[11px] text-[#9B9389] mt-0.5">Chỉ tính đơn hàng giao thành công</p>
        </div>
        {loading ? (
          <div className="h-64 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl animate-pulse" />
        ) : (
          <LineChart data={data?.revenueByDay || []} />
        )}
      </div>

      {/* Row 3: Top Selling Books & Order Statuses (Side by side) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {/* Top 5 Sách bán chạy nhất */}
        <div className="bg-white rounded-xl border border-[#EAE6DF] p-5 shadow-sm">
          <p className="font-display text-[13px] font-bold uppercase tracking-wider text-[#1A1A1A] border-b border-[#EAE6DF] pb-2 mb-5">
            TOP 5 SÁCH BÁN CHẠY NHẤT
          </p>
          {loading ? (
            <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-[#FAF8F5] rounded animate-pulse" />)}</div>
          ) : !data?.topProducts?.length ? (
            <p className="text-[12px] text-[#9B9389] text-center py-8">Chưa có dữ liệu</p>
          ) : (
            data.topProducts.map((p, i) => (
              <div key={p._id?.toString() || i} className="mb-4 last:mb-0">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-display text-[12.5px] font-semibold text-[#1A1A1A]">{i + 1}. {p.title}</span>
                  <span className="font-display text-[12.5px] font-bold text-[#1A1A1A]">{p.soldQty} cuốn</span>
                </div>
                <div className="h-3 bg-[#F2EFEA] rounded-sm overflow-hidden">
                  <div className="h-full bg-[#2E4A3F] rounded-sm" style={{ width: `${(p.soldQty / maxSold) * 100}%` }} />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cơ cấu đơn hàng theo trạng thái */}
        <div className="bg-white rounded-xl border border-[#EAE6DF] p-5 shadow-sm">
          <p className="font-display text-[13px] font-bold uppercase tracking-wider text-[#1A1A1A] border-b border-[#EAE6DF] pb-2 mb-5">
            CƠ CẤU ĐƠN HÀNG THEO TRẠNG THÁI
          </p>
          {loading ? (
            <div className="space-y-4">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-10 bg-[#FAF8F5] rounded animate-pulse" />)}</div>
          ) : (
            STATUS_LIST_DISPLAY.map(st => {
              const count = data?.ordersByStatus?.[st] || 0
              const pct   = Math.round((count / totalOrdersForPct) * 100)
              return (
                <div key={st} className="mb-4 last:mb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-[#1A1A1A] tracking-wider">{STATUS_LABEL[st]}</span>
                    <span className="font-display text-[12.5px] font-bold text-[#1A1A1A]">{count} đơn</span>
                  </div>
                  <div className="h-3 bg-[#F2EFEA] rounded-sm overflow-hidden">
                    <div
                      className={`h-full rounded-sm ${STATUS_COLOR[st]} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Row 4: Payment Distribution & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {/* Cơ cấu hình thức thanh toán */}
        <div className="bg-white rounded-xl border border-[#EAE6DF] p-5 shadow-sm">
          <p className="font-display text-[13px] font-bold uppercase tracking-wider text-[#1A1A1A] border-b border-[#EAE6DF] pb-2 mb-5">
            CƠ CẤU HÌNH THỨC THANH TOÁN
          </p>
          {loading ? (
            <div className="space-y-4">
              <div className="h-10 bg-[#FAF8F5] rounded animate-pulse" />
              <div className="h-10 bg-[#FAF8F5] rounded animate-pulse" />
            </div>
          ) : !data?.paymentMethods?.length ? (
            <p className="text-[12px] text-[#9B9389] text-center py-8">Chưa có dữ liệu thanh toán</p>
          ) : (
            data.paymentMethods.map((pm, i) => {
              const label = pm._id === 'ONLINE' ? 'Chuyển khoản (ONLINE)' : 'Thanh toán khi nhận hàng (COD)'
              const color = pm._id === 'ONLINE' ? 'bg-[#2E4A3F]' : 'bg-[#B08968]'
              const totalAmount = data.paymentMethods.reduce((acc, curr) => acc + curr.total, 0) || 1
              const pct = Math.round((pm.total / totalAmount) * 100)
              return (
                <div key={pm._id || i} className="mb-4 last:mb-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-[11px] font-bold text-[#1A1A1A] tracking-wider">{label}</span>
                    <span className="font-display text-[12.5px] font-bold text-[#1A1A1A]">
                      {pm.count} đơn ({formatPrice(pm.total)})
                    </span>
                  </div>
                  <div className="h-3 bg-[#F2EFEA] rounded-sm overflow-hidden flex justify-between">
                    <div className={`h-full rounded-sm ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-[10px] text-[#8E877F] mt-1 text-right">{pct}% tổng doanh số</div>
                </div>
              )
            })
          )}
        </div>

        {/* Cảnh báo sách sắp hết hàng */}
        <div className="bg-white rounded-xl border border-[#EAE6DF] p-5 shadow-sm">
          <p className="font-display text-[13px] font-bold uppercase tracking-wider text-red-600 border-b border-[#EAE6DF] pb-2 mb-5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-red-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              CẢNH BÁO SÁCH SẮP HẾT HÀNG (TỒN KHO ≤ 10)
            </span>
            {!loading && data?.lowStockCount > 0 && (
              <span className="bg-red-50 text-red-600 border border-red-200/50 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                Tổng cộng: {data.lowStockCount} đầu sách
              </span>
            )}
          </p>
          {loading ? (
            <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-10 bg-[#FAF8F5] rounded animate-pulse" />)}</div>
          ) : !data?.lowStockProducts?.length ? (
            <p className="text-[12px] text-[#059669] text-center py-8 font-semibold">Tất cả sản phẩm đều đủ lượng tồn kho</p>
          ) : (
            <div className="space-y-3.5">
              {data.lowStockProducts.map((p) => {
                const isUrgent = p.stock <= 3
                const isEditing = editingProductId === p._id
                return (
                  <div key={p._id} className="flex items-center justify-between gap-3 p-2 rounded-lg border border-[#FAF8F5] hover:bg-[#FAF8F5]/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {p.image ? (
                        <img src={p.image} alt={p.title} className="w-7 h-10 object-cover rounded-md shadow-sm flex-shrink-0" />
                      ) : (
                        <div className="w-7 h-10 bg-[#FAF8F5] rounded-md border border-[#EAE6DF] flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-[#1A1A1A] line-clamp-1">{p.title}</p>
                        <p className="text-[10px] text-[#8E877F]">{p.author}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={editingStockValue}
                            onChange={e => setEditingStockValue(Number(e.target.value))}
                            className="w-16 px-1.5 py-0.5 border border-[#EAE6DF] rounded text-[10px] focus:outline-none focus:border-[#1a1a1a] bg-white text-[#1a1a1a] font-semibold"
                            onClick={e => e.stopPropagation()}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleUpdateStock(p._id, editingStockValue)
                            }}
                            className="p-1 text-[#059669] hover:bg-emerald-50 rounded text-xs font-bold transition-colors"
                            title="Lưu"
                          >
                            ✓
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingProductId(null)
                            }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded text-xs font-bold transition-colors"
                            title="Hủy"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 group/badge">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${isUrgent ? 'bg-red-50 text-red-600 border border-red-200/50' : 'bg-amber-50 text-amber-700 border border-amber-200/50'}`}>
                            Còn {p.stock} cuốn
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingProductId(p._id)
                              setEditingStockValue(p.stock)
                            }}
                            className="opacity-0 group-hover/badge:opacity-100 p-1 hover:bg-[#FAF8F5] rounded transition-all text-[#615C56] hover:text-[#1A1A1A]"
                            title="Nhập thêm hàng nhanh"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Row 5: Recent orders (At the very bottom as a clean full-width table) */}
      <div className="bg-white rounded-xl border border-[#EAE6DF] p-5 shadow-sm">
        
        {/* Header Block with Title & Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-[#EAE6DF] pb-3 mb-4 gap-3">
          <p className="font-display text-[13.5px] font-bold uppercase tracking-wider text-[#1A1A1A] self-center">
            Đơn hàng gần đây
          </p>
          
          {/* Toolbar for Search & Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Tìm mã đơn, tên, email..."
                className="pl-8 pr-8 py-1.5 border border-[#EAE6DF] rounded-lg text-[11px] focus:outline-none focus:border-[#1A1A1A] bg-[#FAF8F5] w-full sm:w-56 transition-colors placeholder-[#9B9389] text-[#1A1A1A]"
              />
              <svg className="w-3.5 h-3.5 text-[#9B9389] absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9B9389] hover:text-[#1A1A1A] text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Date Input */}
            <div className="relative">
              <input
                type="date"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                className="pl-3 pr-8 py-1.5 border border-[#EAE6DF] rounded-lg text-[11px] focus:outline-none focus:border-[#1A1A1A] bg-[#FAF8F5] w-full sm:w-36 transition-colors text-[#1A1A1A]"
              />
              {filterDate && (
                <button 
                  type="button"
                  onClick={() => setFilterDate('')} 
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9B9389] hover:text-[#1A1A1A] text-xs font-bold z-10"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Export Excel Button */}
            <button
              onClick={exportToCSV}
              disabled={!data?.recentOrders?.length}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-[#EAE6DF] hover:border-[#1A1A1A] disabled:opacity-50 text-[#615C56] hover:text-[#1A1A1A] rounded-lg text-[11px] font-semibold transition-colors shadow-sm disabled:cursor-not-allowed"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Xuất Excel
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2.5">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-[#FAF8F5] rounded animate-pulse" />)}</div>
        ) : !filteredOrders.length ? (
          <p className="text-[12px] text-[#9B9389] text-center py-8">Không tìm thấy đơn hàng nào phù hợp</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[12px]">
                <thead>
                  <tr className="border-b border-[#EAE6DF] text-[#615C56]">
                    <th className="py-2.5 font-semibold w-[15%] text-left">MÃ ĐƠN HÀNG</th>
                    <th className="py-2.5 font-semibold w-[30%] text-left">KHÁCH HÀNG</th>
                    <th className="py-2.5 font-semibold w-[15%] text-left">NGÀY MUA</th>
                    <th className="py-2.5 font-semibold w-[15%] text-left">TỔNG TIỀN</th>
                    <th className="py-2.5 font-semibold w-[15%] text-left">TRẠNG THÁI</th>
                    <th className="py-2.5 font-semibold w-[10%] text-right">HÀNH ĐỘNG</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.map(o => {
                    const sc = {
                      DELIVERED: 'bg-emerald-50 text-emerald-700 border border-emerald-200/50',
                      CANCELLED: 'bg-red-50 text-red-600 border border-red-200/50',
                      PENDING: 'bg-amber-50 text-amber-700 border border-amber-200/50',
                      SHIPPING: 'bg-orange-50 text-orange-700 border border-orange-200/50',
                      PACKING: 'bg-violet-50 text-violet-700 border border-violet-200/50',
                      CONFIRMED: 'bg-sky-50 text-sky-700 border border-sky-200/50'
                    }
                    return (
                      <tr 
                        key={o._id} 
                        onClick={() => setSelectedOrderId(o._id)}
                        className="border-b border-[#FAF8F5] hover:bg-[#FAF8F5]/50 transition-colors last:border-0 cursor-pointer"
                      >
                        <td className="py-3 font-semibold text-[#1A1A1A] align-middle text-left">{o.orderCode || `#${o._id.slice(-8).toUpperCase()}`}</td>
                        <td className="py-3 text-[#1A1A1A] align-middle text-left">
                          <div className="flex flex-col">
                            <span className="font-semibold text-[#1A1A1A] text-[12.5px]">{o.user?.name || 'Khách vãng lai'}</span>
                            <span className="text-[#9B9389] text-[10.5px] font-normal mt-0.5">{o.user?.email || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="py-3 text-[#615C56] align-middle text-left">{new Date(o.createdAt).toLocaleDateString('vi-VN')}</td>
                        <td className="py-3 font-bold text-[#1A1A1A] align-middle text-left">{formatPrice(o.total)}</td>
                        <td className="py-3 align-middle text-left">
                          <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-semibold tracking-wide ${sc[o.status] || 'bg-gray-50 text-gray-500'}`}>
                            {STATUS_LABEL[o.status] || o.status}
                          </span>
                        </td>
                        <td className="py-3 align-middle text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedOrderId(o._id)
                            }}
                            className="px-2.5 py-1 bg-white border border-[#EAE6DF] text-[#615C56] hover:text-[#1A1A1A] hover:border-[#1A1A1A] rounded text-[11px] font-medium transition-colors"
                          >
                            Xem chi tiết
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-[#EAE6DF] pt-4 mt-4 text-[11px]">
                <p className="text-[#9B9389] font-medium">
                  Hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)} trong {filteredOrders.length} đơn hàng
                </p>
                <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="px-2 py-1 border border-[#EAE6DF] rounded-md hover:border-[#1A1A1A] disabled:opacity-40 disabled:hover:border-[#EAE6DF] text-[#615C56] hover:text-[#1A1A1A] disabled:cursor-not-allowed transition-colors text-[10.5px] font-semibold"
                  >
                    ← Trước
                  </button>
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const p = idx + 1
                    return (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`px-2.5 py-1 rounded-md border text-[10.5px] font-semibold transition-colors ${
                          currentPage === p 
                            ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white shadow-sm' 
                            : 'bg-white border-[#EAE6DF] text-[#615C56] hover:border-[#1A1A1A] hover:text-[#1A1A1A]'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  })}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="px-2 py-1 border border-[#EAE6DF] rounded-md hover:border-[#1A1A1A] disabled:opacity-40 disabled:hover:border-[#EAE6DF] text-[#615C56] hover:text-[#1A1A1A] disabled:cursor-not-allowed transition-colors text-[10.5px] font-semibold"
                  >
                    Sau →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all duration-200">
          <div className="bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-[#1A1A1A]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-[#EAE6DF] bg-white shrink-0">
              <div>
                <h3 className="font-display text-[14px] font-bold uppercase tracking-wider text-[#1A1A1A]">
                  Chi tiết đơn hàng
                </h3>
                {selectedOrder && (
                  <p className="text-[11px] text-[#9B9389] mt-0.5">
                    Mã: {selectedOrder.orderCode || `#${selectedOrder._id.toUpperCase()}`} · Ngày: {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}
                  </p>
                )}
              </div>
              <button 
                onClick={() => setSelectedOrderId(null)} 
                className="p-1 hover:bg-[#FAF8F5] rounded text-[#8E877F] hover:text-[#1A1A1A] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingDetail ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <div className="w-8 h-8 border-2 border-[#1A1A1A] border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-[#9B9389]">Đang tải dữ liệu đơn hàng...</p>
                </div>
              ) : !selectedOrder ? (
                <p className="text-xs text-red-500 text-center py-6">Không tìm thấy thông tin đơn hàng</p>
              ) : (
                <>
                  {/* Status, Payment and Customer Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg border border-[#EAE6DF] p-4 space-y-3 shadow-sm">
                      <p className="text-[10px] font-bold text-[#8E877F] uppercase tracking-wider">Thông tin đơn</p>
                      <div className="text-xs space-y-2">
                        <div className="flex justify-between">
                          <span className="text-[#615C56]">Trạng thái:</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            selectedOrder.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' :
                            selectedOrder.status === 'CANCELLED' ? 'bg-red-50 text-red-600 border border-red-200/50' :
                            selectedOrder.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200/50' :
                            selectedOrder.status === 'SHIPPING' ? 'bg-orange-50 text-orange-700 border border-orange-200/50' :
                            selectedOrder.status === 'PACKING' ? 'bg-violet-50 text-violet-700 border border-violet-200/50' :
                            selectedOrder.status === 'CONFIRMED' ? 'bg-sky-50 text-sky-700 border border-sky-200/50' : 'bg-gray-50 text-gray-500'
                          }`}>
                            {STATUS_LABEL[selectedOrder.status] || selectedOrder.status}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#615C56]">Thanh toán:</span>
                          <span className="font-semibold">{selectedOrder.payment === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : 'Thanh toán online'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#615C56]">Mã giảm giá:</span>
                          <span className="font-semibold text-emerald-600">{selectedOrder.couponCode || 'Không dùng'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg border border-[#EAE6DF] p-4 space-y-3 shadow-sm">
                      <p className="text-[10px] font-bold text-[#8E877F] uppercase tracking-wider">Khách nhận hàng</p>
                      <div className="text-xs space-y-1">
                        <p className="font-bold">{selectedOrder.address?.name || selectedOrder.user?.name}</p>
                        <p className="text-[#615C56]">SĐT: <span className="font-semibold text-[#1A1A1A]">{selectedOrder.address?.phone || selectedOrder.user?.phone || 'N/A'}</span></p>
                        <p className="text-[#615C56] leading-relaxed">
                          Địa chỉ: {selectedOrder.address ? `${selectedOrder.address.street}, ${selectedOrder.address.city}` : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-[#8E877F] uppercase tracking-wider">Danh sách sản phẩm</p>
                    <div className="border border-[#EAE6DF] rounded-lg overflow-hidden bg-white shadow-sm">
                      <div className="divide-y divide-[#FAF8F5]">
                        {selectedOrder.items?.map((item, idx) => (
                          <div key={idx} className="p-3 flex items-center gap-3 hover:bg-[#FAF8F5]/30 transition-colors">
                            {item.image ? (
                              <img src={item.image} alt={item.title} className="w-10 h-14 object-cover rounded-sm border border-[#EAE6DF] shrink-0" />
                            ) : (
                              <div className="w-10 h-14 bg-[#F2EFEA] border border-[#EAE6DF] rounded-sm flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5 text-[#9B9389]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-display text-xs font-semibold text-[#1A1A1A] truncate">{item.title}</h4>
                              <p className="text-[10px] text-[#9B9389] mt-0.5">{item.author}</p>
                              <p className="text-[10px] text-[#615C56] mt-0.5">Số lượng: <span className="font-semibold text-[#1A1A1A]">x{item.qty}</span></p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs font-bold">{formatPrice(item.price * item.qty)}</p>
                              <p className="text-[9px] text-[#9B9389]">{formatPrice(item.price)} / quyển</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Pricing summary */}
                  <div className="border-t border-[#EAE6DF] pt-4 flex flex-col items-end space-y-1 text-xs">
                    <div className="flex justify-between w-48 text-[#615C56]">
                      <span>Tiền hàng:</span>
                      <span className="font-medium text-[#1A1A1A]">{formatPrice(selectedOrder.total + (selectedOrder.discount || 0))}</span>
                    </div>
                    {selectedOrder.discount > 0 && (
                      <div className="flex justify-between w-48 text-[#DC2626]">
                        <span>Giảm giá (Coupon):</span>
                        <span className="font-medium">-{formatPrice(selectedOrder.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between w-48 border-t border-[#EAE6DF] pt-1.5 mt-1 text-sm font-bold text-[#1A1A1A]">
                      <span>Tổng thanh toán:</span>
                      <span className="text-base font-display font-bold text-[#1A1A1A]">{formatPrice(selectedOrder.total)}</span>
                    </div>
                  </div>

                  {/* Note */}
                  {selectedOrder.note && (
                    <div className="bg-[#FAF8F5] border border-dashed border-[#EAE6DF] rounded-lg p-3 text-xs">
                      <p className="font-bold text-[#8E877F] uppercase text-[9px] tracking-wider mb-1">Ghi chú từ khách hàng</p>
                      <p className="text-[#615C56] italic">"{selectedOrder.note}"</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[#EAE6DF] bg-white flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setSelectedOrderId(null)} 
                className="px-4 py-2 border border-[#EAE6DF] rounded-lg text-xs font-semibold text-[#615C56] hover:bg-[#FAF8F5] transition-colors"
              >
                Đóng
              </button>
            </div>

          </div>
        </div>
      )}
    </AdminLayout>
  )
}
