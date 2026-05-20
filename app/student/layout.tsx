'use client'

import { SidebarLayout } from '@/components/layout/sidebar-layout'
import { Home, Calendar, User, Bell } from 'lucide-react'

const studentNavItems = [
  { icon: Home, label: 'Dashboard', href: '/student/dashboard' },
  { icon: Calendar, label: 'My Appointments', href: '/student/appointments' },
  { icon: User, label: 'My Profile', href: '/student/profile' },
  { icon: Bell, label: 'Notifications', href: '/student/notifications' },
]

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarLayout navItems={studentNavItems} requiredRole="student">
      {children}
    </SidebarLayout>
  )
}
