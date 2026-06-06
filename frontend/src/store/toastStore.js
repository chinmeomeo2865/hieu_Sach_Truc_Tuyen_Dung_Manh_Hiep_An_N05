import { create } from 'zustand'

let _id = 0

export const useToastStore = create((set, get) => ({
  toasts: [],

  show({ message, type = 'success', duration = 3500 }) {
    const id = ++_id
    set(s => {
      // Keep max 4 toasts
      const list = [...s.toasts, { id, message, type, removing: false }]
      return { toasts: list.length > 4 ? list.slice(list.length - 4) : list }
    })
    setTimeout(() => get().dismiss(id), duration)
  },

  dismiss(id) {
    // Mark removing → triggers exit animation
    set(s => ({ toasts: s.toasts.map(t => t.id === id ? { ...t, removing: true } : t) }))
    // Remove after animation duration
    setTimeout(() => {
      set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }))
    }, 260)
  },
}))
