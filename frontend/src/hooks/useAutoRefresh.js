import { useEffect, useRef } from 'react'

/* Tự động gọi lại callback theo chu kỳ (auto-refresh "silent").
   - Tạm dừng khi tab bị ẩn để đỡ tốn request (Render free tier + rate-limit).
   - Khi quay lại tab sẽ refresh ngay một lần.
   - callback nên là bản fetch "silent" (không bật loading) để tránh nháy skeleton. */
export function useAutoRefresh(callback, intervalMs = 30000, enabled = true) {
  const cbRef = useRef(callback)
  cbRef.current = callback

  useEffect(() => {
    if (!enabled || !intervalMs) return
    const id = setInterval(() => { if (!document.hidden) cbRef.current() }, intervalMs)
    const onVisible = () => { if (!document.hidden) cbRef.current() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [intervalMs, enabled])
}
