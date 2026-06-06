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

  /* Auth-required prompt (guest cố dùng tính năng cần đăng nhập) */
  authPrompt: null, // { title, message } | null
  openAuthPrompt:  (opts = {}) => set({ authPrompt: {
    title:   opts.title   || 'Bạn chưa đăng nhập',
    message: opts.message || 'Đăng nhập để sử dụng tính năng này.',
  } }),
  closeAuthPrompt: () => set({ authPrompt: null }),

  /* Support modal */
  supportModalTopic: null, // null = closed, string topicId = open
  openSupportModal:  (topic) => set({ supportModalTopic: topic }),
  closeSupportModal: ()      => set({ supportModalTopic: null }),
}))
