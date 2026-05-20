'use client'

import { SidebarLayout } from '@/components/layout/sidebar-layout'
import { Users, Upload, BarChart3, Settings, ShieldCheck, Activity } from 'lucide-react'

const adminNavItems = [
  { icon: BarChart3, label: 'Analytics Overview', href: '/admin/dashboard' },
  { icon: ShieldCheck, label: 'Staff Management', href: '/admin/staff' },
  { icon: Activity, label: 'Activity Log', href: '/admin/activities' },
  { icon: Users, label: 'Student Records', href: '/admin/students' },
  { icon: Upload, label: 'Upload Records', href: '/admin/upload' },
  { icon: Settings, label: 'System Settings', href: '/admin/settings' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarLayout navItems={adminNavItems} requiredRole="admin">
      {children}
    </SidebarLayout>
  )
}
