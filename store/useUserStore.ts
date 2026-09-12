import { create } from 'zustand'
import Cookies from 'js-cookie'
import { authService, AccountResponse } from '@/lib/services/auth.service'
import { useCartStore } from './useCartStore'

export interface User extends AccountResponse {}

interface UserState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  setIsAuthenticated: (isAuthenticated: boolean) => void
  fetchUser: () => Promise<void>
  logout: () => void
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isAuthenticated: !!Cookies.get('access_token'),
  isLoading: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  fetchUser: async () => {
    set({ isLoading: true })
    try {
      const userData = await authService.getAccount()
      set({ user: userData, isAuthenticated: true })
    } catch (error) {
      console.error('Failed to fetch user:', error)
      set({ user: null, isAuthenticated: false })
      Cookies.remove('access_token', { path: '/' })
    } finally {
      set({ isLoading: false })
    }
  },
  logout: () => {
    useCartStore.getState().clearCart()
    Cookies.remove('access_token', { path: '/' })
    set({ user: null, isAuthenticated: false })
  },
}))
