import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem(book) {
        const id    = book._id || book.id
        const items = get().items
        const idx   = items.findIndex(i => i.id === id)
        if (idx >= 0) {
          const next = [...items]
          next[idx] = { ...next[idx], qty: next[idx].qty + 1 }
          set({ items: next })
        } else {
          set({
            items: [...items, {
              id, title: book.title, author: book.author,
              price: book.price, image: book.image,
              qty: 1,
            }],
          })
        }
      },

      updateQty(id, qty) {
        if (qty <= 0) {
          set({ items: get().items.filter(i => i.id !== id) })
        } else {
          set({ items: get().items.map(i => i.id === id ? { ...i, qty } : i) })
        }
      },

      removeItem(id) {
        set({ items: get().items.filter(i => i.id !== id) })
      },

      clear() { set({ items: [] }) },
    }),
    {
      name: 'chin-cart',
      onRehydrateStorage: () => (state) => {
        // Xóa item cũ bị lưu với id undefined (trước khi fix _id)
        if (state?.items) {
          state.items = state.items.filter(i => i.id)
        }
      },
    },
  ),
)
