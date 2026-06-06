import { useToastStore } from '../../store/toastStore'
import { Toast }         from './Toast'

export function ToastContainer() {
  const toasts = useToastStore(s => s.toasts)
  if (toasts.length === 0) return null

  return (
    <div
      aria-label="Thông báo"
      className="fixed bottom-24 right-5 z-[400] flex flex-col gap-2 items-end"
    >
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  )
}
