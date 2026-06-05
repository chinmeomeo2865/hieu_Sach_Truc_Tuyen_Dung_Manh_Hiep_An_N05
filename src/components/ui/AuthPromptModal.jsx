import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { useUIStore } from '../../store/uiStore'

export function AuthPromptModal() {
  const prompt   = useUIStore(s => s.authPrompt)
  const close    = useUIStore(s => s.closeAuthPrompt)
  const navigate = useNavigate()
  const location = useLocation()

  const goLogin = () => {
    close()
    navigate('/auth/login', { state: { from: location.pathname + location.search } })
  }

  return (
    <AnimatePresence>
      {prompt && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[320] bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={close}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            role="dialog"
            aria-modal="true"
            className="relative bg-white rounded-xl w-full max-w-sm p-7 shadow-elevated text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-surface-warm border border-divider-lt flex items-center justify-center">
              <svg className="w-5 h-5 text-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0m12 9H4a1 1 0 01-1-1v-7a1 1 0 011-1h16a1 1 0 011 1v7a1 1 0 01-1 1z" />
              </svg>
            </div>
            <h3 className="font-display text-lg font-semibold text-ink mb-1.5">{prompt.title}</h3>
            <p className="text-sm text-muted leading-relaxed mb-6">{prompt.message}</p>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={goLogin}
                className="w-full py-2.5 rounded-sm bg-ink text-white text-xs font-semibold tracking-label uppercase hover:bg-ink-80 active:scale-[0.99] transition-all"
              >
                Đăng nhập
              </button>
              <button
                onClick={close}
                className="w-full py-2.5 rounded-sm border border-divider text-muted text-xs font-semibold tracking-label uppercase hover:border-ink hover:text-ink transition-colors"
              >
                Quay lại
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
