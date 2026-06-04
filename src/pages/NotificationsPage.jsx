import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore }  from '../store/authStore'
import { useToastStore } from '../store/toastStore'
import { api }           from '../services/api'

const TYPE_ICON = {
  ORDER_STATUS: (
    <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
    </svg>
  ),
  SYSTEM: (
    <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
    </svg>
  ),
}

export default function NotificationsPage() {
  const isAuth   = useAuthStore(s => !!s.token)
  const showToast = useToastStore(s => s.show)
  const navigate  = useNavigate()

  const [notifications, setNotifications] = useState([])
  const [unreadCount,   setUnreadCount]   = useState(0)
  const [loading,       setLoading]       = useState(true)

  useEffect(() => {
    if (!isAuth) { navigate('/auth/login'); return }
    api.get('/api/notifications')
      .then(r => { setNotifications(r.data); setUnreadCount(r.unreadCount) })
      .catch(() => showToast({ message: 'Không tải được thông báo', type: 'error' }))
      .finally(() => setLoading(false))
  }, [isAuth])

  async function handleMarkAll() {
    try {
      await api.put('/api/notifications/read-all')
      setNotifications(ns => ns.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch {}
  }

  async function handleMarkOne(id) {
    try {
      await api.put(`/api/notifications/${id}/read`)
      setNotifications(ns => ns.map(n => n._id === id ? { ...n, read: true } : n))
      setUnreadCount(c => Math.max(0, c - 1))
    } catch {}
  }

  return (
    <div className="max-w-[640px] mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Thông báo</h1>
          {unreadCount > 0 && <p className="text-[13px] text-muted mt-0.5">{unreadCount} chưa đọc</p>}
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAll}
            className="text-[12.5px] text-accent hover:underline font-medium">
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center text-[13px] text-muted">Đang tải…</div>
      ) : notifications.length === 0 ? (
        <div className="py-16 text-center">
          <svg className="w-10 h-10 mx-auto mb-3 text-divider" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
          </svg>
          <p className="text-[13px] text-muted">Chưa có thông báo nào</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div
              key={n._id}
              onClick={() => { if (!n.read) handleMarkOne(n._id) }}
              className={`flex items-start gap-3 p-4 rounded-xl border transition-colors cursor-pointer ${
                n.read ? 'bg-white border-divider-lt' : 'bg-[#faf8f5] border-accent/20'
              } hover:border-divider`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {TYPE_ICON[n.type] || TYPE_ICON.SYSTEM}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[13.5px] leading-snug mb-0.5 ${n.read ? 'text-[#525252]' : 'font-medium text-ink'}`}>
                  {n.title}
                </p>
                <p className="text-[12.5px] text-muted">{n.message}</p>
                <p className="text-[11px] text-subtle mt-1">
                  {new Date(n.createdAt).toLocaleString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                </p>
              </div>
              {!n.read && <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-1.5"/>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
