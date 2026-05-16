import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      ids: [],

      toggle(id) {
        const { ids } = get()
        set({ ids: ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id] })
      },
    }),
    { name: 'chin-wishlist' },
  ),
)
