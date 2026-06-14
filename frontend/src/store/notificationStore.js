import { create } from 'zustand'
import { api } from '../services/api'

/* Số thông báo chưa đọc — chia sẻ giữa Navbar (bell) và NotificationsPage,
   để khi đọc xong ở trang thông báo thì badge trên bell cập nhật ngay. */
export const useNotificationStore = create((set) => ({
  unread: 0,
  setUnread: (n) => set({ unread: Math.max(0, n || 0) }),
  markAllRead: () => set({ unread: 0 }),
  decrement: () => set((s) => ({ unread: Math.max(0, s.unread - 1) })),
  fetchUnread: async () => {
    try {
      const r = await api.get('/api/notifications')
      set({ unread: r.unreadCount || 0 })
    } catch {}
  },
}))
