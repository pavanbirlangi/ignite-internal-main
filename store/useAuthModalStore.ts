import { create } from 'zustand'

export type AuthMode =
  | 'login'
  | 'register'
  | 'recover'
  | 'email-sent'
  | 'recover-email-sent'
  | 'email-code'
  | 'verify-email'

interface AuthModalState {
  open: boolean
  mode: AuthMode
  // The email waiting for its verification code (mode 'verify-email').
  verifyEmail: string | null
  openModal: (mode?: AuthMode) => void
  closeModal: () => void
  setMode: (mode: AuthMode) => void
  showVerifyEmail: (email: string) => void
}

export const useAuthModalStore = create<AuthModalState>((set) => ({
  open: false,
  mode: 'login',
  verifyEmail: null,
  openModal: (mode = 'login') => set({ open: true, mode }),
  closeModal: () => set({ open: false }),
  setMode: (mode) => set({ mode }),
  showVerifyEmail: (email) => set({ mode: 'verify-email', verifyEmail: email }),
}))
