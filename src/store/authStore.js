import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '../services/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,

      async login(email, password) {
        const data = await api.post('/api/auth/login', { email, password })
        const { token, data: user } = data
        localStorage.setItem('chin-token', token)
        set({ user, token })
        return user
      },

      async register(name, email, password) {
        const data = await api.post('/api/auth/register', { name, email, password })
        const { token, data: user } = data
        localStorage.setItem('chin-token', token)
        set({ user, token })
        return user
      },

      async fetchMe() {
        try {
          const data = await api.get('/api/auth/me')
          set({ user: data.data })
        } catch {
          get().logout()
        }
      },

      logout() {
        localStorage.removeItem('chin-token')
        set({ user: null, token: null })
      },
    }),
    {
      name: 'chin-auth',
      onRehydrateStorage: () => (state) => {
        // Sau khi hydrate từ localStorage, sync token vào key để api.js dùng
        if (state?.token) {
          localStorage.setItem('chin-token', state.token)
        }
      },
    },
  ),
)
