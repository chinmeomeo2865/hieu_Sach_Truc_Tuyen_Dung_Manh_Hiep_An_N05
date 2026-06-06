import { motion, AnimatePresence } from 'framer-motion'

export default function ConfirmModal({ open, title, message, confirmLabel = 'Xác nhận', confirmClass = 'bg-red-500 hover:bg-red-600 text-white', onConfirm, onCancel, loading }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="bg-white rounded-xl w-full max-w-sm p-6 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-[14px] font-semibold text-[#0f0f0f] mb-2">{title}</h3>
            <p className="text-[13px] text-[#737373] leading-relaxed mb-6">{message}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={onCancel} className="px-4 py-2 text-[12px] font-semibold border border-[#e5e5e5] rounded-lg text-[#525252] hover:border-[#a3a3a3] transition-colors">
                Hủy
              </button>
              <button onClick={onConfirm} disabled={loading} className={`px-4 py-2 text-[12px] font-semibold rounded-lg disabled:opacity-50 transition-colors ${confirmClass}`}>
                {loading ? 'Đang xử lý…' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
