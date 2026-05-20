import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole = 'student' | 'registrar' | 'lab' | 'nurse' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  matricNumber?: string
  staffId?: string
  onboarding_completed?: boolean
}

interface AuthState {
  user: User | null
  token: string | null
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      logout: () => {
        set({ user: null, token: null })
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('user')
          sessionStorage.removeItem('token')
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)
