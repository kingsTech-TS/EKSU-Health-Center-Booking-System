'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, Search, Calendar, Filter, User, MapPin, Clock, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/auth-store'
import { toast } from 'react-hot-toast'
import { API_BASE_URL } from '@/lib/api-config'

interface ActivityLog {
  id: string
  action: string
  timestamp: string
  target_id?: string
  details?: string
  staff_id: string
  staff_name?: string
  role?: string
}

export default function AdminActivityPage() {
  const { token } = useAuthStore()
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchActivities = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/admin/activities`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (res.ok) {
        const data = await res.json()
        setLogs(data)
      } else {
        toast.error('Failed to load activity logs')
      }
    } catch (e) {
      console.error(e)
      toast.error('Network error loading activities')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (token) fetchActivities()
  }, [token])

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (log.staff_name && log.staff_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase())) ||
    log.staff_id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getActionIcon = (action: string) => {
    const act = action.toLowerCase()
    if (act.includes('check_in') || act.includes('present')) return <CheckCircle2 className="w-4 h-4 text-primary" />
    if (act.includes('missed') || act.includes('absent')) return <XCircle className="w-4 h-4 text-destructive" />
    if (act.includes('schedule')) return <Calendar className="w-4 h-4 text-blue-500" />
    return <Activity className="w-4 h-4 text-muted-foreground" />
  }

  const getActionColor = (action: string) => {
    const act = action.toLowerCase()
    if (act.includes('check_in') || act.includes('present')) return 'bg-primary/10'
    if (act.includes('missed') || act.includes('absent')) return 'bg-destructive/10'
    if (act.includes('schedule')) return 'bg-blue-500/10'
    return 'bg-muted/30'
  }

  return (
    <div className="space-y-8 animate-fadeInUp pb-12">
      <div>
        <h1 className="text-3xl font-bold font-display text-foreground flex items-center gap-3">
          <Activity className="w-8 h-8 text-primary" /> System Activity Log
        </h1>
        <p className="text-muted-foreground mt-1">Real-time audit trail of all staff operations, queue modifications, and student clearances.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search action, staff name, or details..." 
            className="pl-10 h-11 bg-muted/20 border-border"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <Button variant="outline" size="sm" className="h-11 shrink-0"><Filter className="w-4 h-4 mr-2"/> Action Type</Button>
          <Button variant="outline" size="sm" className="h-11 shrink-0"><Calendar className="w-4 h-4 mr-2"/> Date Range</Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary/50" />
            <p className="mt-4 text-muted-foreground">Loading audit logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-16 text-center text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No activity records found matching criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filteredLogs.map((log, index) => (
              <div key={log.id ? String(log.id) : `log-${index}`} className="p-6 hover:bg-muted/10 transition-colors flex flex-col md:flex-row gap-4 md:items-center">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-1 ${getActionColor(log.action)}`}>
                    {getActionIcon(log.action)}
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground text-sm sm:text-base capitalize">
                      {log.action.replace(/_/g, ' ')}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">
                      {log.details || `Performed operation on target: ${log.target_id || 'system'}`}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-xs font-mono text-muted-foreground">
                      <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                        <User className="w-3.5 h-3.5" /> 
                        <span className="font-bold text-foreground">{log.staff_name || log.staff_id}</span>
                        {log.role && <span className="uppercase text-[9px] border px-1 ml-1 rounded">{log.role}</span>}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
