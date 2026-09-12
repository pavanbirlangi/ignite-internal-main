import { create } from 'zustand'

export type AuthMode = 'login' | 'register' | 'recover' | 'email-sent' | 'recover-email-sent'

interface AuthModalState {
  open: boolean
  mode: AuthMode
  openModal: (mode?: AuthMode) => void
  closeModal: () => void
  setMode: (mode: AuthMode) => void
}

export const useAuthModalStore = create<AuthModalState>((set) => ({
  open: false,
  mode: 'login',
  openModal: (mode = 'login') => set({ open: true, mode }),
  closeModal: () => set({ open: false }),
  setMode: (mode) => set({ mode }),
}))
