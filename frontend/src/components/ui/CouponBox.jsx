import { useState, useEffect, useRef } from 'react'
import { api } from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { useUIStore } from '../../store/uiStore'
import { useToastStore } from '../../store/toastStore'
import { useCouponStore } from '../../store/couponStore'

/* Ô nhập + áp mã giảm giá, dùng chung cho Giỏ hàng và Thanh toán.
   - Lưu code vào couponStore (persist) để mang từ giỏ sang checkout.
   - Luôn validate lại với subtotal hiện tại; nếu giỏ đổi làm mã hết hợp lệ
     thì tự gỡ và báo nhẹ.
   Parent giữ state `result` (từ /api/coupons/validate) và truyền setter onResult. */
export function CouponBox({ subtotal, result, onResult }) {
  const isAuth         = useAuthStore(s => !!s.token)
  const openAuthPrompt = useUIStore(s => s.openAuthPrompt)
  const showToast      = useToastStore(s => s.show)
  const code      = useCouponStore(s => s.code)
  const setCode   = useCouponStore(s => s.setCode)
  const clearCode = useCouponStore(s => s.clear)

  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const wasApplied = useRef(false)

  /* Tự áp / kiểm lại mã đã lưu khi subtotal đổi */
  useEffect(() => {
    let cancelled = false
    if (!code || !isAuth || subtotal <= 0) { onResult(null); return }
    api.post('/api/coupons/validate', { code, subtotal })
      .then(res => { if (!cancelled) { onResult(res.data); setError(''); wasApplied.current = true } })
      .catch(err => {
        if (cancelled) return
        onResult(null)
        if (wasApplied.current) showToast({ message: `Mã ${code} không còn áp dụng: ${err.message}`, type: 'info' })
        wasApplied.current = false
        clearCode()
      })
    return () => { cancelled = true }
  }, [code, subtotal, isAuth])

  async function applyManual() {
    const c = input.trim().toUpperCase()
    if (!c) return
    if (!isAuth) {
      openAuthPrompt({ title: 'Đăng nhập để dùng mã giảm giá', message: 'Bạn cần đăng nhập để áp dụng mã giảm giá.' })
      return
    }
    setLoading(true); setError('')
    try {
      const res = await api.post('/api/coupons/validate', { code: c, subtotal })
      onResult(res.data); setCode(res.data.code); setInput('')
      wasApplied.current = true
      showToast({ message: `Đã áp dụng mã ${res.data.code}`, type: 'success' })
    } catch (e) {
      onResult(null); setError(e.message || 'Mã không hợp lệ'); wasApplied.current = false
    } finally { setLoading(false) }
  }

  function remove() {
    onResult(null); clearCode(); setInput(''); setError(''); wasApplied.current = false
  }

  if (result) {
    return (
      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-sm px-3 py-2.5">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
            {result.code}
          </p>
          {result.description && <p className="text-[10px] text-emerald-600 mt-0.5 line-clamp-1">{result.description}</p>}
        </div>
        <button type="button" onClick={remove} aria-label="Xóa mã"
          className="text-emerald-500 hover:text-emerald-700 transition-colors ml-3 shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-2xs font-semibold tracking-label-lg uppercase text-ink-60">
        <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
        Mã giảm giá
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => { setInput(e.target.value.toUpperCase()); setError('') }}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), applyManual())}
          placeholder="Nhập mã giảm giá…"
          className={`flex-1 border rounded-sm px-3 py-2 text-sm text-ink placeholder:text-subtle focus:outline-none focus:border-ink transition-colors ${error ? 'border-red-300' : 'border-divider'}`}
        />
        <button type="button" onClick={applyManual} disabled={loading || !input.trim()}
          className="px-4 py-2 bg-ink text-white rounded-sm text-xs font-semibold hover:bg-ink-80 disabled:opacity-40 transition-colors whitespace-nowrap">
          {loading ? '…' : 'Áp dụng'}
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01"/></svg>
          {error}
        </p>
      )}
    </div>
  )
}
