'use client'

import { SidebarLayout } from '@/components/layout/sidebar-layout'
import { LayoutDashboard, ListChecks, CalendarDays, Users, Bell } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()

  const getPhaseHref = () => {
    if (user?.role === 'registrar') return '/staff/phase1'
    if (user?.role === 'lab') return '/staff/phase2'
    if (user?.role === 'nurse') return '/staff/phase3'
    return '/staff/phase1'
  }

  const phaseHref = getPhaseHref()

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: phaseHref },
    { icon: ListChecks,      label: "Today's Queue", href: '/staff/queue' },
    { icon: CalendarDays,    label: 'Schedule Manager', href: '/staff/schedule' },
    { icon: Users,           label: 'All Students', href: '/staff/students' },
    { icon: Bell,            label: 'Notifications', href: '/staff/notifications' },
  ]

  return (
    <SidebarLayout navItems={navItems} requiredRole="staff">
      {children}
    </SidebarLayout>
  )
}
