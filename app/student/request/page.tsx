'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Calendar, Lock, CheckCircle2, ArrowRight, Loader2, Printer, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth-store'
import { useRegistrationStore } from '@/store/registration-store'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'

const wizardVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.4 }
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 50 : -50,
    opacity: 0,
    transition: { duration: 0.3 }
  })
}

export default function RequestAppointmentPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { students, schedules } = useRegistrationStore()
  
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [assignedSlot, setAssignedSlot] = useState<any>(null)
  
  const studentData = students.find(s => s.userId === user?.id)
  
  if (!studentData) return null
  
  const currentPhase = studentData.currentPhase
  const currentSchedule = schedules[currentPhase]

  const handleNextStep = () => {
    setDirection(1)
    setStep(prev => prev + 1)
  }

  const handleRequestSlot = () => {
    setIsProcessing(true)
    
    // Simulate finding a slot based on queue position
    setTimeout(() => {
      setIsProcessing(false)
      
      if (!currentSchedule || !currentSchedule.isActive) {
        toast.error('No active schedules found for this phase. Please try again later.')
        return
      }

      // Mock assigning a slot
      setAssignedSlot({
        number: studentData.phaseNumbers[currentPhase as 1|2|3],
        date: currentSchedule.date,
        time: currentSchedule.startTime, // In reality, this would calculate exact slot
        phase: currentPhase,
        staff: currentPhase === 1 ? 'Registrar Team' : currentPhase === 2 ? 'Lab Attendants' : 'Nursing Staff'
      })
      
      handleNextStep()
      toast.success('Appointment successfully scheduled!')
    }, 2000)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Wizard Header */}
      <div className="mb-12">
        <h1 className="text-3xl font-bold font-display mb-2 text-foreground">Request Appointment</h1>
        <p className="text-muted-foreground">Follow the steps below to secure your time slot.</p>
        
        {/* Stepper */}
        <div className="flex items-center justify-between mt-8 relative">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-muted -translate-y-1/2 z-0" />
          <motion.div 
            className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 z-0"
            initial={{ width: '0%' }}
            animate={{ width: `${(step - 1) * 50}%` }}
            transition={{ duration: 0.5 }}
          />
          
          {[1, 2, 3].map((s) => (
            <div key={s} className="relative z-10 flex flex-col items-center bg-background px-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                step >= s ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
              }`}>
                {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              <span className={`absolute top-10 text-xs font-bold uppercase tracking-wider whitespace-nowrap ${
                step >= s ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {s === 1 ? 'Eligibility' : s === 2 ? 'Request' : 'Confirmation'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-20">
        <AnimatePresence custom={direction} mode="wait">
          {/* STEP 1: Eligibility */}
          {step === 1 && (
            <motion.div
              key="step1"
              custom={direction}
              variants={wizardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="bg-white rounded-2xl shadow-sm border border-border p-8 text-center"
            >
              {currentPhase === 4 ? (
                <div className="space-y-6">
                  <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                    <Lock className="w-10 h-10" />
                  </div>
                  <h2 className="text-2xl font-bold font-display">Registration Completed</h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    You have already completed all phases of registration. You do not need any further appointments.
                  </p>
                  <Button onClick={() => router.push('/student/dashboard')} variant="outline">
                    Return to Dashboard
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="w-20 h-20 bg-[#A8E6CF]/30 rounded-full flex items-center justify-center mx-auto text-[#0B5E3C]">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h2 className="text-2xl font-bold font-display text-foreground">You are eligible!</h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    You have successfully completed the previous phases. You are now eligible to request an appointment for <strong>Phase {currentPhase}</strong>.
                  </p>
                  <div className="pt-4">
                    <Button onClick={handleNextStep} size="lg" className="bg-primary hover:bg-primary/90 text-white gap-2 shadow-[0_4px_14px_0_rgba(11,94,60,0.39)]">
                      Proceed to Request <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 2: Request Slot */}
          {step === 2 && (
            <motion.div
              key="step2"
              custom={direction}
              variants={wizardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="bg-white rounded-2xl shadow-sm border border-border p-8 text-center"
            >
              <div className="space-y-8 py-8">
                {isProcessing ? (
                  <div className="flex flex-col items-center space-y-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      className="text-primary"
                    >
                      <Calendar className="w-16 h-16" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-foreground">Finding your slot...</h3>
                    <p className="text-muted-foreground">Checking availability for Phase {currentPhase}.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto text-secondary">
                      <Calendar className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold font-display text-foreground">Ready to request?</h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Click the button below to secure the next available time slot for your Phase {currentPhase} appointment.
                    </p>
                    <div className="pt-4">
                      <Button onClick={handleRequestSlot} size="lg" className="bg-secondary hover:bg-secondary/90 text-white gap-2 shadow-[0_4px_14px_0_rgba(232,150,12,0.39)]">
                        Click to Request Your Appointment
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 3: Confirmation */}
          {step === 3 && assignedSlot && (
            <motion.div
              key="step3"
              custom={direction}
              variants={wizardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden"
            >
              <div className="bg-primary p-8 text-center text-white">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                  className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold font-display">Appointment Confirmed</h2>
                <p className="text-white/80 mt-2">Your slot has been successfully reserved.</p>
              </div>
              
              <div className="p-8 print:p-0">
                <div className="border border-dashed border-border rounded-xl p-6 bg-muted/30 mb-8 max-w-md mx-auto">
                  <div className="text-center mb-6">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Appointment Number</p>
                    <h3 className="text-4xl font-bold font-mono tracking-tight text-foreground">{assignedSlot.number}</h3>
                  </div>
                  
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">Date</span>
                      <span className="font-bold text-foreground">{format(new Date(assignedSlot.date), 'MMMM do, yyyy')}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">Time</span>
                      <span className="font-bold text-foreground">{assignedSlot.time}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/50 pb-2">
                      <span className="text-muted-foreground">Phase</span>
                      <span className="font-bold text-foreground">Phase {assignedSlot.phase}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Staff/Dept</span>
                      <span className="font-bold text-foreground">{assignedSlot.staff}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center print:hidden">
                  <Button onClick={handlePrint} variant="outline" className="gap-2 border-primary/20 text-primary hover:bg-primary/5">
                    <Printer className="w-4 h-4" /> Save as PDF
                  </Button>
                  <Button onClick={() => router.push('/student/dashboard')} className="bg-primary hover:bg-primary/90 text-white shadow-sm gap-2">
                    Return to Dashboard <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
