'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Check, Info, AlertTriangle, Calendar, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRegistrationStore } from '@/store/registration-store'

export function NotificationsPanel({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { notifications, fetchNotifications, markNotificationRead } = useRegistrationStore()

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen])

  const markAllRead = () => {
    notifications.filter(n => !n.read).forEach(n => markNotificationRead(n.id))
  }

  const markAsRead = (id: string) => {
    markNotificationRead(id)
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/20 backdrop-blur-sm z-40 lg:hidden"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="absolute top-20 right-4 lg:right-8 w-[350px] bg-white rounded-2xl shadow-2xl border border-border z-50 overflow-hidden"
          >
            <div className="bg-muted/30 p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-bold font-display text-foreground">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-secondary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs text-primary hover:text-primary/80 h-8 px-2">
                <Check className="w-3.5 h-3.5 mr-1" /> Mark all read
              </Button>
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {notifications.length > 0 ? (
                <div className="divide-y divide-border/50">
                  {notifications.map((notif) => {
                    const Icon = notif.type === 'success' ? CheckCircle2 : notif.type === 'warn' ? AlertTriangle : Info
                    const colorClass = notif.type === 'success' ? 'text-primary bg-primary/10' : notif.type === 'warn' ? 'text-destructive bg-destructive/10' : 'text-blue-500 bg-blue-500/10'

                    return (
                      <div 
                        key={notif.id}
                        onClick={() => markAsRead(notif.id)}
                        className={`p-4 hover:bg-muted/30 transition-colors cursor-pointer relative ${!notif.read ? 'bg-primary/5' : ''}`}
                      >
                        {!notif.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary" />}
                        <div className="flex gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className={`text-sm ${!notif.read ? 'font-bold text-foreground' : 'font-medium text-foreground/80'}`}>{notif.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{notif.desc}</p>
                            <p className="text-[10px] text-muted-foreground/60 mt-2 uppercase font-bold tracking-wider">{notif.time}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No notifications yet.</p>
                </div>
              )}
            </div>
            <div className="p-3 bg-muted/30 border-t border-border text-center">
              <button onClick={onClose} className="text-xs font-bold text-muted-foreground hover:text-foreground">Close Panel</button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
