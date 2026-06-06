import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate }            from 'react-router-dom'
import { motion, AnimatePresence }      from 'framer-motion'
import { api }                          from '../services/api'
import { useAuthStore }                 from '../store/authStore'
import { useCartStore }                 from '../store/cartStore'
import { useToastStore }                from '../store/toastStore'
import { formatPrice }                  from '../utils/format'

/* ─── Constants ─────────────────────────────────────────────── */

const PHONE_REGEX = /^0\d{9}$/

const STATUS_CFG = {
  PENDING:   { label: 'Chờ xác nhận',  dot: 'bg-amber-400',   text: 'text-amber-700',   bg: 'bg-amber-50/80'   },
  CONFIRMED: { label: 'Đã xác nhận',   dot: 'bg-sky-400',     text: 'text-sky-700',     bg: 'bg-sky-50/80'     },
  PACKING:   { label: 'Đang đóng gói', dot: 'bg-violet-400',  text: 'text-violet-700',  bg: 'bg-violet-50/80'  },
  SHIPPING:  { label: 'Đang giao',     dot: 'bg-orange-400',  text: 'text-orange-700',  bg: 'bg-orange-50/80'  },
  DELIVERED: { label: 'Đã giao',       dot: 'bg-emerald-400', text: 'text-emerald-700', bg: 'bg-emerald-50/80' },
  CANCELLED: { label: 'Đã hủy',        dot: 'bg-red-400',     text: 'text-red-600',     bg: 'bg-red-50/80'     },
  RETURNED:  { label: 'Hoàn trả',      dot: 'bg-gray-400',    text: 'text-gray-500',    bg: 'bg-gray-50/80'    },
}

const TIMELINE_STEPS = [
  { status: 'PENDING',   emoji: '📋', label: 'Đặt hàng thành công',    sub: 'Đơn hàng đã được đặt' },
  { status: 'CONFIRMED', emoji: '✅', label: 'Cửa hàng xác nhận',      sub: 'Cửa hàng đã tiếp nhận đơn' },
  { status: 'PACKING',   emoji: '📦', label: 'Đang đóng gói',          sub: 'Sản phẩm đang được chuẩn bị' },
  { status: 'SHIPPING',  emoji: '🚚', label: 'Đang vận chuyển',        sub: 'Đơn hàng trên đường giao' },
  { status: 'DELIVERED', emoji: '🎉', label: 'Giao hàng thành công',   sub: 'Bạn đã nhận được hàng' },
]
const STATUS_ORDER = ['PENDING', 'CONFIRMED', 'PACKING', 'SHIPPING', 'DELIVERED']

const TABS = [
  { key: 'all',       label: 'Tất cả' },
  { key: 'PENDING',   label: 'Chờ xác nhận' },
  { key: 'PACKING',   label: 'Đóng gói' },
  { key: 'SHIPPING',  label: 'Vận chuyển' },
  { key: 'DELIVERED', label: 'Đã giao' },
  { key: 'CANCELLED', label: 'Đã hủy' },
]

/* ─── Helpers ───────────────────────────────────────────────── */

const fmtDate = d => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
const fmtTime = d => new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

const slideUp = {
  initial:    { y: '100%', opacity: 0 },
  animate:    { y: 0, opacity: 1 },
  exit:       { y: '100%', opacity: 0 },
  transition: { type: 'spring', damping: 28, stiffness: 300 },
}

/* ─── Primitive components ──────────────────────────────────── */

function AvatarCircle({ name, size = 'lg' }) {
  const letter = name?.charAt(0)?.toUpperCase() || '?'
  const sz = { lg: 'w-16 h-16 text-xl', md: 'w-10 h-10 text-sm', sm: 'w-8 h-8 text-xs' }[size]
  return (
    <div className={`${sz} rounded-full bg-ink text-white flex items-center justify-center font-display font-bold flex-shrink-0 select-none`}>
      {letter}
    </div>
  )
}

function StatusBadge({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.PENDING
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${c.text} ${c.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
      {c.label}
    </span>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-divider-lt rounded-2xl p-5 space-y-4 animate-pulse">
      <div className="flex justify-between">
        <div className="h-4 w-28 bg-surface-subtle rounded-full" />
        <div className="h-4 w-20 bg-surface-subtle rounded-full" />
      </div>
      <div className="flex gap-3">
        <div className="w-11 h-[60px] bg-surface-subtle rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-3.5 bg-surface-subtle rounded-full w-3/4" />
          <div className="h-3 bg-surface-subtle rounded-full w-1/2" />
        </div>
      </div>
      <div className="flex justify-between items-center pt-3 border-t border-divider-lt">
        <div className="h-5 w-20 bg-surface-subtle rounded-full" />
        <div className="h-7 w-24 bg-surface-subtle rounded-xl" />
      </div>
    </div>
  )
}

function EmptyOrders({ tab }) {
  const config = {
    all:       { emoji: '🛍️', title: 'Chưa có đơn hàng nào',          sub: 'Khám phá kho sách và đặt cuốn sách yêu thích của bạn!' },
    PENDING:   { emoji: '⏳', title: 'Không có đơn chờ xác nhận',      sub: '' },
    PACKING:   { emoji: '📦', title: 'Không có đơn đang đóng gói',     sub: '' },
    SHIPPING:  { emoji: '🚚', title: 'Không có đơn đang vận chuyển',   sub: '' },
    DELIVERED: { emoji: '✅', title: 'Chưa có đơn nào hoàn thành',     sub: '' },
    CANCELLED: { emoji: '🚫', title: 'Không có đơn nào bị hủy',        sub: '' },
  }
  const m = config[tab] || config.all
  return (
    <div className="py-16 flex flex-col items-center gap-3 text-center px-6">
      <span className="text-5xl mb-1">{m.emoji}</span>
      <p className="font-display font-semibold text-ink text-lg">{m.title}</p>
      {m.sub && <p className="text-sm text-muted max-w-xs leading-relaxed">{m.sub}</p>}
      <Link to="/books" className="mt-3 px-6 py-2.5 bg-ink text-white text-2xs font-semibold tracking-label-lg uppercase rounded-sm hover:bg-ink-80 transition-colors">
        Khám phá sách
      </Link>
    </div>
  )
}

/* ─── Order Timeline ────────────────────────────────────────── */

function OrderTimeline({ order }) {
  if (order.status === 'CANCELLED') {
    const cancelledAt = order.statusHistory?.find(h => h.status === 'CANCELLED')?.changedAt || order.updatedAt
    return (
      <div className="space-y-0">
        {/* Step 1: placed */}
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-9 h-9 rounded-full bg-ink text-white flex items-center justify-center text-sm flex-shrink-0">📋</div>
            <div className="w-0.5 h-10 my-1 bg-divider-lt rounded-full" />
          </div>
          <div className="flex-1 pt-1 pb-3">
            <p className="text-sm font-semibold text-ink">Đặt hàng thành công</p>
            <p className="text-xs text-muted mt-0.5">{fmtDate(order.createdAt)} lúc {fmtTime(order.createdAt)}</p>
          </div>
        </div>
        {/* Step 2: cancelled */}
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-9 h-9 rounded-full bg-red-500 text-white flex items-center justify-center text-sm flex-shrink-0">✕</div>
          </div>
          <div className="flex-1 pt-1">
            <p className="text-sm font-semibold text-red-600">Đơn hàng đã bị hủy</p>
            <p className="text-xs text-muted mt-0.5">{fmtDate(cancelledAt)} lúc {fmtTime(cancelledAt)}</p>
          </div>
        </div>
      </div>
    )
  }

  const currentIdx = STATUS_ORDER.indexOf(order.status)
  const historyMap = {}
  order.statusHistory?.forEach(h => { historyMap[h.status] = h.changedAt })
  historyMap['PENDING'] = historyMap['PENDING'] || order.createdAt

  return (
    <div className="space-y-0">
      {TIMELINE_STEPS.map((step, i) => {
        const stepIdx   = STATUS_ORDER.indexOf(step.status)
        const isDone    = stepIdx <= currentIdx
        const isCurrent = stepIdx === currentIdx
        const isLast    = i === TIMELINE_STEPS.length - 1
        const ts        = historyMap[step.status]

        return (
          <div key={step.status} className="flex gap-4">
            <div className="flex flex-col items-center">
              <motion.div
                initial={false}
                animate={{ scale: isCurrent ? 1.12 : 1 }}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0 transition-colors duration-300
                  ${isCurrent ? 'bg-ink text-white ring-4 ring-ink/10' : isDone ? 'bg-ink text-white' : 'bg-surface-subtle text-subtle'}`}
              >
                {step.emoji}
              </motion.div>
              {!isLast && (
                <div className={`w-0.5 h-10 my-1 rounded-full transition-colors duration-500 ${isDone && stepIdx < currentIdx ? 'bg-ink' : 'bg-divider-lt'}`} />
              )}
            </div>
            <div className={`flex-1 pt-1 ${!isLast ? 'pb-3' : 'pb-1'}`}>
              <p className={`text-sm font-semibold leading-tight transition-colors ${isDone ? 'text-ink' : 'text-subtle'}`}>
                {step.label}
              </p>
              <p className={`text-xs mt-0.5 transition-colors ${isDone ? 'text-muted' : 'text-subtle/50'}`}>
                {ts ? `${fmtDate(ts)} lúc ${fmtTime(ts)}` : isCurrent ? 'Đang xử lý…' : step.sub}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Order Detail Modal ────────────────────────────────────── */

function OrderDetailModal({ order, onClose }) {
  const [repayLoading, setRepayLoading] = useState(false)
  const showToast = useToastStore(s => s.show)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  async function handleRepay(orderId) {
    setRepayLoading(true)
    try {
      const res = await api.post('/api/payments/payos/create', { orderId })
      if (res.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl
      } else {
        throw new Error('Không nhận được liên kết thanh toán từ hệ thống')
      }
    } catch (err) {
      showToast({ message: err.message || 'Lỗi khi tạo liên kết thanh toán', type: 'error' })
    } finally {
      setRepayLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-6"
      onClick={onClose}
    >
      <motion.div {...slideUp}
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-divider-lt flex-shrink-0">
          <div>
            <p className="text-2xs font-semibold tracking-label-lg uppercase text-muted">Chi tiết đơn hàng</p>
            <p className="font-display font-semibold text-ink mt-0.5">{order.orderCode || `#${order._id.slice(-8).toUpperCase()}`}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-subtle transition-colors text-muted hover:text-ink">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
          {/* Status + date */}
          <div className="flex items-center justify-between">
            <StatusBadge status={order.status} />
            <span className="text-xs text-muted">{fmtDate(order.createdAt)}</span>
          </div>

          {/* Timeline */}
          <div className="bg-surface-warm rounded-2xl p-5">
            <p className="text-2xs font-semibold tracking-label-lg uppercase text-muted mb-5">Theo dõi đơn hàng</p>
            <OrderTimeline order={order} />
          </div>

          {/* Items */}
          <div>
            <p className="text-2xs font-semibold tracking-label-lg uppercase text-muted mb-4">
              Sản phẩm ({order.items.length})
            </p>
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex gap-3 items-start">
                  {item.image
                    ? <img src={item.image} alt={item.title} className="w-12 h-16 object-cover rounded-xl flex-shrink-0" />
                    : <div className="w-12 h-16 bg-surface-subtle rounded-xl flex-shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink line-clamp-2 leading-snug">{item.title}</p>
                    <p className="text-xs text-muted mt-0.5">{item.author}</p>
                    <p className="text-xs text-subtle">x{item.qty}</p>
                  </div>
                  <span className="text-sm font-semibold text-ink flex-shrink-0">{formatPrice(item.price * item.qty)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery address */}
          {order.address && (
            <div>
              <p className="text-2xs font-semibold tracking-label-lg uppercase text-muted mb-3">Địa chỉ nhận hàng</p>
              <div className="bg-surface-warm rounded-2xl p-4 space-y-0.5">
                <p className="text-sm font-semibold text-ink">{order.address.name}</p>
                <p className="text-xs text-muted">{order.address.phone}</p>
                <p className="text-xs text-muted">{order.address.street}, {order.address.city}</p>
              </div>
            </div>
          )}

          {/* Total */}
          <div className="flex flex-col gap-3 pt-4 border-t border-divider-lt">
            {order.payment === 'ONLINE' && order.paymentStatus === 'UNPAID' && order.status === 'PENDING' && (
              <div className="bg-amber-50 border border-amber-200/50 rounded-xl p-3 text-xs text-amber-800 leading-relaxed font-sans flex flex-col gap-2.5">
                <div>
                  ⚠️ <strong>Vui lòng hoàn tất thanh toán:</strong> Đơn hàng trực tuyến của bạn chưa được thanh toán thành công. Vui lòng hoàn tất quét mã QR chuyển khoản để cửa hàng xác nhận và chuẩn bị sách.
                </div>
                <button
                  onClick={() => handleRepay(order._id)}
                  disabled={repayLoading}
                  className="w-full mt-1 py-2 bg-[#2E4A3F] hover:bg-[#1E3029] active:bg-[#15221D] disabled:opacity-50 text-white font-semibold rounded-xl text-center transition-colors font-sans shadow-sm uppercase text-[11px] tracking-wider"
                >
                  {repayLoading ? 'Đang tạo liên kết thanh toán…' : 'Thanh toán ngay (VietQR / PayOS)'}
                </button>
              </div>
            )}
            <div className="flex items-end justify-between w-full">
              <div className="text-xs text-muted">
                <p>
                  Thanh toán: <span className="font-medium text-ink">{order.payment === 'COD' ? 'Tiền mặt (COD)' : 'Online'}</span>
                </p>
                <p className="mt-1">
                  Trạng thái: <span className={`font-semibold ${
                    order.paymentStatus === 'PAID' ? 'text-emerald-600' :
                    order.paymentStatus === 'REFUNDED' ? 'text-gray-500' :
                    order.payment === 'COD' ? 'text-gray-600' : 'text-rose-500'
                  }`}>
                    {order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 
                     order.paymentStatus === 'REFUNDED' ? 'Đã hoàn tiền' : 
                     order.payment === 'COD' ? 'Chưa thu tiền (COD)' : 'Chưa thanh toán'}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xs text-muted uppercase tracking-label">Tổng cộng</p>
                <p className="font-display font-semibold text-ink text-xl">{formatPrice(order.total)}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─── Profile Edit Modal ────────────────────────────────────── */

function ProfileEditModal({ user, updateProfile, onClose }) {
  const showToast = useToastStore(s => s.show)
  const [form, setForm]     = useState({ name: user?.name || '', phone: user?.phone || '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const set = f => e => { setForm(p => ({ ...p, [f]: e.target.value })); setErrors(p => ({ ...p, [f]: '' })) }

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    const errs = {}
    if (!form.name.trim()) errs.name = 'Vui lòng nhập họ tên'
    if (form.phone && !PHONE_REGEX.test(form.phone.trim())) errs.phone = 'Số điện thoại không hợp lệ (10 số, bắt đầu 0)'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      await updateProfile({ name: form.name.trim(), phone: form.phone.trim() || undefined })
      showToast({ message: 'Cập nhật hồ sơ thành công', type: 'success' })
      onClose()
    } catch (err) {
      showToast({ message: err.message || 'Cập nhật thất bại', type: 'error' })
    } finally { setLoading(false) }
  }

  const inputCls = hasErr =>
    `w-full border rounded-xl px-4 py-2.5 text-sm text-ink placeholder:text-subtle focus:outline-none focus:border-ink transition-colors ${hasErr ? 'border-red-400 bg-red-50/30' : 'border-divider'}`

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-6"
      onClick={onClose}
    >
      <motion.div {...slideUp}
        className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-divider-lt">
          <p className="font-display font-semibold text-ink">Chỉnh sửa hồ sơ</p>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-subtle transition-colors text-muted hover:text-ink">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
          <div className="space-y-1">
            <label className="block text-2xs font-semibold tracking-label-lg uppercase text-muted">Email</label>
            <input value={user?.email || ''} disabled className="w-full border border-divider rounded-xl px-4 py-2.5 text-sm text-muted bg-surface-subtle cursor-not-allowed" />
            <p className="text-2xs text-subtle">Email không thể thay đổi</p>
          </div>
          <div className="space-y-1">
            <label className="block text-2xs font-semibold tracking-label-lg uppercase text-muted">Họ và tên</label>
            <input type="text" value={form.name} onChange={set('name')} placeholder="Nguyễn Văn A" className={inputCls(errors.name)} />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>
          <div className="space-y-1">
            <label className="block text-2xs font-semibold tracking-label-lg uppercase text-muted">Số điện thoại</label>
            <input type="tel" value={form.phone} onChange={set('phone')} placeholder="09x xxx xxxx" className={inputCls(errors.phone)} />
            {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
          </div>
          <div className="pt-2 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-divider rounded-xl text-sm font-medium text-ink-60 hover:border-ink hover:text-ink transition-colors">Hủy</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-ink text-white text-sm font-semibold rounded-xl hover:bg-ink-80 disabled:opacity-50 transition-colors">
              {loading ? 'Đang lưu…' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

/* ─── Change Password Modal ──────────────────────────────────── */

function PasswordModal({ changePassword, onClose }) {
  const showToast = useToastStore(s => s.show)
  const [form, setForm]     = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const set = f => e => { setForm(p => ({ ...p, [f]: e.target.value })); setErrors(p => ({ ...p, [f]: '' })) }

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!form.currentPassword) errs.currentPassword = 'Nhập mật khẩu hiện tại'
    if (!form.newPassword || form.newPassword.length < 6) errs.newPassword = 'Tối thiểu 6 ký tự'
    if (form.newPassword !== form.confirm) errs.confirm = 'Mật khẩu không khớp'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      await changePassword(form.currentPassword, form.newPassword)
      showToast({ message: 'Đổi mật khẩu thành công', type: 'success' })
      onClose()
    } catch (err) {
      showToast({ message: err.message || 'Đổi mật khẩu thất bại', type: 'error' })
    } finally { setLoading(false) }
  }

  const inputCls = hasErr =>
    `w-full border rounded-xl px-4 py-2.5 text-sm text-ink placeholder:text-subtle focus:outline-none focus:border-ink transition-colors ${hasErr ? 'border-red-400 bg-red-50/30' : 'border-divider'}`

  const FIELDS = [
    { field: 'currentPassword', label: 'Mật khẩu hiện tại' },
    { field: 'newPassword',     label: 'Mật khẩu mới' },
    { field: 'confirm',         label: 'Xác nhận mật khẩu mới' },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-6"
      onClick={onClose}
    >
      <motion.div {...slideUp}
        className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-divider-lt">
          <p className="font-display font-semibold text-ink">Đổi mật khẩu</p>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-subtle transition-colors text-muted hover:text-ink">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {FIELDS.map(({ field, label }) => (
            <div key={field} className="space-y-1">
              <label className="block text-2xs font-semibold tracking-label-lg uppercase text-muted">{label}</label>
              <input type="password" value={form[field]} onChange={set(field)} placeholder="••••••••" className={inputCls(errors[field])} />
              {errors[field] && <p className="text-xs text-red-500">{errors[field]}</p>}
            </div>
          ))}
          <div className="pt-2 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-divider rounded-xl text-sm font-medium text-ink-60 hover:border-ink hover:text-ink transition-colors">Hủy</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-ink text-white text-sm font-semibold rounded-xl hover:bg-ink-80 disabled:opacity-50 transition-colors">
              {loading ? 'Đang xử lý…' : 'Đổi mật khẩu'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

/* ─── Review Modal ──────────────────────────────────────────── */

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  const LABELS = ['', 'Tệ', 'Không tốt', 'Bình thường', 'Tốt', 'Xuất sắc']
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-115 active:scale-95"
        >
          <svg
            className={`w-8 h-8 transition-colors duration-100 ${(hovered || value) >= s ? 'text-star' : 'text-divider'}`}
            fill="currentColor" viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
      {(hovered || value) > 0 && (
        <span className="ml-1 text-sm font-semibold text-star">{LABELS[hovered || value]}</span>
      )}
    </div>
  )
}

function ReviewModal({ item, orderId, onSuccess, onClose }) {
  const showToast = useToastStore(s => s.show)
  const [rating,  setRating]  = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [ratingErr, setRatingErr] = useState(false)

  const productId = item.product?._id || item.product

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!rating) { setRatingErr(true); return }
    setRatingErr(false)
    setLoading(true)
    try {
      await api.post('/api/reviews', { productId, orderId, rating, comment })
      showToast({ message: 'Cảm ơn bạn đã đánh giá! ⭐', type: 'success' })
      onSuccess()
    } catch (err) {
      showToast({ message: err.message || 'Gửi đánh giá thất bại', type: 'error' })
    } finally { setLoading(false) }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-6"
      onClick={onClose}
    >
      <motion.div {...slideUp}
        className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-divider-lt">
          <div>
            <p className="text-2xs font-semibold tracking-label-lg uppercase text-muted">Đánh giá sản phẩm</p>
            <p className="font-display font-semibold text-ink mt-0.5 leading-tight">Chia sẻ cảm nhận của bạn</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-subtle transition-colors text-muted hover:text-ink">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Book info */}
          <div className="flex gap-4 items-center p-4 bg-surface-warm rounded-2xl">
            {item.image
              ? <img src={item.image} alt={item.title} className="w-12 h-16 object-cover rounded-xl flex-shrink-0" />
              : <div className="w-12 h-16 bg-surface-subtle rounded-xl flex-shrink-0" />
            }
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink line-clamp-2 leading-snug">{item.title}</p>
              <p className="text-xs text-muted mt-0.5">{item.author}</p>
            </div>
          </div>

          {/* Star rating */}
          <div className="space-y-1.5">
            <p className="text-2xs font-semibold tracking-label-lg uppercase text-muted">Xếp hạng</p>
            <StarPicker value={rating} onChange={v => { setRating(v); setRatingErr(false) }} />
            {ratingErr && <p className="text-xs text-red-500">Vui lòng chọn số sao</p>}
          </div>

          {/* Comment */}
          <div className="space-y-1.5">
            <p className="text-2xs font-semibold tracking-label-lg uppercase text-muted">Nhận xét <span className="normal-case text-subtle font-normal">(không bắt buộc)</span></p>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Bạn cảm thấy thế nào về cuốn sách này?"
              className="w-full border border-divider rounded-xl px-4 py-3 text-sm text-ink placeholder:text-subtle focus:outline-none focus:border-ink transition-colors resize-none"
            />
            <p className="text-[10px] text-subtle text-right">{comment.length}/1000</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 border border-divider rounded-xl text-sm font-medium text-ink-60 hover:border-ink hover:text-ink transition-colors">
              Hủy
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 bg-ink text-white text-sm font-semibold rounded-xl hover:bg-ink-80 disabled:opacity-50 transition-colors">
              {loading ? 'Đang gửi…' : 'Gửi đánh giá'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

/* ─── Order Card ────────────────────────────────────────────── */

function OrderCard({ order, reviewedKeys, onViewDetail, onReorder, onCancel, onReview }) {
  const [repayLoading, setRepayLoading] = useState(false)
  const showToast = useToastStore(s => s.show)
  const canCancel    = ['PENDING', 'CONFIRMED'].includes(order.status)
  const isDelivered  = order.status === 'DELIVERED'
  const PREVIEW      = isDelivered ? order.items.length : 2

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="group bg-white border border-divider-lt rounded-2xl overflow-hidden hover:border-divider hover:shadow-card-h transition-all duration-300"
    >
      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-3 bg-surface-warm border-b border-divider-lt">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-ink tracking-wider">
            {order.orderCode || `#${order._id.slice(-8).toUpperCase()}`}
          </span>
          <span className="text-divider text-xs">·</span>
          <StatusBadge status={order.status} />
        </div>
        <span className="text-xs text-subtle">{fmtDate(order.createdAt)}</span>
      </div>

      {/* Items */}
      <div className="px-5 py-4 space-y-3">
        {order.items.slice(0, PREVIEW).map((item, i) => {
          const pid      = item.product?._id || item.product
          const rKey     = `${order._id}:${pid}`
          const reviewed = reviewedKeys.has(rKey)
          return (
            <div key={i} className="flex gap-3 items-center">
              {item.image
                ? <img src={item.image} alt={item.title} className="w-11 h-[58px] object-cover rounded-xl flex-shrink-0" />
                : <div className="w-11 h-[58px] bg-surface-subtle rounded-xl flex-shrink-0" />
              }
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink line-clamp-1 leading-snug">{item.title}</p>
                <p className="text-xs text-muted mt-0.5">{item.author}</p>
                <p className="text-xs text-subtle">x{item.qty}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-sm font-semibold text-ink">{formatPrice(item.price * item.qty)}</span>
                {isDelivered && (
                  reviewed
                    ? <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5">✓ Đã đánh giá</span>
                    : (
                      <button
                        onClick={() => onReview({ item, orderId: order._id })}
                        className="text-[10px] font-semibold text-accent hover:underline underline-offset-2 transition-colors"
                      >
                        ⭐ Viết đánh giá
                      </button>
                    )
                )}
              </div>
            </div>
          )
        })}
        {!isDelivered && order.items.length > PREVIEW && (
          <p className="text-xs text-muted pl-14">và {order.items.length - PREVIEW} sản phẩm khác</p>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3.5 border-t border-divider-lt flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-baseline gap-1">
            <span className="text-xs text-muted">Tổng:</span>
            <span className="font-display font-semibold text-ink">{formatPrice(order.total)}</span>
          </div>
          <span className={`inline-block px-1.5 py-0.5 rounded-md text-[9px] font-semibold border ${
            order.paymentStatus === 'PAID'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50'
              : order.paymentStatus === 'REFUNDED'
              ? 'bg-gray-100 text-gray-600 border-gray-300/50'
              : order.payment === 'COD'
              ? 'bg-gray-50 text-gray-500 border-gray-200/50'
              : 'bg-red-50 text-red-600 border-red-200/50'
          }`}>
            {order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 
             order.paymentStatus === 'REFUNDED' ? 'Đã hoàn tiền' : 
             order.payment === 'COD' ? 'COD (Chưa thu)' : 'Chưa thanh toán'}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {order.payment === 'ONLINE' && order.paymentStatus === 'UNPAID' && order.status === 'PENDING' && (
            <button
              disabled={repayLoading}
              onClick={async () => {
                setRepayLoading(true)
                try {
                  const res = await api.post('/api/payments/payos/create', { orderId: order._id })
                  if (res.data?.checkoutUrl) {
                    window.location.href = res.data.checkoutUrl
                  } else {
                    throw new Error('Không tạo được liên kết thanh toán')
                  }
                } catch (err) {
                  showToast({ message: err.message || 'Lỗi khi tạo liên kết thanh toán', type: 'error' })
                } finally {
                  setRepayLoading(false)
                }
              }}
              className="text-xs font-semibold px-3.5 py-1.5 bg-[#2E4A3F] text-white rounded-xl hover:bg-[#1E3029] active:bg-[#15221D] disabled:opacity-50 transition-colors shadow-sm uppercase font-sans tracking-wide text-center"
            >
              {repayLoading ? 'Đang tải…' : 'Thanh toán ngay'}
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => onCancel(order._id)}
              className="text-xs font-medium text-muted hover:text-red-500 transition-colors underline underline-offset-2"
            >
              Hủy đơn
            </button>
          )}
          {isDelivered && (
            <button
              onClick={() => onReorder(order)}
              className="text-xs font-semibold px-3.5 py-1.5 border border-divider text-ink rounded-xl hover:bg-surface-subtle hover:border-ink transition-all"
            >
              Mua lại
            </button>
          )}
          <button
            onClick={() => onViewDetail(order)}
            className="text-xs font-semibold px-3.5 py-1.5 bg-ink text-white rounded-xl hover:bg-ink-80 transition-colors"
          >
            Xem chi tiết
          </button>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Main AccountPage ──────────────────────────────────────── */

export default function AccountPage() {
  const user           = useAuthStore(s => s.user)
  const isAuth         = useAuthStore(s => !!s.token)
  const updateProfile  = useAuthStore(s => s.updateProfile)
  const changePassword = useAuthStore(s => s.changePassword)
  const logout         = useAuthStore(s => s.logout)
  const addItem        = useCartStore(s => s.addItem)
  const showToast      = useToastStore(s => s.show)
  const navigate       = useNavigate()

  const [orders, setOrders]                 = useState([])
  const [loading, setLoading]               = useState(true)
  const [activeTab, setActiveTab]           = useState('all')
  const [detailOrder, setDetailOrder]       = useState(null)
  const [showEditModal, setShowEditModal]   = useState(false)
  const [showPassModal, setShowPassModal]   = useState(false)
  const [reviewedKeys, setReviewedKeys]     = useState(new Set())
  const [reviewTarget, setReviewTarget]     = useState(null) // { item, orderId }

  useEffect(() => {
    if (!isAuth) { navigate('/auth/login', { replace: true, state: { from: '/account' } }); return }
    Promise.all([
      api.get('/api/orders'),
      api.get('/api/reviews/my-reviews').catch(() => ({ data: [] })),
    ]).then(([ordersRes, reviewsRes]) => {
      setOrders(ordersRes.data)
      const keys = new Set(reviewsRes.data.map(r => `${r.order}:${r.product}`))
      setReviewedKeys(keys)
    }).catch(err => showToast({ message: err.message, type: 'error' }))
      .finally(() => setLoading(false))
  }, [])

  const filteredOrders = useMemo(
    () => activeTab === 'all' ? orders : orders.filter(o => o.status === activeTab),
    [orders, activeTab],
  )

  const tabCounts = useMemo(() => {
    const c = { all: orders.length }
    TABS.forEach(t => { if (t.key !== 'all') c[t.key] = orders.filter(o => o.status === t.key).length })
    return c
  }, [orders])

  function handleReorder(order) {
    order.items.forEach(item => addItem({ _id: item.product, title: item.title, author: item.author, price: item.price, image: item.image, stock: 999 }))
    showToast({ message: 'Đã thêm vào giỏ hàng', type: 'success' })
    navigate('/cart')
  }

  async function handleCancel(orderId) {
    if (!confirm('Bạn có chắc muốn hủy đơn này?')) return
    try {
      await api.put(`/api/orders/${orderId}/cancel`)
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: 'CANCELLED' } : o))
      showToast({ message: 'Đã hủy đơn hàng', type: 'info' })
    } catch (err) {
      showToast({ message: err.message, type: 'error' })
    }
  }

  if (!isAuth) return null

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <p className="text-2xs font-semibold tracking-label-2xl uppercase text-accent">Tài khoản</p>
        <h1 className="font-display font-semibold text-2xl md:text-3xl text-ink mt-0.5">Đơn hàng của tôi</h1>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {TABS.map(tab => {
          const count   = tabCounts[tab.key]
          const isActive = activeTab === tab.key
          return (
            <motion.button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              whileTap={{ scale: 0.96 }}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200
                ${isActive
                  ? 'bg-ink text-white shadow-sm'
                  : 'bg-white text-ink-60 border border-divider-lt hover:border-divider hover:bg-surface-warm'
                }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`text-[10px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center
                  ${isActive ? 'bg-white/25 text-white' : 'bg-surface-subtle text-muted'}`}>
                  {count}
                </span>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Order list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="border border-divider-lt rounded-2xl">
          <EmptyOrders tab={activeTab} />
        </div>
      ) : (
        <AnimatePresence mode="popLayout" initial={false}>
          <div className="space-y-4">
            {filteredOrders.map(order => (
              <OrderCard
                key={order._id}
                order={order}
                reviewedKeys={reviewedKeys}
                onViewDetail={setDetailOrder}
                onReorder={handleReorder}
                onCancel={handleCancel}
                onReview={setReviewTarget}
              />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* ── Modals ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {detailOrder   && <OrderDetailModal key="detail" order={detailOrder}   onClose={() => setDetailOrder(null)} />}
        {reviewTarget  && (
          <ReviewModal
            key="review"
            item={reviewTarget.item}
            orderId={reviewTarget.orderId}
            onClose={() => setReviewTarget(null)}
            onSuccess={() => {
              const pid  = reviewTarget.item.product?._id || reviewTarget.item.product
              const rKey = `${reviewTarget.orderId}:${pid}`
              setReviewedKeys(prev => new Set([...prev, rKey]))
              setReviewTarget(null)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
