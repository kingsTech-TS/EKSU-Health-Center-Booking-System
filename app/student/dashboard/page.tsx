'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, Copy, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { useRegistrationStore } from '@/store/registration-store'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format, differenceInSeconds } from 'date-fns'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import confetti from 'canvas-confetti'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function StudentDashboardPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { students, schedules } = useRegistrationStore()
  const [mounted, setMounted] = useState(false)
  const [timeUntil, setTimeUntil] = useState<{ d: number, h: number, m: number, s: number } | null>(null)
  const [isMissed, setIsMissed] = useState(false)
  const [copyTooltip, setCopyTooltip] = useState(false)

  const studentData = students.find(s => s.userId === user?.id)

  const fetchStudentDashboard = useRegistrationStore((state) => state.fetchStudentDashboard)

  useEffect(() => {
    setMounted(true)
    fetchStudentDashboard()
  }, [])

  useEffect(() => {
    if (mounted && studentData && !studentData.onboardingCompleted) {
      router.push('/onboarding')
    }
  }, [mounted, studentData, router])

  // Countdown Timer Logic
  useEffect(() => {
    if (!mounted || !studentData) return
    const currentPhase = studentData.currentPhase
    const currentSchedule = schedules[currentPhase]
    
    if (currentPhase < 4 && currentSchedule && currentSchedule.isActive) {
      const phaseStudents = students.filter(s => s.currentPhase === currentPhase && s.phaseNumbers[currentPhase as 1|2|3])
      phaseStudents.sort((a, b) => {
        const numA = parseInt(a.phaseNumbers[currentPhase as 1|2|3]!.split('-')[1])
        const numB = parseInt(b.phaseNumbers[currentPhase as 1|2|3]!.split('-')[1])
        return numA - numB
      })
      const queuePosition = phaseStudents.findIndex(s => s.userId === user?.id) + 1

      if (queuePosition > 0 && queuePosition <= currentSchedule.maxStudents) {
        const startStr = `${currentSchedule.date}T${currentSchedule.startTime}`
        const start = new Date(startStr)
        const myTime = new Date(start.getTime() + (queuePosition - 1) * currentSchedule.durationPerStudent * 60000)

        const interval = setInterval(() => {
          const now = new Date()
          const endTime = new Date(myTime.getTime() + currentSchedule.durationPerStudent * 60000)
          
          if (now > endTime) {
            setIsMissed(true)
            setTimeUntil(null)
            clearInterval(interval)
            return
          }

          const diff = differenceInSeconds(myTime, now)
          if (diff <= 0) {
            setTimeUntil({ d: 0, h: 0, m: 0, s: 0 })
          } else {
            setTimeUntil({
              d: Math.floor(diff / (3600 * 24)),
              h: Math.floor((diff % (3600 * 24)) / 3600),
              m: Math.floor((diff % 3600) / 60),
              s: diff % 60
            })
          }
        }, 1000)
        return () => clearInterval(interval)
      }
    }
    setTimeUntil(null)
    setIsMissed(false)
  }, [mounted, studentData, schedules, students, user?.id])

  // Confetti on Phase 4
  useEffect(() => {
    if (studentData?.currentPhase === 4) {
      const hasSeen = localStorage.getItem('hasSeenClearanceConfetti')
      if (!hasSeen) {
        confetti({
          particleCount: 200,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#0B5E3C', '#E8960C', '#A8E6CF', '#FFFFFF']
        })
        localStorage.setItem('hasSeenClearanceConfetti', 'true')
      }
    }
  }, [studentData?.currentPhase])

  if (!mounted || !studentData || !studentData.onboardingCompleted) {
    return <div className="p-12 text-center text-muted-foreground animate-pulse">Loading dashboard...</div>
  }

  const currentPhase = studentData.currentPhase
  const currentApptNumber = studentData.phaseNumbers[currentPhase as 1|2|3]
  
  // Schedule Calculation
  const currentSchedule = schedules[currentPhase]
  let isScheduledToday = false
  let estimatedTimeDate: Date | null = null
  
  if (currentPhase < 4 && currentSchedule && currentSchedule.isActive) {
    const phaseStudents = students.filter(s => s.currentPhase === currentPhase && s.phaseNumbers[currentPhase as 1|2|3])
    phaseStudents.sort((a, b) => {
      const numA = parseInt(a.phaseNumbers[currentPhase as 1|2|3]!.split('-')[1])
      const numB = parseInt(b.phaseNumbers[currentPhase as 1|2|3]!.split('-')[1])
      return numA - numB
    })
    const queuePosition = phaseStudents.findIndex(s => s.userId === user?.id) + 1
    if (queuePosition > 0 && queuePosition <= currentSchedule.maxStudents) {
      isScheduledToday = true
      const start = new Date(`${currentSchedule.date}T${currentSchedule.startTime}`)
      estimatedTimeDate = new Date(start.getTime() + (queuePosition - 1) * currentSchedule.durationPerStudent * 60000)
    }
  }

  const copyToClipboard = () => {
    if (currentApptNumber) {
      navigator.clipboard.writeText(currentApptNumber)
      setCopyTooltip(true)
      setTimeout(() => setCopyTooltip(false), 2000)
    }
  }

  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <motion.div className="space-y-8" initial="hidden" animate="visible" variants={containerVariants}>
      {/* Greeting Banner */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display">{greeting}, {user?.name.split(' ')[0]} 👋</h1>
          <p className="text-muted-foreground">{format(new Date(), 'EEEE, MMMM do, yyyy')}</p>
        </div>
      </motion.div>

      {/* Progress Pipeline */}
      <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-sm border border-border p-6">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-6">Clearance Progress</h3>
        <div className="relative flex justify-between items-center max-w-3xl mx-auto">
          {/* Connecting Line Background */}
          <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -translate-y-1/2 z-0" />
          {/* Animated Connecting Line Fill */}
          <motion.div 
            className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 z-0" 
            initial={{ width: 0 }}
            animate={{ width: `${(currentPhase - 1) * 50}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />

          {[
            { step: 1, label: 'Phase 1: Registration' },
            { step: 2, label: 'Phase 2: Lab Test' },
            { step: 3, label: 'Phase 3: Clearance' },
          ].map((phase) => {
            const isCompleted = currentPhase > phase.step
            const isActive = currentPhase === phase.step
            const isPending = currentPhase < phase.step

            return (
              <div key={phase.step} className="relative z-10 flex flex-col items-center group">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-500 ${
                  isCompleted ? 'bg-primary text-white scale-100 shadow-[0_0_15px_rgba(11,94,60,0.4)]' : 
                  isActive ? (isMissed ? 'bg-destructive text-white scale-110 shadow-[0_0_15px_rgba(192,57,43,0.4)]' : 'bg-secondary text-white scale-110 shadow-[0_0_15px_rgba(232,150,12,0.4)] ring-4 ring-secondary/20 animate-pulse') : 
                  'bg-muted text-muted-foreground scale-90'
                }`}>
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : isActive ? (isMissed ? '❌' : '🔄') : '🔒'}
                </div>
                <p className={`mt-3 text-sm font-medium hidden md:block ${isActive ? (isMissed ? 'text-destructive font-bold' : 'text-foreground font-bold') : 'text-muted-foreground'}`}>
                  {phase.label}
                </p>
                <span className={`text-[10px] uppercase font-bold tracking-wider mt-1 px-2 py-0.5 rounded-full ${
                  isCompleted ? 'bg-primary/10 text-primary' : 
                  isActive ? (isMissed ? 'bg-destructive/10 text-destructive' : 'bg-secondary/10 text-secondary') : 
                  'bg-muted text-muted-foreground'
                }`}>
                  {isCompleted ? 'Completed' : isActive ? (isMissed ? 'Missed' : 'In Progress') : 'Locked'}
                </span>
                
                {isPending && (
                  <div className="absolute -bottom-10 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none">
                    Complete Phase {currentPhase} first
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Main Appointment Card */}
      <motion.div variants={itemVariants}>
        {currentPhase === 4 ? (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 text-center space-y-4 shadow-sm relative overflow-hidden">
             <div className="absolute -top-10 -right-10 opacity-10">
               <CheckCircle2 className="w-48 h-48 text-primary" />
             </div>
             <div className="relative z-10">
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto text-primary mb-4">
                <span className="text-4xl">🎉</span>
              </div>
              <h2 className="text-3xl font-bold font-display text-primary uppercase">Registration Complete!</h2>
              <p className="text-muted-foreground max-w-md mx-auto">You have been fully cleared by the EKSU Health Center.</p>
              
              <div className="mt-6 bg-white border border-primary/20 rounded-xl p-4 inline-block">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Clearance ID</p>
                <p className="text-xl font-mono font-bold text-foreground">{studentData.phaseNumbers[3] || 'CLR-2025-00392'}</p>
              </div>

              <div className="pt-6">
                <Button className="bg-primary hover:bg-primary/90 text-white shadow-[0_4px_14px_0_rgba(11,94,60,0.39)]">
                  📄 Download Clearance Letter
                </Button>
              </div>
             </div>
          </div>
        ) : isMissed ? (
          <div className="bg-destructive/5 rounded-2xl border border-destructive/20 p-8 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto text-destructive">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold font-display text-destructive uppercase">Appointment Missed</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Your Phase {currentPhase} appointment has expired. You must request a new appointment to continue your registration.
            </p>
            <div className="pt-4">
              <Link href={`/student/request?rebook=true`}>
                <Button className="bg-secondary hover:bg-secondary/90 text-white gap-2 shadow-[0_4px_14px_0_rgba(232,150,12,0.39)]">
                  🔄 Request New Appointment
                </Button>
              </Link>
            </div>
          </div>
        ) : !isScheduledToday ? (
          <div className="bg-white rounded-2xl border border-border p-8 text-center space-y-4 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5">
               <Calendar className="w-48 h-48" />
             </div>
             <div className="relative z-10">
              <h2 className="text-2xl font-bold font-display mb-2">Phase {currentPhase} — {currentPhase === 1 ? 'Registrar Check-in' : currentPhase === 2 ? 'Laboratory Testing' : 'Nurse Final Clearance'}</h2>
              <p className="text-muted-foreground mb-8">Your appointment number hasn't been scheduled for today. You can request a specific slot or wait for your queue number.</p>
              
              <Link href="/student/request">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white gap-2 shadow-[0_4px_14px_0_rgba(11,94,60,0.39)]">
                  Request Appointment Slot <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
             </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="bg-secondary/10 border-b border-secondary/20 p-4 flex items-center justify-between">
              <span className="font-bold text-secondary uppercase tracking-wider text-sm flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
                </span>
                Scheduled for Today
              </span>
              <span className="px-3 py-1 bg-[#A8E6CF]/20 text-[#0B5E3C] rounded-full text-xs font-bold uppercase tracking-wider">
                Phase {currentPhase}
              </span>
            </div>
            
            <div className="p-8 md:p-12 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-4">
                <p className="text-muted-foreground font-medium uppercase tracking-widest text-sm">Your Appointment Number</p>
                <div className="flex items-center gap-4 justify-center md:justify-start">
                  <h2 className="text-5xl md:text-6xl font-bold font-mono tracking-tight text-foreground">{currentApptNumber}</h2>
                  <div className="relative">
                    <button onClick={copyToClipboard} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors group" title="Copy Number">
                      <Copy className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    </button>
                    {copyTooltip && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                        Copied!
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-muted-foreground justify-center md:justify-start mt-4">
                   <Clock className="w-5 h-5 text-primary" />
                   <span className="text-lg">
                     {estimatedTimeDate ? format(estimatedTimeDate, "EEEE, MMMM do · h:mm a") : 'Calculating time...'}
                   </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Location: EKSU Main Health Center, Wing {currentPhase === 1 ? 'A' : currentPhase === 2 ? 'B' : 'C'}</p>
              </div>

              {timeUntil && (
                <div className="bg-background rounded-xl p-6 border border-border min-w-[250px] text-center shadow-inner">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Time Until Appointment</p>
                  <div className="flex justify-center gap-3 font-mono text-2xl font-bold text-primary">
                    <div className="flex flex-col items-center"><span className="bg-primary/10 px-3 py-2 rounded-lg">{timeUntil.h.toString().padStart(2, '0')}</span><span className="text-[10px] mt-1 text-muted-foreground font-sans">HRS</span></div>
                    <span className="py-2">:</span>
                    <div className="flex flex-col items-center"><span className="bg-primary/10 px-3 py-2 rounded-lg">{timeUntil.m.toString().padStart(2, '0')}</span><span className="text-[10px] mt-1 text-muted-foreground font-sans">MIN</span></div>
                    <span className="py-2">:</span>
                    <div className="flex flex-col items-center"><span className="bg-primary/10 px-3 py-2 rounded-lg">{timeUntil.s.toString().padStart(2, '0')}</span><span className="text-[10px] mt-1 text-muted-foreground font-sans">SEC</span></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Bottom Stats Row */}
      <motion.div variants={itemVariants} className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Phases Completed</p>
            <p className="text-2xl font-bold text-foreground">{currentPhase - 1} / 3</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Next Appointment</p>
            <p className="text-lg font-bold text-foreground">
              {estimatedTimeDate ? format(estimatedTimeDate, "MMM do, h:mm a") : 'Not Scheduled'}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-border shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-primary">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Status</p>
            <p className="text-lg font-bold text-foreground">
              {currentPhase === 4 ? 'Fully Cleared' : isScheduledToday ? 'Action Required Today' : 'Awaiting Schedule'}
            </p>
          </div>
        </div>
      </motion.div>

    </motion.div>
  )
}
