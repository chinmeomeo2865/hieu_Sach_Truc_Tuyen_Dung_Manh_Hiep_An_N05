import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import { useToastStore } from '../store/toastStore'
import { formatPrice } from '../utils/format'

function conditions(c) {
  const out = []
  if (c.minOrderAmount > 0) out.push(`Đơn tối thiểu ${formatPrice(c.minOrderAmount)}`)
  if (c.firstOrderOnly)     out.push('Khách hàng mới')
  if (c.perUserLimit > 0)   out.push(`Tối đa ${c.perUserLimit} lần`)
  return out
}

function VoucherCard({ c }) {
  const showToast = useToastStore(s => s.show)
  const conds = conditions(c)

  // Earthy HSL styled configs matching the warm boutique shop
  const styleConfig = {
    percent: {
      tag: 'Giảm %',
      bgLeft: 'bg-sand-100/70 text-accent border-sand-200',
      badge: 'bg-accent/8 text-accent border-accent/15',
      accentColor: 'text-accent',
      icon: (
        <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a1.125 1.125 0 001.591 0l4.318-4.318a1.125 1.125 0 000-1.591L9.581 3.659A2.25 2.25 0 009.568 3z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
        </svg>
      )
    },
    fixed: {
      tag: 'Giảm trực tiếp',
      bgLeft: 'bg-sand-200/50 text-sand-900 border-sand-300',
      badge: 'bg-sand-900/8 text-sand-900 border-sand-900/15',
      accentColor: 'text-sand-900',
      icon: (
        <svg className="w-5 h-5 text-sand-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.268.118a6.002 6.002 0 013.269 3.525V6m-4.704 7.484c0 .85.394 1.636 1.05 2.124L12 18m0-12a3 3 0 00-3 3c0 1.657 1.343 3 3 3m0-6a3 3 0 013 3c0 1.657-1.343 3-3 3m0-6v6m0 0a3 3 0 003-3" />
        </svg>
      )
    },
    free_shipping: {
      tag: 'Hỗ trợ ship',
      bgLeft: 'bg-emerald-50 text-emerald-800 border-emerald-150',
      badge: 'bg-emerald-800/8 text-emerald-800 border-emerald-800/15',
      accentColor: 'text-emerald-800',
      icon: (
        <svg className="w-5 h-5 text-emerald-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.129-1.125V11.25M3 14.25h16.5V7.125A1.125 1.125 0 0018.375 6H12M3 14.25V12M12 6H8.25m3.75 0v6.75H12" />
        </svg>
      )
    }
  }[c.type] || {
    tag: c.type,
    bgLeft: 'bg-surface-subtle text-muted border-divider',
    badge: 'bg-muted/8 text-muted border-muted/15',
    accentColor: 'text-muted',
    icon: (
      <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499c.307-.874 1.545-.874 1.852 0l1.79 5.096a1.125 1.125 0 001.07.76h5.362c.93 0 1.317 1.198.567 1.748l-4.34 3.153a1.125 1.125 0 00-.409 1.258l1.79 5.097c.307.875-.7 1.564-1.45 1.01L12.53 18.22a1.125 1.125 0 00-1.26 0l-4.34 3.152c-.75.555-1.758-.135-1.45-1.01l1.79-5.096a1.125 1.125 0 00-.408-1.259L2.43 11.2a1.125 1.125 0 00.567-1.748h5.362a1.125 1.125 0 001.07-.76l1.79-5.097z" />
      </svg>
    )
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(c.code)
      showToast({ message: `Đã sao chép mã ${c.code}`, type: 'success' })
    } catch {
      showToast({ message: `Mã: ${c.code}`, type: 'info' })
    }
  }

  const valueDisplay = c.type === 'percent' ? `${c.value}%` : c.type === 'fixed' ? formatPrice(c.value) : 'Freeship'

  return (
    <div className="group relative flex bg-white border border-divider-lt rounded-xl overflow-hidden hover:shadow-card-h hover:border-divider transition-all duration-300">
      
      {/* Left ticket stub */}
      <div className={`w-32 md:w-36 flex flex-col items-center justify-center text-center p-4 border-r border-dashed border-divider-lt shrink-0 relative ${styleConfig.bgLeft}`}>
        
        {/* Semicircle Ticket Cutouts */}
        <div className="absolute right-[-8px] -top-2 w-4 h-4 rounded-full bg-white border border-divider-lt z-10" />
        <div className="absolute right-[-8px] -bottom-2 w-4 h-4 rounded-full bg-white border border-divider-lt z-10" />
        
        {/* Background Decorative Icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none select-none scale-[2.2]">
          {styleConfig.icon}
        </div>

        <div className="p-1 rounded-full bg-white/85 shadow-2xs mb-2 shrink-0">
          {styleConfig.icon}
        </div>
        
        <span className="text-[9px] font-bold uppercase tracking-widest opacity-85 leading-none mb-1">
          {styleConfig.tag}
        </span>
        <span className="font-display text-2xl font-bold tracking-tight">
          {c.type === 'free_shipping' ? 'Miễn ship' : valueDisplay}
        </span>

        {c.type === 'percent' && c.maxDiscount && (
          <span className="text-[9px] opacity-75 font-medium mt-1">Tối đa {formatPrice(c.maxDiscount)}</span>
        )}
        {c.type === 'free_shipping' && c.maxShipDiscount && (
          <span className="text-[9px] opacity-75 font-medium mt-1">Tối đa {formatPrice(c.maxShipDiscount)}</span>
        )}
      </div>

      {/* Right voucher details stub */}
      <div className="flex-1 p-5 md:p-6 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-3 mb-1">
            <h3 className="font-display text-[15px] font-bold text-ink leading-snug">
              {c.type === 'free_shipping' 
                ? `Mã miễn phí vận chuyển tối đa ${formatPrice(c.maxShipDiscount || 0)}`
                : `Mã giảm trực tiếp ${valueDisplay}`}
            </h3>
          </div>

          <p className="text-[12px] text-muted leading-relaxed line-clamp-2 mb-3">
            {c.description || 'Áp dụng cho các sản phẩm tại hệ thống Hiệu Sách Chin.'}
          </p>

          {conds.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {conds.map((cd, i) => (
                <span key={i} className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border ${styleConfig.badge}`}>
                  {cd}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-3.5 border-t border-divider-lt mt-auto">
          <div className="min-w-0">
            <span className="font-mono font-bold text-ink tracking-wider text-sm select-all">{c.code}</span>
            <p className="text-[10px] text-subtle mt-0.5">
              Hạn dùng: {new Date(c.endDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </p>
          </div>
          <button 
            onClick={copyCode}
            className="shrink-0 px-4 py-2 bg-ink text-white text-2xs font-semibold tracking-label uppercase rounded-lg hover:bg-ink-80 active:scale-95 transition-all shadow-sm hover:shadow"
          >
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
    <div className="max-w-[1140px] mx-auto px-4 sm:px-6 lg:px-10 py-12 md:py-16">
      
      {/* Header */}
      <div className="text-center mb-12 md:mb-16">
        <span className="inline-block px-3.5 py-1 bg-accent/8 text-accent text-2xs font-bold tracking-label-2xl uppercase rounded-full mb-3 select-none">
          Ưu đãi độc quyền
        </span>
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold text-ink tracking-tight">
          Mã giảm giá &amp; Khuyến mãi
        </h1>
        <div className="w-12 h-[2px] bg-accent mx-auto mt-4 mb-4 rounded-full" />
        <p className="text-sm text-muted max-w-lg mx-auto leading-relaxed">
          Sao chép mã ưu đãi dưới đây để sử dụng tại trang thanh toán. Miễn phí vận chuyển cho các hóa đơn mua sách có tổng trị giá từ 250.000₫.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 bg-surface-subtle border border-divider-lt rounded-xl animate-pulse" />
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-16 border border-divider border-dashed rounded-xl bg-surface-warm/40 max-w-xl mx-auto px-6">
          <svg className="w-12 h-12 text-subtle mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
          </svg>
          <p className="font-display text-lg font-semibold text-ink">Hiện chưa có ưu đãi nào</p>
          <p className="mt-1.5 text-xs text-muted">Mã giảm giá mới sẽ sớm được cập nhật. Hãy thường xuyên theo dõi nhé!</p>
          <Link to="/books" className="inline-block mt-6 px-6 py-2.5 bg-ink text-white text-2xs font-semibold tracking-label uppercase rounded-lg hover:bg-ink-80 transition-colors shadow-2xs">
            Khám phá sách
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {coupons.map(c => <VoucherCard key={c.code} c={c} />)}
          </div>
          <div className="text-center mt-12 md:mt-16">
            <Link to="/books" className="inline-flex items-center gap-2 border border-divider text-ink-60 text-[11px] font-semibold tracking-label uppercase px-7 py-3 rounded-lg hover:border-ink hover:text-ink hover:-translate-y-px transition-all">
              Mua sắm ngay
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
