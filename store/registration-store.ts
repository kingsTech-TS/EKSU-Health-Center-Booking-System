import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAuthStore } from './auth-store'
import { API_BASE_URL } from '@/lib/api-config'

export type PhaseType = 1 | 2 | 3 | 4

export interface StudentProgress {
  userId: string
  name: string
  matricNumber: string
  registrationOrder: number
  currentPhase: PhaseType
  phaseNumbers: {
    1: string | null
    2: string | null
    3: string | null
  }
  onboardingCompleted: boolean
  canProcess?: boolean
}

export type Student = StudentProgress

export interface PhaseSchedule {
  phase: PhaseType
  date: string
  startTime: string
  endTime: string
  durationPerStudent: number
  maxStudents: number
  isActive: boolean
}

export interface Notification {
  id: string
  title: string
  desc: string
  time: string
  type: 'info' | 'success' | 'warn'
  read: boolean
}

interface RegistrationState {
  students: StudentProgress[]
  schedules: Record<number, PhaseSchedule | null>
  globalCounter: number
  notifications: Notification[]

  // Core Actions
  registerStudent: (userId: string, name: string, matricNumber: string) => void
  completeOnboarding: (userId: string) => Promise<void>
  setSchedule: (phase: PhaseType, schedule: Omit<PhaseSchedule, 'phase' | 'isActive'>) => Promise<void>
  markPresent: (userId: string, phase: PhaseType) => Promise<void>
  markAbsent: (userId: string, phase: PhaseType) => Promise<void>
  getStudentProgress: (userId: string) => StudentProgress | undefined
  getQueueForPhase: (phase: PhaseType) => StudentProgress[]
  
  // Backend Sync Helpers
  fetchStudentDashboard: () => Promise<void>
  fetchQueue: (phase: PhaseType, date?: string) => Promise<void>
  requestSlot: (phase: PhaseType, date: string, timeSlot: string) => Promise<void>
  fetchNotifications: () => Promise<void>
  markNotificationRead: (id: string) => Promise<void>
  deleteNotification: (id: string) => Promise<void>
}

const generateAppointmentNumber = (phase: number, order: number) => {
  return `PH${phase}-${order.toString().padStart(4, '0')}`
}

const apiFetch = async (path: string, options: RequestInit = {}) => {
  const token = useAuthStore.getState().token || (typeof window !== 'undefined' ? sessionStorage.getItem('token') : null)
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })
  return response
}

export const useRegistrationStore = create<RegistrationState>()(
  persist(
    (set, get) => ({
      students: [],
      schedules: { 1: null, 2: null, 3: null },
      globalCounter: 100,
      notifications: [],

      registerStudent: (userId, name, matricNumber) => {
        set((state) => {
          const exists = state.students.find(s => s.userId === userId)
          if (exists) return state

          const order = state.globalCounter + 1
          return {
            globalCounter: order,
            students: [...state.students, {
              userId,
              name,
              matricNumber,
              registrationOrder: order,
              currentPhase: 1,
              phaseNumbers: {
                1: generateAppointmentNumber(1, order),
                2: null,
                3: null
              },
              onboardingCompleted: false
            }]
          }
        })
      },

      completeOnboarding: async (userId) => {
        try {
          const res = await apiFetch('/api/v1/student/onboarding', {
            method: 'POST',
            body: JSON.stringify({ onboarding_completed: true })
          })
          if (!res.ok) throw new Error('Failed to update onboarding on backend')
        } catch (e) {
          console.warn('Backend onboarding update failed, using fallback:', e)
        }
        
        // Always commit locally to maintain fallback state
        set((state) => ({
          students: state.students.map(s => 
            s.userId === userId ? { ...s, onboardingCompleted: true } : s
          )
        }))
      },

      setSchedule: async (phase, schedule) => {
        const res = await apiFetch('/api/v1/staff/schedule', {
          method: 'POST',
          body: JSON.stringify({
            phase,
            date: schedule.date,
            start_time: schedule.startTime,
            end_time: schedule.endTime,
            duration_per_student: schedule.durationPerStudent,
            max_students: schedule.maxStudents
          })
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.detail || 'Failed to publish schedule')
        }

        set((state) => ({
          schedules: {
            ...state.schedules,
            [phase]: { ...schedule, phase, isActive: true }
          }
        }))
      },

      markPresent: async (userId, phase) => {
        try {
          const res = await apiFetch('/api/v1/staff/queue/check-in', {
            method: 'POST',
            body: JSON.stringify({ student_id: userId, phase })
          })
          if (!res.ok) throw new Error('Failed to check in student on backend')
        } catch (e) {
          console.warn('Backend queue check-in failed, using fallback:', e)
        }

        set((state) => {
          const nextPhase = (phase + 1) as PhaseType
          return {
            students: state.students.map(s => {
              if (s.userId !== userId) return s
              return {
                ...s,
                currentPhase: nextPhase,
                phaseNumbers: {
                  ...s.phaseNumbers,
                  [nextPhase]: nextPhase < 4 ? generateAppointmentNumber(nextPhase, s.registrationOrder) : null
                }
              }
            })
          }
        })
      },

      markAbsent: async (userId, phase) => {
        try {
          const res = await apiFetch('/api/v1/staff/queue/miss', {
            method: 'POST',
            body: JSON.stringify({ student_id: userId, phase })
          })
          if (!res.ok) throw new Error('Failed to check out student on backend')
        } catch (e) {
          console.warn('Backend queue miss failed, using fallback:', e)
        }

        set((state) => {
          const newOrder = state.globalCounter + 1
          return {
            globalCounter: newOrder,
            students: state.students.map(s => {
              if (s.userId !== userId) return s
              return {
                ...s,
                phaseNumbers: {
                  ...s.phaseNumbers,
                  [phase]: generateAppointmentNumber(phase, newOrder)
                }
              }
            })
          }
        })
      },

      getStudentProgress: (userId) => {
        return get().students.find(s => s.userId === userId)
      },

      getQueueForPhase: (phase) => {
        const p = phase as 1|2|3
        return get().students
          .filter(s => s.currentPhase === phase && s.phaseNumbers[p])
          .sort((a, b) => {
            const numA = parseInt(a.phaseNumbers[p]!.split('-')[1])
            const numB = parseInt(b.phaseNumbers[p]!.split('-')[1])
            return numA - numB
          })
      },

      fetchStudentDashboard: async () => {
        try {
          const res = await apiFetch('/api/v1/student/dashboard')
          if (res.ok) {
            const data = await res.json()
            // Map backend dashboard response to update student record state
            set((state) => {
              const currentStudents = [...state.students]
              const user = useAuthStore.getState().user
              if (!user) return state
              
              const idx = currentStudents.findIndex(s => s.userId === user.id)
              const mapped = {
                userId: user.id,
                name: user.name,
                matricNumber: user.matricNumber || '',
                registrationOrder: data.registration_order || 101,
                currentPhase: data.current_phase as PhaseType,
                phaseNumbers: {
                  1: data.phase_numbers?.['1'] || null,
                  2: data.phase_numbers?.['2'] || null,
                  3: data.phase_numbers?.['3'] || null,
                },
                onboardingCompleted: data.onboarding_completed || false,
              }

              if (idx > -1) {
                currentStudents[idx] = mapped
              } else {
                currentStudents.push(mapped)
              }
              return { students: currentStudents }
            })
          }
        } catch (e) {
          console.warn('Failed to fetch student dashboard:', e)
        }
      },

      fetchQueue: async (phase, date) => {
        try {
          const queryDate = date || new Date().toISOString().split('T')[0]
          const res = await apiFetch(`/api/v1/staff/queue?phase=${phase}&date=${queryDate}`)
          if (res.ok) {
            const data = await res.json()
            // Hydrate local students array based on incoming appointments queue
            set(() => {
              const mappedQueue = data.map((item: any) => ({
                userId: item.student_id || Math.random().toString(),
                name: item.name || 'Student',
                matricNumber: item.matric_number || '',
                registrationOrder: item.registration_order || 101,
                currentPhase: phase,
                phaseNumbers: {
                  1: phase === 1 ? item.appointment_number : null,
                  2: phase === 2 ? item.appointment_number : null,
                  3: phase === 3 ? item.appointment_number : null,
                },
                onboardingCompleted: true,
                canProcess: item.can_process !== undefined ? item.can_process : true
              }))
              return { students: mappedQueue }
            })
          }
        } catch (e) {
          console.warn('Failed to fetch staff queue:', e)
        }
      },

      requestSlot: async (phase, date, timeSlot) => {
        const res = await apiFetch('/api/v1/student/request', {
          method: 'POST',
          body: JSON.stringify({ phase, date, time_slot: timeSlot })
        })
        if (!res.ok) {
          const errData = await res.json()
          throw new Error(errData.detail || 'Slot booking request failed')
        }
        // Backend auto-generates a booking notification; refresh local list
        get().fetchNotifications()
      },

      fetchNotifications: async () => {
        try {
          const res = await apiFetch('/api/v1/notifications')
          if (res.ok) {
            const data = await res.json()
            const mapped: Notification[] = data.map((n: any) => ({
              id: n._id || n.id,
              title: n.title,
              desc: n.description || n.desc || '',
              time: n.created_at ? new Date(n.created_at).toLocaleString() : 'Just now',
              type: n.type || 'info',
              read: n.is_read ?? false,
            }))
            set({ notifications: mapped })
          }
        } catch (e) {
          console.warn('Failed to fetch notifications:', e)
        }
      },

      markNotificationRead: async (id) => {
        try {
          await apiFetch(`/api/v1/notifications/${id}/read`, { method: 'PATCH' })
        } catch (e) {
          console.warn('Failed to mark notification read on backend:', e)
        }
        set((state) => ({
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
          )
        }))
      },

      deleteNotification: async (id) => {
        try {
          await apiFetch(`/api/v1/notifications/${id}`, { method: 'DELETE' })
        } catch (e) {
          console.warn('Failed to delete notification on backend:', e)
        }
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }))
      }
    }),
    {
      name: 'medical-registration-storage',
    }
  )
)
