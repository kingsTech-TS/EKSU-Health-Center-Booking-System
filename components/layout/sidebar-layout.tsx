'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Menu, X, LogOut, Heart, Bell } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { NotificationsPanel } from './notifications-panel'

interface NavItem {
  icon: any
  label: string
  href: string
}

interface SidebarLayoutProps {
  children: React.ReactNode
  navItems: NavItem[]
  requiredRole?: 'student' | 'admin' | 'staff'
}

export function SidebarLayout({ children, navItems, requiredRole }: SidebarLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!user) {
      const storedUser = sessionStorage.getItem('user')
      if (!storedUser) {
        router.push('/login')
        return
      }
    }

    // Role Guard Check
    if (user && requiredRole) {
      if (requiredRole === 'staff' && !['registrar', 'lab', 'nurse'].includes(user.role)) {
        router.push('/login')
        return
      } else if (requiredRole !== 'staff' && user.role !== requiredRole) {
        router.push('/login')
        return
      }

      // Check if Staff needs onboarding
      if (requiredRole === 'staff' && user.onboarding_completed === false) {
        // Prevent infinite loop if already on onboarding
        if (!window.location.pathname.includes('/staff/onboarding')) {
          router.push('/staff/onboarding')
        }
      }
    }
  }, [user, router, requiredRole])

  if (!mounted || !user) {
    return null
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`bg-white border-r border-border flex flex-col transition-all duration-300 fixed lg:relative h-full z-40 lg:z-auto ${
          sidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:w-20 lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-border/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0">
            <Heart className="w-6 h-6 text-primary-foreground" />
          </div>
          {sidebarOpen && <span className="font-bold truncate tracking-tight font-display text-foreground">EKSU Health</span>}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link key={item.label} href={item.href}>
                <div className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group cursor-pointer ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' 
                    : 'text-muted-foreground hover:bg-gray-100 hover:text-foreground'
                }`}>
                  <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? 'text-primary-foreground' : 'group-hover:text-primary'}`} />
                  {sidebarOpen && <span className="font-medium truncate">{item.label}</span>}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Notifications Trigger */}
        <div className="px-4 py-2 border-t border-border/30">
          <Button 
            variant="ghost" 
            className={`w-full justify-start text-foreground hover:bg-primary/10 hover:text-primary ${sidebarOpen ? 'px-4' : 'px-0 justify-center'} relative`}
            onClick={() => setNotificationsOpen(true)}
          >
            <div className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-secondary rounded-full border-2 border-card" />
            </div>
            {sidebarOpen && <span className="ml-3 font-medium">Notifications</span>}
          </Button>
        </div>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-border/30 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20 flex-shrink-0">
              {user.name.charAt(0)}
            </div>
            {sidebarOpen && (
              <div className="truncate">
                <p className="font-bold text-sm text-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground capitalize font-mono truncate">{user.role}</p>
              </div>
            )}
          </div>
          
          <Button 
            variant="ghost" 
            className={`w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 ${sidebarOpen ? 'px-4' : 'px-0 justify-center'}`}
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="ml-3 font-medium">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-background overflow-hidden relative">
        
        {/* Mobile Header */}
        <header className="lg:hidden h-16 border-b border-border flex items-center justify-between px-4 bg-white shrink-0 relative z-30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold tracking-tight text-foreground font-display">EKSU</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </header>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative z-10">
          <div className="max-w-7xl mx-auto h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 15, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.99 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="h-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <NotificationsPanel isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
      </main>
    </div>
  )
}
