import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import { useToastStore } from '../store/toastStore'
import { formatPrice } from '../utils/format'

const TYPE_BADGE = {
  percent:       { label: 'Giảm %',     cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  fixed:         { label: 'Giảm tiền',  cls: 'bg-violet-50 text-violet-700 border-violet-200' },
  free_shipping: { label: 'Miễn ship',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
}

function valueText(c) {
  if (c.type === 'percent') return `Giảm ${c.value}%${c.maxDiscount ? ` (tối đa ${formatPrice(c.maxDiscount)})` : ''}`
  if (c.type === 'fixed')   return `Giảm ${formatPrice(c.value)}`
  return `Miễn phí vận chuyển${c.maxShipDiscount ? ` (tối đa ${formatPrice(c.maxShipDiscount)})` : ''}`
}

function conditions(c) {
  const out = []
  if (c.minOrderAmount > 0) out.push(`Đơn từ ${formatPrice(c.minOrderAmount)}`)
  if (c.firstOrderOnly)     out.push('Chỉ đơn đầu tiên')
  if (c.perUserLimit > 0)   out.push(`${c.perUserLimit} lần/tài khoản`)
  return out
}

function VoucherCard({ c }) {
  const showToast = useToastStore(s => s.show)
  const badge = TYPE_BADGE[c.type] || { label: c.type, cls: 'bg-gray-50 text-gray-600 border-gray-200' }
  const conds = conditions(c)

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(c.code)
      showToast({ message: `Đã sao chép mã ${c.code}`, type: 'success' })
    } catch {
      showToast({ message: `Mã: ${c.code}`, type: 'info' })
    }
  }

  return (
    <div className="relative flex bg-white border border-divider-lt rounded-sm overflow-hidden hover:shadow-card-h hover:border-divider transition-all">
      {/* Left ticket stub */}
      <div className="relative w-2 bg-accent shrink-0" />
      <div className="absolute left-1.5 top-1/2 -translate-y-1/2 flex flex-col gap-2 pointer-events-none">
        <span className="w-3 h-3 rounded-full bg-surface-warm border border-divider-lt -ml-1.5" />
      </div>

      <div className="flex-1 p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <p className="font-display text-lg font-semibold text-ink leading-tight">{valueText(c)}</p>
          <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${badge.cls}`}>{badge.label}</span>
        </div>

        {c.description && <p className="text-sm text-muted mb-3">{c.description}</p>}

        {conds.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {conds.map((cd, i) => (
              <span key={i} className="px-2 py-0.5 rounded-sm bg-surface-warm border border-divider-lt text-[11px] text-ink-60">{cd}</span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-3 border-t border-dashed border-divider-lt">
          <div className="min-w-0">
            <span className="font-mono font-bold text-ink tracking-wider text-sm">{c.code}</span>
            <p className="text-[10px] text-subtle mt-0.5">HSD: {new Date(c.endDate).toLocaleDateString('vi-VN')}</p>
          </div>
          <button onClick={copyCode}
            className="shrink-0 px-4 py-2 bg-ink text-white text-2xs font-semibold tracking-label-lg uppercase rounded-sm hover:bg-ink-80 transition-colors">
            Sao chép
          </button>
        </div>
      </div>
    </div>
  )
}

export default function OffersPage() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/coupons/active')
      .then(r => setCoupons(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10 py-12 md:py-16">
      {/* Header */}
      <div className="text-center mb-10">
        <p className="text-2xs font-semibold tracking-label-2xl uppercase text-accent mb-2">Ưu đãi dành cho bạn</p>
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-ink">Mã giảm giá &amp; Khuyến mãi</h1>
        <p className="mt-3 text-sm text-muted max-w-xl mx-auto">
          Sao chép mã và nhập tại trang giỏ hàng hoặc thanh toán để được giảm giá. Miễn phí vận chuyển cho đơn từ 250.000₫.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 bg-surface-warm border border-divider-lt rounded-sm animate-pulse" />
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-16 border border-divider-lt rounded-sm bg-surface-warm">
          <p className="font-display text-xl font-semibold text-ink">Hiện chưa có ưu đãi nào</p>
          <p className="mt-1 text-sm text-muted">Theo dõi để không bỏ lỡ mã giảm giá sắp tới nhé!</p>
          <Link to="/books" className="inline-block mt-5 px-6 py-2.5 bg-ink text-white text-2xs font-semibold tracking-label-lg uppercase rounded-sm hover:bg-ink-80 transition-colors">
            Khám phá sách
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {coupons.map(c => <VoucherCard key={c.code} c={c} />)}
          </div>
          <div className="text-center mt-10">
            <Link to="/books" className="inline-block px-7 py-3 bg-ink text-white text-2xs font-semibold tracking-label-lg uppercase rounded-sm hover:bg-ink-80 transition-colors">
              Mua sắm ngay
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
