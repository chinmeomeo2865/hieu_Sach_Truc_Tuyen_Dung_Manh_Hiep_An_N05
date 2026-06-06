import { useEffect, useState, useCallback } from 'react'
import { api }          from '../../services/api'
import { useToastStore } from '../../store/toastStore'
import { formatPrice }  from '../../utils/format'
import AdminLayout      from '../../components/admin/AdminLayout'

const STATUS_LABEL = {
  PENDING:   { text: 'Chờ xác nhận',  color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  CONFIRMED: { text: 'Đã xác nhận',   color: 'bg-blue-50 text-blue-700 border-blue-200' },
  PACKING:   { text: 'Đang đóng gói', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  SHIPPING:  { text: 'Đang giao',     color: 'bg-orange-50 text-orange-700 border-orange-200' },
  DELIVERED: { text: 'Đã giao',       color: 'bg-green-50 text-green-700 border-green-200' },
  CANCELLED: { text: 'Đã hủy',        color: 'bg-red-50 text-red-700 border-red-200' },
  RETURNED:  { text: 'Hoàn trả',      color: 'bg-gray-50 text-gray-600 border-gray-200' },
}

const NEXT_ACTION = {
  PENDING:   { label: '→ ĐÃ XÁC NHẬN',    next: 'CONFIRMED' },
  CONFIRMED: { label: 'BẮT ĐẦU ĐÓNG GÓI', next: 'PACKING'   },
  PACKING:   { label: 'GIAO VẬN CHUYỂN',  next: 'SHIPPING'  },
  SHIPPING:  { label: 'ĐÁNH DẤU ĐÃ GIAO', next: 'DELIVERED' },
}

const CAN_CANCEL = ['PENDING', 'CONFIRMED']

const FILTER_TABS = [
  { value: 'all',       label: 'TẤT CẢ',        color: 'border-t-[#615C56]' },
  { value: 'PENDING',   label: 'CHỜ XÁC NHẬN',  color: 'border-t-[#F59E0B]' },
  { value: 'CONFIRMED', label: 'ĐÃ XÁC NHẬN',   color: 'border-t-[#3B82F6]' },
  { value: 'PACKING',   label: 'ĐÓNG GÓI',      color: 'border-t-[#8B5CF6]' },
  { value: 'SHIPPING',  label: 'ĐANG GIAO',     color: 'border-t-[#F97316]' },
  { value: 'DELIVERED', label: 'ĐÃ GIAO',       color: 'border-t-[#059669]' },
  { value: 'CANCELLED', label: 'ĐÃ HỦY',        color: 'border-t-[#DC2626]' },
]

const LIMIT = 20

function ProgressTimeline({ order }) {
  const steps = [
    { key: 'PENDING',   short: 'CH', label: 'Chờ xác nhận' },
    { key: 'CONFIRMED', short: 'XN', label: 'Đã xác nhận' },
    { key: 'PACKING',   short: 'ĐG', label: 'Đóng gói' },
    { key: 'SHIPPING',  short: 'GH', label: 'Đang giao' },
    { key: 'DELIVERED', short: 'OK', label: 'Đã giao thành công' }
  ]

  const statusIdx = steps.findIndex(s => s.key === order.status)
  
  if (order.status === 'CANCELLED') {
    return (
      <div className="flex flex-col items-center font-sans">
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FEF2F2] text-[#DC2626] border border-[#FEE2E2] uppercase tracking-wide">
          ✕ Đã hủy
        </span>
        {order.note && (
          <span className="text-[10px] text-[#8E877F] italic mt-0.5 line-clamp-1 max-w-[150px]" title={order.note}>
            Lý do: "{order.note}"
          </span>
        )}
      </div>
    )
  }
  
  if (order.status === 'RETURNED') {
    return (
      <div className="flex flex-col items-center font-sans">
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#F4F4F5] text-[#71717A] border border-[#E4E4E7] uppercase tracking-wide">
          ✕ Đã hoàn trả
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center gap-1 font-sans">
      {steps.map((step, idx) => {
        const isDone = idx <= statusIdx
        const isActive = idx === statusIdx
        
        let dotColor = 'bg-[#FAF8F5] border-[#EAE6DF] text-[#9B9389]'
        if (isDone) {
          if (step.key === 'PENDING') dotColor = 'bg-[#C6923B] border-[#B5812E] text-white font-bold'
          else if (step.key === 'CONFIRMED') dotColor = 'bg-[#4B79A1] border-[#3A6890] text-white font-bold'
          else if (step.key === 'PACKING') dotColor = 'bg-[#8E6CA6] border-[#7B5993] text-white font-bold'
          else if (step.key === 'SHIPPING') dotColor = 'bg-[#D2694E] border-[#BF563B] text-white font-bold'
          else if (step.key === 'DELIVERED') dotColor = 'bg-[#4A8561] border-[#38724E] text-white font-bold'

          if (isActive) {
            if (step.key === 'PENDING') dotColor += ' ring-2 ring-offset-2 ring-[#C6923B]'
            else if (step.key === 'CONFIRMED') dotColor += ' ring-2 ring-offset-2 ring-[#4B79A1]'
            else if (step.key === 'PACKING') dotColor += ' ring-2 ring-offset-2 ring-[#8E6CA6]'
            else if (step.key === 'SHIPPING') dotColor += ' ring-2 ring-offset-2 ring-[#D2694E]'
            else if (step.key === 'DELIVERED') dotColor += ' ring-2 ring-offset-2 ring-[#4A8561]'
          }
        }
        
        return (
          <div key={step.key} className="flex items-center relative group">
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[9px] z-10 transition-all ${dotColor}`}>
              {step.short}
            </div>

            {idx < steps.length - 1 && (
              <div className="w-4 h-[2px] bg-[#EAE6DF] z-0">
                <div className={`h-full bg-[#D1C7BD] transition-all duration-300 ${idx < statusIdx ? 'w-full' : 'w-0'}`} />
              </div>
            )}

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1A1A1A] text-white text-[9px] rounded px-1.5 py-0.5 whitespace-nowrap z-50 pointer-events-none shadow-md">
              {step.label}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function AdminOrdersPage() {
  const showToast = useToastStore(s => s.show)

  const [orders, setOrders]         = useState([])
  const [stats, setStats]           = useState({ all: 0, PENDING: 0, CONFIRMED: 0, PACKING: 0, SHIPPING: 0, DELIVERED: 0, CANCELLED: 0 })
  const [loading, setLoading]       = useState(true)
  const [actionLoading, setAction]  = useState(null) // orderId being updated
  const [statusFilter, setFilter]   = useState('all')
  const [page, setPage]             = useState(1)
  const [pagination, setPagination] = useState(null)
  const [expanded, setExpanded]     = useState(null) // orderId of expanded detail
  
  // Search and advanced filters
  const [searchTerm, setSearchTerm] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [filterDate, setFilterDate] = useState('')

  // Checkbox selections
  const [selectedOrderIds, setSelectedOrderIds] = useState([])

  const fetchOrders = useCallback(async (status, pg, search, payment, date) => {
    setLoading(true)
    try {
      const qs = new URLSearchParams({ page: pg, limit: LIMIT })
      if (status !== 'all') qs.set('status', status)
      if (search) qs.set('search', search)
      if (payment !== 'all') qs.set('payment', payment)
      if (date) qs.set('date', date)
      
      const res = await api.get(`/api/orders/admin/all?${qs}`)
      setOrders(res.data)
      setPagination(res.pagination || null)
    } catch (err) {
      showToast({ message: err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [showToast])

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/api/orders/admin/all?limit=1000')
      const all = res.data
      setStats({
        all:       all.length,
        PENDING:   all.filter(o => o.status === 'PENDING').length,
        CONFIRMED: all.filter(o => o.status === 'CONFIRMED').length,
        PACKING:   all.filter(o => o.status === 'PACKING').length,
        SHIPPING:  all.filter(o => o.status === 'SHIPPING').length,
        DELIVERED: all.filter(o => o.status === 'DELIVERED').length,
        CANCELLED: all.filter(o => o.status === 'CANCELLED').length,
      })
    } catch {}
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  useEffect(() => {
    fetchOrders(statusFilter, page, searchTerm, paymentFilter, filterDate)
    setSelectedOrderIds([]) // Reset selections when filters or page changes
  }, [statusFilter, page, searchTerm, paymentFilter, filterDate, fetchOrders])

  function handleFilterChange(val) {
    setFilter(val)
    setPage(1)
    setExpanded(null)
  }

  async function handleNextStatus(orderId, nextStatus) {
    setAction(orderId)
    try {
      await api.put(`/api/orders/${orderId}/status`, { status: nextStatus })
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: nextStatus } : o))
      showToast({ message: `Đã cập nhật trạng thái: ${STATUS_LABEL[nextStatus]?.text}`, type: 'success' })
      fetchStats()
    } catch (err) {
      showToast({ message: err.message, type: 'error' })
    } finally {
      setAction(null)
    }
  }

  async function handleCancel(orderId) {
    if (!confirm('Xác nhận hủy đơn hàng này?')) return
    setAction(orderId)
    try {
      await api.put(`/api/orders/${orderId}/cancel`)
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: 'CANCELLED' } : o))
      showToast({ message: 'Đã hủy đơn hàng', type: 'info' })
      fetchStats()
    } catch (err) {
      showToast({ message: err.message, type: 'error' })
    } finally {
      setAction(null)
    }
  }

  // Bulk status update action
  const handleBulkStatusChange = async (nextStatus) => {
    const validOrders = orders.filter(o => selectedOrderIds.includes(o._id) && NEXT_ACTION[o.status]?.next === nextStatus)
    if (validOrders.length === 0) {
      showToast({ message: 'Không có đơn hàng nào hợp lệ được chọn cho hành động này!', type: 'warning' })
      return
    }
    if (!confirm(`Xác nhận cập nhật trạng thái cho ${validOrders.length} đơn hàng đã chọn?`)) return
    
    setLoading(true)
    try {
      await Promise.all(validOrders.map(o => api.put(`/api/orders/${o._id}/status`, { status: nextStatus })))
      showToast({ message: `Đã cập nhật trạng thái thành công cho ${validOrders.length} đơn hàng!`, type: 'success' })
      fetchOrders(statusFilter, page, searchTerm, paymentFilter, filterDate)
      fetchStats()
      setSelectedOrderIds([])
    } catch (err) {
      showToast({ message: err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Bulk cancel action
  const handleBulkCancel = async () => {
    const validOrders = orders.filter(o => selectedOrderIds.includes(o._id) && CAN_CANCEL.includes(o.status))
    if (validOrders.length === 0) {
      showToast({ message: 'Không có đơn hàng nào có thể hủy được chọn!', type: 'warning' })
      return
    }
    if (!confirm(`Xác nhận hủy ${validOrders.length} đơn hàng đã chọn?`)) return
    
    setLoading(true)
    try {
      await Promise.all(validOrders.map(o => api.put(`/api/orders/${o._id}/cancel`)))
      showToast({ message: `Đã hủy thành công ${validOrders.length} đơn hàng!`, type: 'info' })
      fetchOrders(statusFilter, page, searchTerm, paymentFilter, filterDate)
      fetchStats()
      setSelectedOrderIds([])
    } catch (err) {
      showToast({ message: err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Individual print invoice
  const handlePrintInvoice = (order) => {
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Hóa Đơn ${order.orderCode || order._id.toUpperCase()}</title>
          <style>
            body { font-family: "Times New Roman", Times, serif; padding: 40px; color: #1a1a1a; max-width: 600px; margin: 0 auto; border: 1px solid #eae6df; }
            .header { text-align: center; margin-bottom: 25px; }
            .header h2 { margin: 0; font-size: 22px; font-weight: bold; letter-spacing: 1px; }
            .header p { margin: 5px 0 0; font-size: 13px; color: #615c56; }
            .meta-section { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; font-size: 13px; }
            .meta-section p { margin: 4px 0; }
            .meta-title { font-weight: bold; text-transform: uppercase; font-size: 11px; color: #615c56; border-bottom: 1px solid #eae6df; padding-bottom: 4px; margin-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
            th { border-bottom: 2px solid #1a1a1a; padding: 8px 4px; text-align: left; font-size: 11px; font-weight: bold; color: #615c56; }
            td { border-bottom: 1px solid #eae6df; padding: 8px 4px; }
            .total-section { text-align: right; margin-top: 25px; font-size: 13px; }
            .total-section p { margin: 5px 0; }
            .grand-total { font-size: 16px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>HIỆU SÁCH CHIN</h2>
            <p>Hóa đơn bán hàng — Mã đơn: ${order.orderCode || '#' + order._id.slice(-8).toUpperCase()}</p>
            <p>Ngày đặt: ${new Date(order.createdAt).toLocaleString('vi-VN')}</p>
          </div>
          
          <div class="meta-section">
            <div>
              <div class="meta-title">Thông tin giao hàng</div>
              <p><strong>Người nhận:</strong> ${order.address?.name || 'Khách vãng lai'}</p>
              <p><strong>Điện thoại:</strong> ${order.address?.phone || 'N/A'}</p>
              <p><strong>Địa chỉ:</strong> ${order.address ? `${order.address.street}, ${order.address.city}` : 'N/A'}</p>
            </div>
            <div>
              <div class="meta-title">Phương thức thanh toán</div>
              <p>${order.payment === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : 'Thanh toán online (Chuyển khoản)'}</p>
              ${order.note ? `<p><strong>Ghi chú:</strong> <em>"${order.note}"</em></p>` : ''}
            </div>
          </div>

          <div class="meta-title">Danh sách sách</div>
          <table>
            <thead>
              <tr>
                <th>TÊN SÁCH</th>
                <th>TÁC GIẢ</th>
                <th>SL</th>
                <th>ĐƠN GIÁ</th>
                <th style="text-align: right;">THÀNH TIỀN</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td><strong>${item.title}</strong></td>
                  <td>${item.author || ''}</td>
                  <td>${item.qty}</td>
                  <td>${item.price.toLocaleString('vi-VN')} đ</td>
                  <td style="text-align: right;">${(item.price * item.qty).toLocaleString('vi-VN')} đ</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total-section">
            <p>Tổng tiền hàng: ${order.items.reduce((sum, item) => sum + item.price * item.qty, 0).toLocaleString('vi-VN')} đ</p>
            ${order.discount > 0 ? `<p>Giảm giá: -${order.discount.toLocaleString('vi-VN')} đ</p>` : ''}
            <p class="grand-total">Tổng thanh toán: ${order.total.toLocaleString('vi-VN')} đ</p>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); }
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  // Bulk print invoices
  const handleBulkPrint = () => {
    const selectedOrders = orders.filter(o => selectedOrderIds.includes(o._id))
    if (selectedOrders.length === 0) return
    
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>In Hóa Đơn Hàng Loạt</title>
          <style>
            body { font-family: "Times New Roman", Times, serif; padding: 20px; color: #1a1a1a; }
            .invoice-container { page-break-after: always; border-bottom: 2px dashed #eae6df; padding-bottom: 30px; margin-bottom: 30px; }
            .invoice-container:last-child { page-break-after: avoid; border-bottom: none; }
            .header { text-align: center; margin-bottom: 25px; }
            .header h2 { margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 1px; }
            .header p { margin: 5px 0 0; font-size: 12px; color: #615c56; }
            .meta-section { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; font-size: 13px; }
            .meta-section p { margin: 4px 0; }
            .meta-title { font-weight: bold; text-transform: uppercase; font-size: 11px; color: #615c56; border-bottom: 1px solid #eae6df; padding-bottom: 4px; margin-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
            th { border-bottom: 2px solid #1a1a1a; padding: 8px 4px; text-align: left; font-size: 11px; font-weight: bold; color: #615c56; }
            td { border-bottom: 1px solid #eae6df; padding: 8px 4px; }
            .total-section { text-align: right; margin-top: 20px; font-size: 13px; }
            .total-section p { margin: 5px 0; }
            .grand-total { font-size: 15px; font-weight: bold; }
          </style>
        </head>
        <body>
          ${selectedOrders.map(o => `
            <div class="invoice-container">
               <div class="header">
                 <h2>HIỆU SÁCH CHIN</h2>
                 <p>Hóa đơn bán hàng — Mã đơn: ${o.orderCode || '#' + o._id.slice(-8).toUpperCase()}</p>
                 <p>Ngày đặt: ${new Date(o.createdAt).toLocaleString('vi-VN')}</p>
               </div>
               
               <div class="meta-section">
                 <div>
                   <div class="meta-title">Thông tin giao hàng</div>
                   <p><strong>Người nhận:</strong> ${o.address?.name || 'Khách vãng lai'}</p>
                   <p><strong>Điện thoại:</strong> ${o.address?.phone || 'N/A'}</p>
                   <p><strong>Địa chỉ:</strong> ${o.address ? `${o.address.street}, ${o.address.city}` : 'N/A'}</p>
                 </div>
                 <div>
                   <div class="meta-title">Phương thức thanh toán</div>
                   <p>${o.payment === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : 'Thanh toán online (Chuyển khoản)'}</p>
                   ${o.note ? `<p><strong>Ghi chú:</strong> <em>"${o.note}"</em></p>` : ''}
                 </div>
               </div>

               <div class="meta-title">Danh sách sách</div>
               <table>
                 <thead>
                   <tr>
                     <th>TÊN SÁCH</th>
                     <th>TÁC GIẢ</th>
                     <th>SL</th>
                     <th>ĐƠN GIÁ</th>
                     <th style="text-align: right;">THÀNH TIỀN</th>
                   </tr>
                 </thead>
                 <tbody>
                   ${o.items.map(item => `
                     <tr>
                       <td><strong>${item.title}</strong></td>
                       <td>${item.author || ''}</td>
                       <td>${item.qty}</td>
                       <td>${item.price.toLocaleString('vi-VN')} đ</td>
                       <td style="text-align: right;">${(item.price * item.qty).toLocaleString('vi-VN')} đ</td>
                     </tr>
                   `).join('')}
                 </tbody>
               </table>

               <div class="total-section">
                 <p>Tổng tiền hàng: ${o.items.reduce((sum, item) => sum + item.price * item.qty, 0).toLocaleString('vi-VN')} đ</p>
                 ${o.discount > 0 ? `<p>Giảm giá: -${o.discount.toLocaleString('vi-VN')} đ</p>` : ''}
                 <p class="grand-total">Tổng thanh toán: ${o.total.toLocaleString('vi-VN')} đ</p>
               </div>
            </div>
          `).join('')}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); }
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  // Checkbox interactions
  const handleSelectOrder = (orderId) => {
    setSelectedOrderIds(prev => 
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    )
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedOrderIds(orders.map(o => o._id))
    } else {
      setSelectedOrderIds([])
    }
  }

  const selectedOrders = orders.filter(o => selectedOrderIds.includes(o._id))
  const hasPending = selectedOrders.some(o => o.status === 'PENDING')
  const hasConfirmed = selectedOrders.some(o => o.status === 'CONFIRMED')
  const hasPacking = selectedOrders.some(o => o.status === 'PACKING')
  const hasShipping = selectedOrders.some(o => o.status === 'SHIPPING')
  const hasCancelable = selectedOrders.some(o => ['PENDING', 'CONFIRMED'].includes(o.status))

  return (
    <AdminLayout title="Quản lý đơn hàng">
      {/* Page header title with decorative underline */}
      <div className="text-center mb-8 mt-2">
        <h2 className="font-display text-[16px] font-bold uppercase tracking-wider text-[#1A1A1A]">
          Quản lý tiến độ giao hàng
        </h2>
        <div className="w-12 h-0.5 bg-[#1A1A1A] mx-auto mt-2" />
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-6">
        {FILTER_TABS.map(tab => {
          const isActive = statusFilter === tab.value
          const count = tab.value === 'all' ? stats.all : stats[tab.value] || 0
          return (
            <button
              key={tab.value}
              onClick={() => handleFilterChange(tab.value)}
              className={`flex flex-col items-center bg-white border border-[#EAE6DF] rounded-md px-3 py-2.5 transition-all text-center border-t-4 ${tab.color} ${
                isActive 
                  ? 'bg-[#FAF8F5] border-[#1A1A1A] shadow-sm font-semibold' 
                  : 'hover:border-[#9B9389]'
              }`}
            >
              <span className={`text-[15px] font-bold ${isActive ? 'text-[#1A1A1A]' : 'text-[#615C56]'}`}>
                {count}
              </span>
              <span className="text-[9px] font-bold text-[#615C56] mt-1 tracking-wider">
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Filter and Search Bar Container */}
      <div className="bg-white border border-[#EAE6DF] rounded-md p-4 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Column 1: Keyword search */}
          <div>
            <label className="block text-[10px] font-bold text-[#615C56] uppercase tracking-wider mb-1.5">
              Tìm kiếm từ khóa:
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Nhập mã ĐH, tên, SĐT, email..."
              className="w-full px-3 py-1.5 border border-[#EAE6DF] rounded-md text-[11px] focus:outline-none focus:border-[#1A1A1A] bg-[#FAF8F5] text-[#1A1A1A]"
            />
          </div>

          {/* Column 2: Payment method */}
          <div>
            <label className="block text-[10px] font-bold text-[#615C56] uppercase tracking-wider mb-1.5">
              Phương thức thanh toán:
            </label>
            <select
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value)}
              className="w-full px-3 py-1.5 border border-[#EAE6DF] rounded-md text-[11px] focus:outline-none focus:border-[#1A1A1A] bg-[#FAF8F5] text-[#1A1A1A]"
            >
              <option value="all">Tất cả hình thức</option>
              <option value="COD">Thanh toán khi nhận hàng (COD)</option>
              <option value="ONLINE">Thanh toán online (Chuyển khoản)</option>
            </select>
          </div>

          {/* Column 3: Date picker with quick buttons */}
          <div>
            <label className="block text-[10px] font-bold text-[#615C56] uppercase tracking-wider mb-1.5">
              Lọc ngày đặt:
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="w-full px-3 py-1.5 border border-[#EAE6DF] rounded-md text-[11px] focus:outline-none focus:border-[#1A1A1A] bg-[#FAF8F5] text-[#1A1A1A] mb-2"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setFilterDate(new Date().toISOString().split('T')[0])}
                className="flex-1 py-1 border border-[#EAE6DF] text-[#615C56] hover:text-[#1A1A1A] hover:border-[#1A1A1A] bg-white rounded-md text-[10px] font-semibold transition-colors"
              >
                HÔM NAY
              </button>
              <button
                onClick={() => setFilterDate('')}
                className="flex-1 py-1 bg-[#1A1A1A] text-white hover:bg-black rounded-md text-[10px] font-semibold transition-colors"
              >
                TẤT CẢ NGÀY
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List / Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-white border border-[#EAE6DF] rounded-md animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-[#EAE6DF] rounded-md py-20 text-center">
          <p className="text-muted text-xs">Không tìm thấy đơn hàng nào</p>
        </div>
      ) : (
        <div className="bg-white border border-[#EAE6DF] rounded-md shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse text-xs min-w-[1050px] font-sans table-fixed">
              <thead>
                <tr className="border-b border-[#EAE6DF] text-[#615C56] bg-[#FAF8F5] select-none">
                  <th className="py-3 px-4 w-[4%] text-center">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={orders.length > 0 && selectedOrderIds.length === orders.length}
                      className="cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-2 font-semibold text-[#8E877F] uppercase tracking-wider text-[10px] w-[12%] text-center">MÃ ĐH</th>
                  <th className="py-3 px-2 font-semibold text-[#8E877F] uppercase tracking-wider text-[10px] w-[22%] text-center">KHÁCH HÀNG</th>
                  <th className="py-3 px-2 font-semibold text-[#8E877F] uppercase tracking-wider text-[10px] w-[12%] text-center">TỔNG TIỀN</th>
                  <th className="py-3 px-2 font-semibold text-[#8E877F] uppercase tracking-wider text-[10px] w-[14%] text-center">NGÀY ĐẶT</th>
                  <th className="py-3 px-2 font-semibold text-[#8E877F] uppercase tracking-wider text-[10px] w-[20%] text-center">TIẾN ĐỘ GIAO HÀNG</th>
                  <th className="py-3 px-4 font-semibold text-[#8E877F] uppercase tracking-wider text-[10px] w-[16%] text-center">HÀNH ĐỘNG</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => {
                  const action = NEXT_ACTION[order.status]
                  const canCancel = CAN_CANCEL.includes(order.status)
                  const isSelected = selectedOrderIds.includes(order._id)
                  const isExpanded = expanded === order._id
                  const busy = actionLoading === order._id

                  return (
                    <tr 
                      key={order._id}
                      className={`border-b border-[#EAE6DF] hover:bg-[#FAF8F5]/30 transition-colors last:border-0 align-middle ${
                        isSelected ? 'bg-[#FAF8F5]/50' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 w-[4%] text-center align-middle">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOrder(order._id)}
                          className="cursor-pointer"
                        />
                      </td>

                      {/* Order ID */}
                      <td className="py-3.5 px-2 w-[12%] font-semibold text-[#1A1A1A] font-mono align-middle text-center">
                        {order.orderCode || `#${order._id.slice(-8).toUpperCase()}`}
                      </td>

                      {/* Customer info */}
                      <td className="py-3.5 px-2 w-[22%] align-middle text-center">
                        <div className="flex flex-col items-center justify-center">
                          <span className="font-semibold text-[#1A1A1A] text-[12px] flex items-center justify-center gap-1.5">
                            {order.address?.name || order.user?.name || 'Khách vãng lai'}
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase tracking-wider ${
                              order.payment === 'COD' 
                                ? 'bg-amber-50 text-amber-600 border-amber-200/50' 
                                : 'bg-green-50 text-green-700 border-green-200/50'
                            }`}>
                              {order.payment}
                            </span>
                          </span>
                          <span className="text-[#8E877F] text-[10px] mt-0.5 font-normal">
                            {order.address?.phone || order.user?.email || 'N/A'}
                          </span>
                        </div>
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-2 w-[12%] font-bold text-[#1A1A1A] text-[12px] align-middle text-center">
                        {formatPrice(order.total)}
                      </td>

                      {/* Creation Date */}
                      <td className="py-3.5 px-2 w-[14%] text-[#615C56] align-middle text-center">
                        <div className="flex flex-col items-center justify-center">
                          <span className="font-semibold">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                          <span className="text-[10px] text-[#8E877F] mt-0.5">{new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        </div>
                      </td>

                      {/* Progress Timeline */}
                      <td className="py-3.5 px-2 w-[20%] text-center align-middle">
                        <ProgressTimeline order={order} />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 w-[16%] text-center align-middle">
                        <div className="flex flex-col gap-1 items-stretch justify-center w-36 mx-auto">
                          <button
                            onClick={() => setExpanded(isExpanded ? null : order._id)}
                            className="px-2.5 py-1.5 font-sans bg-white border border-[#EAE6DF] text-[#615C56] hover:text-[#1A1A1A] hover:bg-[#FAF8F5] hover:border-[#9B9389] rounded-md text-[10px] font-medium tracking-wide transition-all duration-200 whitespace-nowrap text-center shadow-sm"
                          >
                            CHI TIẾT
                          </button>
                          <button
                            onClick={() => handlePrintInvoice(order)}
                            className="px-2.5 py-1.5 font-sans bg-white border border-[#EAE6DF] text-[#615C56] hover:text-[#1A1A1A] hover:bg-[#FAF8F5] hover:border-[#9B9389] rounded-md text-[10px] font-medium tracking-wide transition-all duration-200 whitespace-nowrap text-center shadow-sm"
                          >
                            IN HÓA ĐƠN
                          </button>
                          {action && (
                            <button
                              disabled={busy}
                              onClick={() => handleNextStatus(order._id, action.next)}
                              className="px-2.5 py-1.5 font-sans bg-[#2E4A3F] text-white hover:bg-[#1E3029] active:bg-[#15221D] disabled:opacity-50 text-[10px] font-semibold tracking-wider rounded-md transition-all duration-200 whitespace-nowrap text-center shadow-sm uppercase"
                            >
                              {busy ? '…' : action.label}
                            </button>
                          )}
                          {canCancel && (
                            <button
                              disabled={busy}
                              onClick={() => handleCancel(order._id)}
                              className="px-2.5 py-1.5 font-sans text-[10px] font-semibold text-red-600 border border-red-200 rounded-md hover:bg-red-50 hover:border-red-300 disabled:opacity-50 transition-all duration-200 whitespace-nowrap text-center shadow-sm uppercase"
                            >
                              HỦY ĐƠN
                            </button>
                          )}
                          {order.status === 'DELIVERED' && (
                            <span className="px-2.5 py-1.5 font-sans bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7] rounded-md text-[10px] font-bold tracking-wider whitespace-nowrap text-center shadow-sm">
                              ✓ HOÀN THÀNH
                            </span>
                          )}
                          {order.status === 'CANCELLED' && (
                            <span className="px-2.5 py-1.5 font-sans bg-[#FEF2F2] text-[#DC2626] border border-[#FEE2E2] rounded-md text-[10px] font-bold tracking-wider whitespace-nowrap text-center shadow-sm">
                              ✕ ĐÃ HỦY
                            </span>
                          )}
                          {order.status === 'RETURNED' && (
                            <span className="px-2.5 py-1.5 font-sans bg-[#F4F4F5] text-[#71717A] border border-[#E4E4E7] rounded-md text-[10px] font-bold tracking-wider whitespace-nowrap text-center shadow-sm">
                              ✕ HOÀN TRẢ
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Inline Expanded Detail Drawer */}
          {expanded && (
            (() => {
              const order = orders.find(o => o._id === expanded)
              if (!order) return null
              return (
                <div className="bg-[#FAF8F5] border-t border-[#EAE6DF] px-6 py-5 select-text animate-slideDown">
                  <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-2.5 mb-4">
                    <p className="font-display text-[12.5px] font-bold uppercase tracking-wider text-[#1A1A1A]">
                      Chi tiết sách & Giao nhận đơn hàng
                    </p>
                    <button 
                      onClick={() => setExpanded(null)}
                      className="text-xs font-bold text-[#615C56] hover:text-[#1A1A1A]"
                    >
                      Đóng ✕
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Column 1: Items List */}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#8E877F] mb-3">Sách đã mua ({order.items?.length})</p>
                      <div className="space-y-2.5">
                        {order.items?.map((item, i) => (
                          <div key={i} className="flex items-center gap-3 bg-white border border-[#EAE6DF]/50 p-2 rounded-lg">
                            {item.image && (
                              <img src={item.image} alt={item.title} className="w-8 h-11 object-cover rounded shadow-sm shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-[11.5px] font-semibold text-[#1A1A1A] line-clamp-1">{item.title}</p>
                              <p className="text-[10px] text-[#8E877F] mt-0.5">{item.author} · x{item.qty}</p>
                            </div>
                            <span className="text-[11px] font-bold text-[#1A1A1A] shrink-0">{formatPrice(item.price * item.qty)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-3 border-t border-[#EAE6DF] flex justify-between items-center text-[12px]">
                        <span className="text-[#615C56]">Tổng giá trị tiền hàng:</span>
                        <span className="font-bold text-[#1A1A1A] text-[13px]">{formatPrice(order.total)}</span>
                      </div>
                    </div>

                    {/* Column 2: Meta logistics */}
                    <div className="space-y-4 text-[11px] text-[#1A1A1A]">
                      <div className="bg-white border border-[#EAE6DF]/50 p-3.5 rounded-lg">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#8E877F] mb-2">ĐỊA CHỈ NHẬN HÀNG</p>
                        <p className="font-semibold">{order.address?.name}</p>
                        <p className="text-[#615C56] mt-0.5">{order.address?.phone}</p>
                        <p className="text-[#615C56] mt-0.5">{order.address?.street}, {order.address?.city}</p>
                      </div>

                      <div className="bg-white border border-[#EAE6DF]/50 p-3.5 rounded-lg grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8E877F] mb-1.5">THANH TOÁN</p>
                          <p className="font-medium">{order.payment === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : 'Chuyển khoản (ONLINE)'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8E877F] mb-1.5">Coupon giảm giá</p>
                          <p className="font-medium text-[#615C56]">{order.couponCode ? `${order.couponCode} (-${formatPrice(order.discount)})` : 'Không sử dụng'}</p>
                        </div>
                      </div>

                      {order.note && (
                        <div className="bg-white border border-[#EAE6DF]/50 p-3.5 rounded-lg">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8E877F] mb-1">GHI CHÚ CỦA KHÁCH</p>
                          <p className="text-[#615C56] italic">"{order.note}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })()
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 select-none">
          <p className="text-[11px] text-[#615C56]">
            Trang {pagination.page}/{pagination.totalPages} · {pagination.total} đơn hàng
          </p>
          <div className="flex gap-1.5">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 text-[11px] font-semibold border border-[#EAE6DF] bg-white rounded-md text-[#615C56] hover:border-[#1A1A1A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Trước
            </button>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 text-[11px] font-semibold border border-[#EAE6DF] bg-white rounded-md text-[#615C56] hover:border-[#1A1A1A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Tiếp →
            </button>
          </div>
        </div>
      )}

      {/* Bulk Actions Floating Bar */}
      {selectedOrderIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1A1A1A] text-white py-3 px-6 rounded-xl shadow-2xl flex items-center gap-6 z-50 animate-slideUp border border-white/10 select-none">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[11.5px] font-medium tracking-wide">
              Đã chọn <strong className="text-emerald-400 text-[12.5px]">{selectedOrderIds.length}</strong> đơn hàng
            </span>
          </div>

          <div className="h-4 w-[1px] bg-white/20" />

          <div className="flex gap-2">
            {(statusFilter === 'PENDING' || (statusFilter === 'all' && hasPending)) && (
              <button
                onClick={() => handleBulkStatusChange('CONFIRMED')}
                className="px-3.5 py-1.5 bg-[#2E4A3F] hover:bg-[#233830] text-[10.5px] font-bold uppercase tracking-wider rounded-md transition-colors"
              >
                Xác nhận hàng loạt
              </button>
            )}
            {(statusFilter === 'CONFIRMED' || (statusFilter === 'all' && hasConfirmed)) && (
              <button
                onClick={() => handleBulkStatusChange('PACKING')}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-[10.5px] font-bold uppercase tracking-wider rounded-md transition-colors"
              >
                Đóng gói hàng loạt
              </button>
            )}
            {(statusFilter === 'PACKING' || (statusFilter === 'all' && hasPacking)) && (
              <button
                onClick={() => handleBulkStatusChange('SHIPPING')}
                className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-[10.5px] font-bold uppercase tracking-wider rounded-md transition-colors"
              >
                Giao shipper hàng loạt
              </button>
            )}
            {(statusFilter === 'SHIPPING' || (statusFilter === 'all' && hasShipping)) && (
              <button
                onClick={() => handleBulkStatusChange('DELIVERED')}
                className="px-3.5 py-1.5 bg-green-600 hover:bg-green-700 text-[10.5px] font-bold uppercase tracking-wider rounded-md transition-colors"
              >
                Giao thành công hàng loạt
              </button>
            )}
            {((['PENDING', 'CONFIRMED'].includes(statusFilter)) || (statusFilter === 'all' && hasCancelable)) && (
              <button
                onClick={handleBulkCancel}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-[10.5px] font-bold uppercase tracking-wider rounded-md transition-colors"
              >
                Hủy hàng loạt
              </button>
            )}
            <button
              onClick={handleBulkPrint}
              className="px-3.5 py-1.5 bg-white text-[#1A1A1A] hover:bg-[#FAF8F5] text-[10.5px] font-bold uppercase tracking-wider rounded-md transition-colors"
            >
              In hóa đơn hàng loạt
            </button>
            <button
              onClick={() => setSelectedOrderIds([])}
              className="px-2.5 py-1.5 text-white/50 hover:text-white text-[10.5px] font-semibold transition-colors"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
