'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarDays, Clock, Save, ShieldAlert, AlertTriangle, Users, Settings, Plus, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/auth-store'
import { useRegistrationStore } from '@/store/registration-store'
import { toast } from 'react-hot-toast'

const slotGenerator = (start: string, duration: number, count: number) => {
  const slots = []
  const startTime = new Date(`2000-01-01T${start || '08:00'}`)
  for (let i = 0; i < count; i++) {
    const slotStart = new Date(startTime.getTime() + i * duration * 60000)
    const slotEnd = new Date(slotStart.getTime() + duration * 60000)
    slots.push({
      start: slotStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      end: slotEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    })
  }
  return slots
}

export default function StaffSchedulePage() {
  const { user } = useAuthStore()
  const { schedules, setSchedule } = useRegistrationStore()

  // Determine current phase based on staff role
  const phase = useMemo(() => {
    if (!user) return 1
    if (user.role === 'registrar') return 1
    if (user.role === 'lab') return 2
    if (user.role === 'nurse') return 3
    return 1
  }, [user])

  const schedule = schedules[phase]

  // Config parameters
  const [config, setConfig] = useState({
    startTime: schedule?.startTime || '08:00',
    durationPerStudent: schedule?.durationPerStudent || 15,
    maxStudents: schedule?.maxStudents || 40,
  })

  const [showConfirm, setShowConfirm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const previewSlots = useMemo(() => {
    return slotGenerator(config.startTime, config.durationPerStudent, Math.min(config.maxStudents, 15))
  }, [config.startTime, config.durationPerStudent, config.maxStudents])

  const handlePublish = () => {
    setIsSaving(true)
    setTimeout(() => {
      setSchedule(phase as 1 | 2 | 3, {
        date: new Date().toISOString().split('T')[0],
        startTime: config.startTime,
        endTime: '17:00',
        durationPerStudent: config.durationPerStudent,
        maxStudents: config.maxStudents,
      })
      setIsSaving(false)
      setShowConfirm(false)
      toast.success('Clinic schedule updated and published successfully!')
    }, 800)
  }

  if (!user) return null

  return (
    <div className="space-y-8 animate-fadeInUp">
      <div>
        <h1 className="text-3xl font-bold font-display text-foreground flex items-center gap-3">
          <CalendarDays className="w-8 h-8 text-primary" /> Schedule Manager
        </h1>
        <p className="text-muted-foreground mt-1">Configure slot capacities, durations, and publish hours for Phase {phase}.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Form: Parameter Controls */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/20">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" /> Parameter Controls
              </h3>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-xs font-bold text-muted-foreground uppercase">Clinic Start Time</Label>
                <Input 
                  id="startTime" type="time"
                  value={config.startTime} onChange={(e) => setConfig({ ...config, startTime: e.target.value })}
                  className="bg-muted/30 border-border max-w-xs"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-xs font-bold text-muted-foreground uppercase">Mins Per Slot</Label>
                  <Input 
                    id="duration" type="number"
                    value={config.durationPerStudent} onChange={(e) => setConfig({ ...config, durationPerStudent: parseInt(e.target.value) || 0 })}
                    className="bg-muted/30 border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxSlots" className="text-xs font-bold text-muted-foreground uppercase">Max Slots Cap</Label>
                  <Input 
                    id="maxSlots" type="number"
                    value={config.maxStudents} onChange={(e) => setConfig({ ...config, maxStudents: parseInt(e.target.value) || 0 })}
                    className="bg-muted/30 border-border"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border flex justify-end">
                <Button 
                  className="bg-primary hover:bg-primary/90 text-white font-bold px-6 shadow-md shadow-primary/20"
                  onClick={() => setShowConfirm(true)}
                >
                  <Save className="w-4 h-4 mr-2" /> Publish Session Hours
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Preview Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/20">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" /> Generated Previews
              </h3>
            </div>
            
            <div className="p-6 space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar">
              {previewSlots.length > 0 ? (
                previewSlots.map((slot, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-muted/30 px-3 py-2 rounded border border-border/40 font-mono text-xs">
                    <span className="text-muted-foreground font-bold">Slot {idx + 1}</span>
                    <span className="text-foreground font-bold">{slot.start} - {slot.end}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-4">Configure values to see preview slots.</p>
              )}
              {config.maxStudents > 15 && (
                <div className="text-center text-[10px] text-muted-foreground pt-1">
                  + {config.maxStudents - 15} more slots are generated...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/60 backdrop-blur-sm"
              onClick={() => setShowConfirm(false)}
            />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 w-full max-w-sm bg-white rounded-2xl border border-border shadow-xl p-6"
            >
              <h3 className="font-bold text-foreground text-lg mb-2">Publish Clinic Hours?</h3>
              <p className="text-sm text-muted-foreground mb-6">
                This immediately overwrites today's slot configurations for Phase {phase} clinical queues.
              </p>
              <div className="flex gap-3 justify-end">
                <Button variant="ghost" onClick={() => setShowConfirm(false)}>Cancel</Button>
                <Button 
                  disabled={isSaving}
                  className="bg-primary hover:bg-primary/90 text-white font-bold"
                  onClick={handlePublish}
                >
                  {isSaving ? 'Publishing...' : 'Yes, Publish'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
