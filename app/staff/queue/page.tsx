'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ListChecks, Search, Clock, CheckCircle2, XCircle, 
  AlertTriangle, ArrowRight, ChevronDown, ChevronUp, Bell, Info, Lock 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/auth-store'
import { useRegistrationStore, Student } from '@/store/registration-store'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'

// Safe confirmation typing modal for bulk action
function BulkConfirmInput({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  const [val, setVal] = useState('')
  return (
    <div className="space-y-4">
      <Input
        placeholder="Type CONFIRM"
        value={val}
        onChange={e => setVal(e.target.value)}
        className="text-center font-mono font-bold tracking-widest border-destructive/50 focus-visible:ring-destructive"
      />
      <div className="flex gap-3 justify-end">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button
          disabled={val !== 'CONFIRM'}
          className="bg-destructive hover:bg-destructive/90 text-white disabled:opacity-40"
          onClick={onConfirm}
        >
          Mark All as Missed
        </Button>
      </div>
    </div>
  )
}

export default function StaffQueuePage() {
  const { user } = useAuthStore()
  const { 
    schedules, getQueueForPhase, markPresent, markAbsent 
  } = useRegistrationStore()

  // Determine current phase based on staff role
  const phase = useMemo(() => {
    if (!user) return 1
    if (user.role === 'registrar') return 1
    if (user.role === 'lab') return 2
    if (user.role === 'nurse') return 3
    return 1
  }, [user])

  const currentSchedule = schedules[phase]
  const queue = getQueueForPhase(phase)

  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Attended' | 'Missed'>('All')
  const [rowStatus, setRowStatus] = useState<Record<string, 'attended' | 'missed'>>({})
  const [confirmTarget, setConfirmTarget] = useState<{ student: Student, action: 'attended' | 'missed' } | null>(null)
  
  // Bulk-missed modals
  const [showBulkMissed1, setShowBulkMissed1] = useState(false)
  const [showBulkMissed2, setShowBulkMissed2] = useState(false)

  const fetchQueue = useRegistrationStore((state) => state.fetchQueue)

  useEffect(() => {
    fetchQueue(phase)
  }, [phase])

  // Ticker for freshness
  const [lastUpdatedSecs, setLastUpdatedSecs] = useState(0)
  const lastUpdatedRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    lastUpdatedRef.current = setInterval(() => setLastUpdatedSecs(s => s + 1), 1000)
    return () => { if (lastUpdatedRef.current) clearInterval(lastUpdatedRef.current) }
  }, [])

  const resetLastUpdated = () => {
    setLastUpdatedSecs(0)
    fetchQueue(phase)
  }

  const activeQueue = useMemo(() => {
    if (!currentSchedule?.isActive) return []
    return queue.slice(0, currentSchedule.maxStudents)
  }, [queue, currentSchedule])

  const filteredQueue = activeQueue.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.matricNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.phaseNumbers[phase as 1|2|3]?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const status = rowStatus[s.userId]
    if (filter === 'Attended') return status === 'attended' && matchesSearch
    if (filter === 'Missed') return status === 'missed' && matchesSearch
    if (filter === 'Pending') return !status && matchesSearch
    return matchesSearch
  })

  const handlePresent = (student: Student) => {
    setConfirmTarget({ student, action: 'attended' })
  }

  const handleAbsent = (student: Student) => {
    setConfirmTarget({ student, action: 'missed' })
  }

  const commitAction = (student: Student, action: 'attended' | 'missed') => {
    setConfirmTarget(null)
    if (action === 'attended') {
      markPresent(student.userId, phase)
      setRowStatus(prev => ({ ...prev, [student.userId]: 'attended' }))
      toast.success(`${student.name} marked as attended and advanced.`)
    } else {
      markAbsent(student.userId, phase)
      setRowStatus(prev => ({ ...prev, [student.userId]: 'missed' }))
      toast.error(`${student.name} marked as missed.`)
    }
    resetLastUpdated()
  }

  const confirmBulkMissed = () => {
    activeQueue.filter(s => !rowStatus[s.userId]).forEach(s => {
      markAbsent(s.userId, phase)
      setRowStatus(prev => ({ ...prev, [s.userId]: 'missed' }))
    })
    setShowBulkMissed2(false)
    toast.error('All pending students marked as missed.')
    resetLastUpdated()
  }

  if (!user) return null

  return (
    <div className="space-y-8 animate-fadeInUp">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground flex items-center gap-3">
            <ListChecks className="w-8 h-8 text-primary" /> Today's Queue Manager
          </h1>
          <p className="text-muted-foreground mt-1">
            Role: <span className="capitalize font-bold text-foreground">{user.role}</span> | Phase {phase} Queue Panel
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl border border-border shadow-sm text-xs font-mono font-bold text-muted-foreground">
          <Clock className="w-4 h-4 text-primary" />
          <span>Last updated: {lastUpdatedSecs < 60 ? `${lastUpdatedSecs}s ago` : `${Math.floor(lastUpdatedSecs / 60)}m ago`}</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search active queue by Name, Matric, or Appt No..." 
              className="pl-10 h-11 bg-white border-border"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={!currentSchedule?.isActive}
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            <div className="bg-white rounded-lg border border-border p-1 flex">
              {(['All', 'Pending', 'Attended', 'Missed'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                    filter === f ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowBulkMissed1(true)}
              disabled={!currentSchedule?.isActive || activeQueue.filter(s => !rowStatus[s.userId]).length === 0}
              className="gap-2 border-destructive/20 text-destructive hover:bg-destructive/5 text-xs shrink-0"
            >
              <XCircle className="w-4 h-4" /> Mark All Missed
            </Button>
          </div>
        </div>

        {/* Immersive Queue Table Card */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  <th className="text-left p-4 font-bold text-muted-foreground">Queue #</th>
                  <th className="text-left p-4 font-bold text-muted-foreground">Student Info</th>
                  <th className="text-left p-4 font-bold text-muted-foreground">Time Slot</th>
                  <th className="text-left p-4 font-bold text-muted-foreground">Status</th>
                  <th className="text-right p-4 font-bold text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {!currentSchedule?.isActive ? (
                  <tr>
                    <td colSpan={5} className="p-16 text-center text-muted-foreground">
                      <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p className="font-bold">No active schedule published for today.</p>
                      <p className="text-xs mt-1">Please head to the Schedule Manager to publish your clinic slots.</p>
                    </td>
                  </tr>
                ) : filteredQueue.length > 0 ? (
                  filteredQueue.map((student, idx) => {
                    const start = new Date(`2000-01-01T${currentSchedule.startTime}`)
                    const myTime = new Date(start.getTime() + idx * currentSchedule.durationPerStudent * 60000)
                    const timeStr = myTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    
                    const nowTime = new Date()
                    const realStart = new Date(`${format(new Date(), 'yyyy-MM-dd')}T${myTime.toTimeString().split(' ')[0]}`)
                    const realEnd = new Date(realStart.getTime() + currentSchedule.durationPerStudent * 60000)
                    const isActiveSlot = nowTime >= realStart && nowTime < realEnd

                    const rowSt = rowStatus[student.userId]

                    return (
                      <motion.tr
                        key={student.userId}
                        layout
                        animate={{
                          backgroundColor: rowSt === 'attended' ? 'rgba(11,94,60,0.07)' :
                                           rowSt === 'missed'   ? 'rgba(192,57,43,0.07)' :
                                           isActiveSlot         ? 'rgba(232,150,12,0.10)' : 'transparent'
                        }}
                        transition={{ duration: 0.3 }}
                        className={`group relative ${
                          isActiveSlot && !rowSt ? 'border-l-4 border-l-amber-500' :
                          rowSt === 'attended'  ? 'border-l-4 border-l-primary' :
                          rowSt === 'missed'    ? 'border-l-4 border-l-destructive' : ''
                        }`}
                      >
                        <td className="p-4 font-mono font-bold text-primary">{student.phaseNumbers[phase as 1|2|3]}</td>
                        <td className="p-4">
                          <div>
                            <p className="font-bold text-foreground">{student.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{student.matricNumber}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-muted-foreground font-mono text-xs">
                            <Clock className="w-3.5 h-3.5 text-primary/50" /> {timeStr}
                          </div>
                        </td>
                        <td className="p-4">
                          {rowSt === 'attended' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-wider">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Attended
                            </span>
                          ) : rowSt === 'missed' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-destructive/10 text-destructive rounded-full text-[10px] font-bold uppercase tracking-wider">
                              <XCircle className="w-3.5 h-3.5" /> Missed
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-[10px] font-bold uppercase tracking-wider">Pending</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {!rowSt ? (
                            student.canProcess === false ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                <Lock className="w-3.5 h-3.5" /> Locked until {timeStr}
                              </span>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  className="bg-primary hover:bg-primary/90 text-white gap-1.5 h-8 px-3"
                                  onClick={() => handlePresent(student)}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" /> <span>Attended</span>
                                </Button>
                                <Button
                                  size="sm" variant="outline"
                                  className="border-destructive/50 text-destructive hover:bg-destructive/10 gap-1.5 h-8 px-3"
                                  onClick={() => handleAbsent(student)}
                                >
                                  <XCircle className="w-3.5 h-3.5" /> <span>Missed</span>
                                </Button>
                              </div>
                            )
                          ) : null}
                        </td>
                      </motion.tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-muted-foreground">
                      <Search className="w-8 h-8 mx-auto mb-3 opacity-20" />
                      <p>No students match your filter conditions.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/60 backdrop-blur-sm"
              onClick={() => setConfirmTarget(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className={`relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-xl border p-6 ${
                confirmTarget.action === 'attended' ? 'border-primary/20' : 'border-destructive/20'
              }`}
            >
              <h3 className="font-bold text-foreground text-lg mb-1">
                {confirmTarget.action === 'attended' ? '✅ Confirm Attendance' : '❌ Confirm Missed Slot'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Verify details for <span className="font-bold text-foreground">{confirmTarget.student.name}</span>.
              </p>
              <div className="flex gap-3 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setConfirmTarget(null)}>Cancel</Button>
                <Button
                  size="sm"
                  className={confirmTarget.action === 'attended' ? 'bg-primary hover:bg-primary/90 text-white' : 'bg-destructive hover:bg-destructive/90 text-white'}
                  onClick={() => commitAction(confirmTarget.student, confirmTarget.action)}
                >
                  {confirmTarget.action === 'attended' ? 'Yes, Checked-In' : 'Yes, Absent'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Warning Step 1 */}
      <AnimatePresence>
        {showBulkMissed1 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/70 backdrop-blur-sm"
              onClick={() => setShowBulkMissed1(false)}
            />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl border border-destructive/20 p-6"
            >
              <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-4" />
              <h3 className="text-xl font-bold font-display text-center mb-2">Bulk Absences</h3>
              <p className="text-sm text-muted-foreground text-center mb-6">
                This will mark <strong>{activeQueue.filter(s => !rowStatus[s.userId]).length} students</strong> as absent. They will need to register a new slot.
              </p>
              <div className="flex gap-3 justify-end">
                <Button variant="ghost" onClick={() => setShowBulkMissed1(false)}>Cancel</Button>
                <Button className="bg-destructive hover:bg-destructive/90 text-white" onClick={() => { setShowBulkMissed1(false); setShowBulkMissed2(true) }}>
                  Proceed →
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Confirm Step 2 */}
      <AnimatePresence>
        {showBulkMissed2 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setShowBulkMissed2(false)}
            />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl border border-destructive p-6"
            >
              <div className="bg-destructive/10 rounded-xl p-4 mb-6 text-center">
                <p className="font-bold text-destructive">⚠️ Double Confirmation Required</p>
                <p className="text-xs text-destructive/80 mt-1">Please type <span className="font-mono font-bold">CONFIRM</span> to commit</p>
              </div>
              <BulkConfirmInput onConfirm={confirmBulkMissed} onCancel={() => setShowBulkMissed2(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
