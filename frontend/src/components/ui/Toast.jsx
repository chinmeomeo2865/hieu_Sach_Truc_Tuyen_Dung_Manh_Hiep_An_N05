import { useToastStore } from '../../store/toastStore'

const STYLES = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error:   'bg-red-50   border-red-200   text-red-800',
  info:    'bg-stone-50 border-stone-200 text-stone-700',
}

const ICONS = {
  success: '✓',
  error:   '✕',
  info:    'i',
}

export function Toast({ toast }) {
  const dismiss = useToastStore(s => s.dismiss)

  return (
    <div
      className={`flex items-start gap-3 pl-4 pr-3 py-3 border rounded-lg shadow-md min-w-[260px] max-w-[360px] ${STYLES[toast.type] ?? STYLES.info} ${toast.removing ? 'toast-out' : 'toast-in'}`}
      role="alert"
      aria-live="polite"
    >
      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-current/10 flex items-center justify-center text-[11px] font-bold mt-0.5">
        {ICONS[toast.type] ?? ICONS.info}
      </span>
      <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>
      <button
        onClick={() => dismiss(toast.id)}
        aria-label="Đóng thông báo"
        className="flex-shrink-0 opacity-40 hover:opacity-70 transition-opacity text-sm leading-none mt-0.5"
      >
        ✕
      </button>
    </div>
  )
}
