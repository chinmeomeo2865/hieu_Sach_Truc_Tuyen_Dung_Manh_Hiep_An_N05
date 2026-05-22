import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem(book) {
        const id    = book._id || book.id
        const stock = book.stock ?? 999
        const items = get().items
        const idx   = items.findIndex(i => i.id === id)
        if (idx >= 0) {
          const next    = [...items]
          const newQty  = Math.min(next[idx].qty + 1, stock)
          next[idx] = { ...next[idx], qty: newQty, stock }
          set({ items: next })
        } else {
          set({
            items: [...items, {
              id, title: book.title, author: book.author,
              price: book.price, image: book.image,
              stock, qty: 1,
            }],
          })
        }
      },

      updateQty(id, qty) {
        if (qty <= 0) {
          set({ items: get().items.filter(i => i.id !== id) })
        } else {
          set({
            items: get().items.map(i => {
              if (i.id !== id) return i
              const max = i.stock ?? 999
              return { ...i, qty: Math.min(qty, max) }
            }),
          })
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
