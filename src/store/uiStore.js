import { create } from 'zustand'

export const useUIStore = create((set) => ({
  /* Quick view */
  quickViewBook: null,
  openQuickView:  (book) => set({ quickViewBook: book }),
  closeQuickView: ()     => set({ quickViewBook: null }),

  /* Search */
  searchOpen:  false,
  openSearch:  () => set({ searchOpen: true }),
  closeSearch: () => set({ searchOpen: false }),

  /* Global category filter (shared between FeaturedBooks & CategoryCard) */
  activeCategory: 'all',
  setCategory:    (slug) => set({ activeCategory: slug }),
}))
