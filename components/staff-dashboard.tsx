'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, Clock, Users, Save, CheckCircle2, 
  XCircle, Search, Settings, AlertTriangle, Info, Shield, Lock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRegistrationStore, PhaseType, PhaseSchedule, Student } from '@/store/registration-store'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'

interface StaffDashboardProps {
  phase: PhaseType
  title: string
  description: string
}

// Small helper: typed CONFIRM to proceed with bulk-missed
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

const slotGenerator = (start: string, duration: number, count: number) => {
  const slots = []
  const startTime = new Date(`2000-01-01T${start || '00:00'}`)
  
  if (isNaN(startTime.getTime())) return []
  
  for (let i = 0; i < count; i++) {
    const slotStart = new Date(startTime.getTime() + i * duration * 60000)
    const slotEnd = new Date(startTime.getTime() + (i + 1) * duration * 60000)
    
    slots.push({
      start: slotStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      end: slotEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    })
  }
  return slots
}

export function StaffDashboard({ phase, title, description }: StaffDashboardProps) {
  const { 
    schedules, setSchedule, getQueueForPhase, 
    markPresent, markAbsent, students 
  } = useRegistrationStore()

  const currentSchedule = schedules[phase]
  const queue = getQueueForPhase(phase)
  const totalInPhase = students.filter(s => s.currentPhase === phase).length

  const [config, setConfig] = useState<Omit<PhaseSchedule, 'phase' | 'isActive'>>({
    date: currentSchedule?.date || format(new Date(), 'yyyy-MM-dd'),
    startTime: currentSchedule?.startTime || '09:00',
    endTime: currentSchedule?.endTime || '16:00',
    durationPerStudent: currentSchedule?.durationPerStudent || 5,
    maxStudents: currentSchedule?.maxStudents || 50,
  })

  // Auto-calculate max students based on time window
  useEffect(() => {
    if (config.startTime && config.endTime && config.durationPerStudent > 0) {
      const start = new Date(`2000-01-01T${config.startTime}`)
      const end = new Date(`2000-01-01T${config.endTime}`)
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start) {
        const diffMins = (end.getTime() - start.getTime()) / 60000
        const calculatedMax = Math.floor(diffMins / config.durationPerStudent)
        setConfig(prev => ({ ...prev, maxStudents: calculatedMax }))
      }
    }
  }, [config.startTime, config.endTime, config.durationPerStudent])

  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Attended' | 'Missed'>('All')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showBulkMissedStep1, setShowBulkMissedStep1] = useState(false)
  const [showBulkMissedStep2, setShowBulkMissedStep2] = useState(false)
  const [nurseConfirmStudent, setNurseConfirmStudent] = useState<Student | null>(null)
  const [clearanceIdTyping, setClearanceIdTyping] = useState<string | null>(null)
  const [clearedLog, setClearedLog] = useState<{ id: string, name: string, time: string, matric: string }[]>([])
  // Local row-level attendance state: userId -> 'attended' | 'missed'
  const [rowStatus, setRowStatus] = useState<Record<string, 'attended' | 'missed'>>({})
  // Confirmation popover target (non-Phase 3)
  const [confirmTarget, setConfirmTarget] = useState<{ student: Student, action: 'attended' | 'missed' } | null>(null)
  // Last-updated timer
  const [lastUpdatedSecs, setLastUpdatedSecs] = useState(0)
  const lastUpdatedRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Start last-updated ticker on mount
  useEffect(() => {
    lastUpdatedRef.current = setInterval(() => setLastUpdatedSecs(s => s + 1), 1000)
    return () => { if (lastUpdatedRef.current) clearInterval(lastUpdatedRef.current) }
  }, [])

  const resetLastUpdated = () => setLastUpdatedSecs(0)

  const activeQueue = useMemo(() => {
    if (!currentSchedule?.isActive) return []
    return queue.slice(0, currentSchedule.maxStudents)
  }, [queue, currentSchedule])

  const previewSlots = useMemo(() => {
    return slotGenerator(config.startTime, config.durationPerStudent, Math.min(config.maxStudents, 15))
  }, [config.startTime, config.durationPerStudent, config.maxStudents])

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

  const handleSaveSchedule = () => {
    setSchedule(phase, config)
    setShowConfirmModal(false)
    toast.success(`Schedule activated for Phase ${phase}. Calling ${config.maxStudents} students.`)
  }

  const handlePresent = (student: Student) => {
    if (phase === 3) {
      setNurseConfirmStudent(student)
    } else {
      // Show inline confirmation popover
      setConfirmTarget({ student, action: 'attended' })
    }
  }

  const commitAction = (student: Student, action: 'attended' | 'missed') => {
    setConfirmTarget(null)
    if (action === 'attended') {
      markPresent(student.userId, phase)
      setRowStatus(prev => ({ ...prev, [student.userId]: 'attended' }))
      toast.success(`${student.name} marked as attended.`)
    } else {
      markAbsent(student.userId, phase)
      setRowStatus(prev => ({ ...prev, [student.userId]: 'missed' }))
      toast.error(`${student.name} marked as missed.`)
    }
    resetLastUpdated()
  }

  const confirmNurseClearance = () => {
    if (!nurseConfirmStudent) return
    
    // Typewriter effect simulation
    setClearanceIdTyping('')
    const targetId = `CLR-2025-${Math.floor(Math.random() * 90000) + 10000}`
    
    let i = 0
    const typingInterval = setInterval(() => {
      setClearanceIdTyping(targetId.substring(0, i + 1))
      i++
      if (i === targetId.length) {
        clearInterval(typingInterval)
        setTimeout(() => {
          markPresent(nurseConfirmStudent.userId, phase)
          setClearedLog(prev => [{
            id: targetId,
            name: nurseConfirmStudent.name,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            matric: nurseConfirmStudent.matricNumber
          }, ...prev])
          toast.success('Clearance Confirmed!')
          setNurseConfirmStudent(null)
          setClearanceIdTyping(null)
        }, 600)
      }
    }, 50)
  }

  const handleAbsent = (student: Student) => {
    if (phase === 3) {
      toast.error('Use the Confirm Clearance modal to manage Phase 3 actions.')
    } else {
      setConfirmTarget({ student, action: 'missed' })
    }
  }

  const handleBulkMissed = () => setShowBulkMissedStep1(true)

  const confirmBulkMissed = () => {
    activeQueue.filter(s => !rowStatus[s.userId]).forEach(s => {
      markAbsent(s.userId, phase)
      setRowStatus(prev => ({ ...prev, [s.userId]: 'missed' }))
    })
    setShowBulkMissedStep2(false)
    toast.error('All pending students marked as missed.')
    resetLastUpdated()
  }

  return (
    <div className="space-y-8 animate-fadeInUp pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold font-display mb-2 text-foreground">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-6 text-right">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Today's Date</p>
            <p className="font-bold text-foreground">{format(new Date(), 'MMM do, yyyy')}</p>
          </div>
          <div className="h-10 w-px bg-border" />
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Queue Size</p>
            <p className="font-bold text-secondary text-2xl leading-none">{totalInPhase}</p>
          </div>
        </div>
      </div>

      {/* Phase-specific role banner */}
      {phase === 2 && (
        <div className="flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-xl px-5 py-4 text-teal-800">
          <Info className="w-5 h-5 text-teal-600 shrink-0" />
          <p className="text-sm font-medium">Only students who have completed <strong>Phase 1 (Registration)</strong> are eligible to request a Phase 2 appointment.</p>
        </div>
      )}
      {phase === 3 && (
        <div className="flex items-center gap-3 bg-violet-50 border border-violet-200 rounded-xl px-5 py-4 text-violet-800">
          <Shield className="w-5 h-5 text-violet-600 shrink-0" />
          <p className="text-sm font-medium"><strong>⚕️ Final Clearance:</strong> Marking a student as Attended in Phase 3 confirms their full medical clearance. This action cannot be undone.</p>
        </div>
      )}

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { 
            label: phase === 1 ? 'Scheduled Today' : phase === 2 ? 'Phase 2 Eligible' : 'Phase 3 Eligible',
            value: totalInPhase, color: 'text-foreground', bg: 'bg-muted/50'
          },
          { label: 'In Queue Today', value: activeQueue.length, color: 'text-secondary', bg: 'bg-secondary/10' },
          { 
            label: phase === 3 ? 'Fully Cleared Today' : 'Attended Today', 
            value: 0, color: 'text-primary', bg: 'bg-primary/10'
          },
          { label: 'Missed Today', value: 0, color: 'text-destructive', bg: 'bg-destructive/10' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl border border-border p-5 flex items-center gap-4 shadow-sm">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${stat.bg}`}>
              <span className={`text-lg font-bold font-mono ${stat.color}`}>{stat.value}</span>
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider leading-snug">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Config Panel (Only show full panel for Registrar / Phase 1, or allow all to edit their own) */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="bg-muted/30 px-6 py-4 border-b border-border flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-foreground">Schedule Configuration</h2>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-xs font-bold text-muted-foreground uppercase">Date</Label>
                <Input 
                  id="date" type="date" 
                  value={config.date} onChange={(e) => setConfig({ ...config, date: e.target.value })}
                  className="focus-visible:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start" className="text-xs font-bold text-muted-foreground uppercase">Start</Label>
                  <Input 
                    id="start" type="time" 
                    value={config.startTime} onChange={(e) => setConfig({ ...config, startTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end" className="text-xs font-bold text-muted-foreground uppercase">End</Label>
                  <Input 
                    id="end" type="time" 
                    value={config.endTime} onChange={(e) => setConfig({ ...config, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-xs font-bold text-muted-foreground uppercase">Mins / Student</Label>
                  <Input 
                    id="duration" type="number" 
                    value={config.durationPerStudent} onChange={(e) => setConfig({ ...config, durationPerStudent: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max" className="text-xs font-bold text-muted-foreground uppercase">Max Slots</Label>
                  <Input 
                    id="max" type="number" 
                    value={config.maxStudents} onChange={(e) => setConfig({ ...config, maxStudents: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <Button 
                className="w-full bg-primary hover:bg-primary/90 text-white gap-2 shadow-[0_4px_14px_0_rgba(11,94,60,0.39)]"
                onClick={() => setShowConfirmModal(true)}
              >
                <Save className="w-4 h-4" />
                {currentSchedule?.isActive ? 'Update Schedule' : 'Publish Schedule'}
              </Button>
            </div>
            
            {/* Live Preview */}
            <div className="bg-background border-t border-border p-6">
              <h3 className="text-xs font-bold text-muted-foreground uppercase mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Slot Generation Preview
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                {previewSlots.length > 0 ? previewSlots.map((slot, i) => (
                  <div key={i} className="flex items-center justify-between text-sm p-2 rounded bg-muted/50 border border-border/50 font-mono">
                    <span className="text-muted-foreground">Slot {i + 1}</span>
                    <span className="font-bold text-foreground">{slot.start} - {slot.end}</span>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground italic text-center py-4">Invalid time configuration.</p>
                )}
                {config.maxStudents > 15 && (
                  <div className="text-center text-xs text-muted-foreground py-2">
                    + {config.maxStudents - 15} more slots...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Queue Table */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search by Name, Matric, or Appt No..." 
                className="pl-10 h-10 bg-white border-border"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={!currentSchedule?.isActive}
              />
            </div>
            <div className="flex items-center gap-2">
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
                onClick={handleBulkMissed}
                disabled={!currentSchedule?.isActive || activeQueue.filter(s => !rowStatus[s.userId]).length === 0}
                className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/5 text-xs"
              >
                <XCircle className="w-4 h-4" /> Mark All Missed
              </Button>
            </div>
          </div>

          {/* Last updated bar */}
          <div className="flex justify-end">
            <span className="text-xs text-muted-foreground">
              Last updated: {lastUpdatedSecs < 60 ? `${lastUpdatedSecs}s ago` : `${Math.floor(lastUpdatedSecs / 60)}m ago`}
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead className="bg-muted/50 border-b border-border">
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
                        <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>No active schedule for today.</p>
                        <p className="text-xs mt-1">Configure and publish the schedule to start calling students.</p>
                      </td>
                    </tr>
                  ) : filteredQueue.length > 0 ? (
                    filteredQueue.map((student, idx) => {
                      const start = new Date(`2000-01-01T${currentSchedule.startTime}`)
                      const myTime = new Date(start.getTime() + idx * currentSchedule.durationPerStudent * 60000)
                      const timeStr = myTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      
                      // Check if it's the current active slot for highlighting
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
                          transition={{ duration: 0.4 }}
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
                              <Clock className="w-3 h-3" /> {timeStr}
                            </div>
                          </td>
                          <td className="p-4">
                            {rowSt === 'attended' ? (
                              <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3" /> Attended
                              </span>
                            ) : rowSt === 'missed' ? (
                              <span className="px-2.5 py-1 bg-destructive/10 text-destructive rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
                                <XCircle className="w-3 h-3" /> Missed
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-secondary/10 text-secondary rounded-full text-[10px] font-bold uppercase tracking-wider">Pending</span>
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
                                    <CheckCircle2 className="w-3.5 h-3.5" /><span>Attended</span>
                                  </Button>
                                  <Button
                                    size="sm" variant="outline"
                                    className="border-destructive/50 text-destructive hover:bg-destructive/10 gap-1.5 h-8 px-3"
                                    onClick={() => handleAbsent(student)}
                                  >
                                    <XCircle className="w-3.5 h-3.5" /><span>Missed</span>
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
                        <p>No students found in the active queue.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Inline Confirmation Popover (non-Phase 3) */}
      <AnimatePresence>
        {confirmTarget && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/60 backdrop-blur-sm"
              onClick={() => setConfirmTarget(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className={`relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-xl border p-6 ${
                confirmTarget.action === 'attended' ? 'border-primary/30' : 'border-destructive/30'
              }`}
            >
              <p className="font-bold text-foreground text-lg mb-1">
                {confirmTarget.action === 'attended' ? '✅ Mark as Attended?' : '❌ Mark as Missed?'}
              </p>
              <p className="text-sm text-muted-foreground mb-1">
                <span className="font-bold text-foreground">{confirmTarget.student.name}</span>
              </p>
              <p className="text-xs text-muted-foreground mb-6">
                {confirmTarget.action === 'attended'
                  ? `This will unlock Phase ${phase + 1} booking for this student.`
                  : 'The student will need to rebook their appointment.'}
              </p>
              <div className="flex gap-3 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setConfirmTarget(null)}>Cancel</Button>
                <Button
                  size="sm"
                  className={confirmTarget.action === 'attended'
                    ? 'bg-primary hover:bg-primary/90 text-white'
                    : 'bg-destructive hover:bg-destructive/90 text-white'}
                  onClick={() => commitAction(confirmTarget.student, confirmTarget.action)}
                >
                  {confirmTarget.action === 'attended' ? 'Yes, Attended' : 'Yes, Missed'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Missed — Step 1 */}
      <AnimatePresence>
        {showBulkMissedStep1 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/70 backdrop-blur-sm"
              onClick={() => setShowBulkMissedStep1(false)}
            />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }} transition={{ type: 'spring', duration: 0.3 }}
              className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl border border-destructive/20 p-6"
            >
              <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-4" />
              <h3 className="text-xl font-bold font-display text-center mb-2">Mark All Pending as Missed?</h3>
              <p className="text-sm text-muted-foreground text-center mb-6">
                This will mark <strong>{activeQueue.filter(s => !rowStatus[s.userId]).length} students</strong> as missed. They will all need to rebook.
              </p>
              <div className="flex gap-3 justify-end">
                <Button variant="ghost" onClick={() => setShowBulkMissedStep1(false)}>Cancel</Button>
                <Button className="bg-destructive hover:bg-destructive/90 text-white" onClick={() => { setShowBulkMissedStep1(false); setShowBulkMissedStep2(true) }}>
                  Continue →
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Missed — Step 2 (final confirm) */}
      <AnimatePresence>
        {showBulkMissedStep2 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setShowBulkMissedStep2(false)}
            />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }} transition={{ type: 'spring', duration: 0.3 }}
              className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl border border-destructive p-6"
            >
              <div className="bg-destructive/10 rounded-xl p-4 mb-6 text-center">
                <p className="font-bold text-destructive">⚠️ Final Confirmation Required</p>
                <p className="text-sm text-destructive/80 mt-1">Type <span className="font-mono font-bold">CONFIRM</span> to proceed</p>
              </div>
              <BulkConfirmInput onConfirm={confirmBulkMissed} onCancel={() => setShowBulkMissedStep2(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Phase 3 Nurse Clearance Log */}

      {phase === 3 && clearedLog.length > 0 && (
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6 mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold font-display text-foreground text-xl">Today's Clearance Log</h2>
            <Button variant="outline" size="sm">Export CSV</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border/50">
                {clearedLog.map(log => (
                  <tr key={log.id} className="hover:bg-muted/30">
                    <td className="p-3 font-mono font-bold text-primary">{log.id}</td>
                    <td className="p-3 font-mono text-muted-foreground">{log.matric}</td>
                    <td className="p-3 font-bold">{log.name}</td>
                    <td className="p-3 text-right text-muted-foreground">Cleared at {log.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setShowConfirmModal(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl border border-border p-6"
            >
              <h3 className="text-xl font-bold font-display mb-2">Publish Schedule?</h3>
              <p className="text-muted-foreground mb-6 text-sm">
                This will activate the queue and assign the first {config.maxStudents} pending students to today's schedule. This action will notify students.
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setShowConfirmModal(false)}>Cancel</Button>
                <Button className="bg-primary hover:bg-primary/90 text-white" onClick={handleSaveSchedule}>Confirm Publish</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Nurse Final Clearance Modal */}
      <AnimatePresence>
        {nurseConfirmStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => {
                if (!clearanceIdTyping) setNurseConfirmStudent(null)
              }}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-xl border border-border p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
                  <span className="text-xl">⚕️</span>
                </div>
                <h3 className="text-2xl font-bold font-display text-foreground">Confirm Final Clearance</h3>
              </div>
              
              <div className="bg-muted/50 rounded-xl p-6 border border-border/50 mb-6 space-y-4">
                <p className="text-foreground">You are about to mark the following student as FULLY CLEARED:</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase font-bold tracking-wider mb-1">Name</span>
                    <span className="font-bold text-foreground">{nurseConfirmStudent.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase font-bold tracking-wider mb-1">Matric No.</span>
                    <span className="font-mono font-bold text-foreground">{nurseConfirmStudent.matricNumber}</span>
                  </div>
                </div>
                
                {clearanceIdTyping !== null && (
                  <div className="pt-4 border-t border-border/50 mt-4">
                    <span className="text-muted-foreground block text-xs uppercase font-bold tracking-wider mb-1 text-primary">Generating Clearance ID...</span>
                    <span className="font-mono font-bold text-xl text-primary">{clearanceIdTyping}</span>
                    <span className="animate-pulse">|</span>
                  </div>
                )}
              </div>
              
              <p className="text-sm text-destructive font-medium mb-6">
                This will complete their medical registration. This cannot be undone.
              </p>
              
              <div className="flex justify-end gap-3">
                <Button 
                  variant="ghost" 
                  onClick={() => setNurseConfirmStudent(null)}
                  disabled={clearanceIdTyping !== null}
                >
                  Cancel
                </Button>
                <Button 
                  className="bg-violet-600 hover:bg-violet-700 text-white gap-2 shadow-lg" 
                  onClick={confirmNurseClearance}
                  disabled={clearanceIdTyping !== null}
                >
                  ✅ Confirm Clearance
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
