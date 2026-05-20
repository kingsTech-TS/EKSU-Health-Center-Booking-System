'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, ShieldAlert, CheckCircle2, Calendar, Eye, Trash2, CheckSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'
import { useRegistrationStore, Notification } from '@/store/registration-store'

export default function StudentNotificationsPage() {
  const { notifications, fetchNotifications, markNotificationRead, deleteNotification } = useRegistrationStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchNotifications()
  }, [])

  const handleMarkAllRead = () => {
    notifications.filter(n => !n.read).forEach(n => markNotificationRead(n.id))
    toast.success('All notifications marked as read!')
  }

  const handleToggleRead = (id: string) => {
    markNotificationRead(id)
  }

  const handleDelete = (id: string) => {
    deleteNotification(id)
    toast.success('Notification removed.')
  }

  if (!mounted) return null

  return (
    <div className="space-y-8 animate-fadeInUp">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground flex items-center gap-3">
            <Bell className="w-8 h-8 text-primary" /> Notifications
          </h1>
          <p className="text-muted-foreground mt-1">Stay updated with your real-time medical clearance alerts and timeline tasks.</p>
        </div>
        
        {notifications.some(n => !n.read) && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleMarkAllRead}
            className="border-primary/20 text-primary hover:bg-primary/5 gap-2 shrink-0 self-start sm:self-auto"
          >
            <CheckSquare className="w-4 h-4" /> Mark all as read
          </Button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden max-w-4xl">
        <div className="divide-y divide-border/50">
          <AnimatePresence initial={false}>
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <motion.div
                  key={notif.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`p-6 flex gap-4 transition-colors hover:bg-muted/10 relative ${
                    !notif.read ? 'bg-primary/5 border-l-4 border-l-primary' : 'bg-transparent'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    notif.type === 'success' ? 'bg-green-500/10 text-green-500' :
                    notif.type === 'warn' ? 'bg-amber-500/10 text-amber-500' :
                    'bg-primary/10 text-primary'
                  }`}>
                    {notif.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> :
                     notif.type === 'warn' ? <ShieldAlert className="w-5 h-5" /> :
                     <Calendar className="w-5 h-5" />}
                  </div>

                  <div className="flex-1 space-y-1 pr-12">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-foreground text-sm sm:text-base">{notif.title}</h4>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{notif.desc}</p>
                    <span className="inline-block text-xs font-mono text-muted-foreground/60">{notif.time}</span>
                  </div>

                  {/* Desktop Hover Actions */}
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => handleToggleRead(notif.id)}
                      title={notif.read ? 'Already read' : 'Mark read'}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(notif.id)}
                      title="Delete notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="p-16 text-center text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="font-bold">All caught up!</p>
                <p className="text-xs mt-1">No new system notifications at the moment.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
