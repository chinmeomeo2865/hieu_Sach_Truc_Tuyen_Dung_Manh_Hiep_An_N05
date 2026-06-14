import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * ConfirmModal — Hiệu Sách Chin branded confirm dialog
 *
 * @param {boolean}  open           — show/hide
 * @param {function} onConfirm      — called on confirm
 * @param {function} onCancel       — called on cancel / close
 * @param {string}   title          — heading text
 * @param {string}   message        — body text (can be JSX)
 * @param {string}   confirmText    — confirm button label (default: 'Xác nhận')
 * @param {string}   cancelText     — cancel button label  (default: 'Hủy bỏ')
 * @param {'danger'|'warning'|'info'} variant — color scheme
 * @param {boolean}  loading        — disable buttons while processing
 */

const VARIANTS = {
  danger: {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    iconBg: 'bg-[#FEF2F2]',
    iconColor: 'text-[#B91C1C]',
    iconRing: 'ring-[#FECACA]/40',
    confirmBtn: 'bg-[#B91C1C] hover:bg-[#991B1B] active:bg-[#7F1D1D] focus-visible:ring-[#B91C1C]/30',
  },
  warning: {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    ),
    iconBg: 'bg-[#FFFBEB]',
    iconColor: 'text-[#B45309]',
    iconRing: 'ring-[#FDE68A]/40',
    confirmBtn: 'bg-[#B45309] hover:bg-[#92400E] active:bg-[#78350F] focus-visible:ring-[#B45309]/30',
  },
  info: {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    iconBg: 'bg-[#F0FDF4]',
    iconColor: 'text-[#2E4A3F]',
    iconRing: 'ring-[#BBF7D0]/40',
    confirmBtn: 'bg-[#2E4A3F] hover:bg-[#1E3029] active:bg-[#15221D] focus-visible:ring-[#2E4A3F]/30',
  },
}

export default function ConfirmModal({
  open,
  onConfirm,
  onCancel,
  title = 'Xác nhận thao tác',
  message = '',
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  variant = 'danger',
  loading = false,
}) {
  const confirmRef = useRef(null)
  const v = VARIANTS[variant] || VARIANTS.danger

  // Focus confirm button when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => confirmRef.current?.focus(), 80)
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape' && !loading) onCancel?.() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, loading, onCancel])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/35 backdrop-blur-[3px]"
            onClick={() => !loading && onCancel?.()}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="w-full max-w-[420px] bg-white rounded-2xl border border-[#EAE6DF] shadow-2xl overflow-hidden pointer-events-auto"
            >
              {/* Top decorative bar */}
              <div className="h-1 w-full bg-gradient-to-r from-[#C6923B]/60 via-[#8E6CA6]/40 to-[#4A8561]/60" />

              <div className="px-7 pt-7 pb-6">
                {/* Icon */}
                <div className="flex justify-center mb-5">
                  <div className={`w-14 h-14 rounded-2xl ${v.iconBg} ${v.iconColor} ring-4 ${v.iconRing} flex items-center justify-center transition-all`}>
                    {v.icon}
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-display text-[16px] font-bold text-[#1A1A1A] text-center tracking-wide">
                  {title}
                </h3>

                {/* Message */}
                {message && (
                  <p className="mt-2.5 text-[13px] text-[#615C56] text-center leading-relaxed">
                    {message}
                  </p>
                )}

                {/* Shop branding line */}
                <div className="flex items-center justify-center gap-2 mt-5 mb-1">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#EAE6DF] to-transparent" />
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#D8D2CA] select-none">
                    Hiệu Sách Chin
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#EAE6DF] to-transparent" />
                </div>
              </div>

              {/* Actions */}
              <div className="px-7 pb-7 flex gap-3">
                <button
                  onClick={() => !loading && onCancel?.()}
                  disabled={loading}
                  className="flex-1 py-3 px-4 text-[13px] font-semibold text-[#615C56] bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl 
                    hover:bg-[#F2EFEA] hover:border-[#D8D2CA] hover:text-[#1A1A1A] 
                    active:bg-[#EAE6DF] disabled:opacity-40 
                    transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8D2CA]"
                >
                  {cancelText}
                </button>
                <button
                  ref={confirmRef}
                  onClick={() => !loading && onConfirm?.()}
                  disabled={loading}
                  className={`flex-1 py-3 px-4 text-[13px] font-semibold text-white rounded-xl 
                    disabled:opacity-50 transition-all duration-200 
                    focus-visible:outline-none focus-visible:ring-2 
                    flex items-center justify-center gap-2 ${v.confirmBtn}`}
                >
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Đang xử lý…
                    </>
                  ) : confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
