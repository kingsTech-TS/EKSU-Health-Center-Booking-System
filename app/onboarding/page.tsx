'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ClipboardList, Microscope, UserCheck, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { useRegistrationStore } from '@/store/registration-store'

const steps = [
  {
    id: 1,
    title: 'Phase 1: Registrar',
    description: 'Check in with the registrar to confirm your details. You will be assigned a unique appointment number.',
    icon: ClipboardList,
    color: 'text-primary',
    bg: 'bg-primary/10'
  },
  {
    id: 2,
    title: 'Phase 2: Laboratory',
    description: 'After Phase 1, you will proceed to the laboratory for your medical tests. Wait for your scheduled date.',
    icon: Microscope,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10'
  },
  {
    id: 3,
    title: 'Phase 3: Nurse Clearance',
    description: 'The final step. The nurse will review your test results and grant your medical clearance.',
    icon: UserCheck,
    color: 'text-accent',
    bg: 'bg-accent/10'
  }
]

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const router = useRouter()
  const { user } = useAuthStore()
  const { completeOnboarding } = useRegistrationStore()

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      if (user) {
        completeOnboarding(user.id)
      }
      router.push('/dashboard/student')
    }
  }

  const step = steps[currentStep]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Welcome to EKSU Health</h1>
          <p className="text-muted-foreground text-lg">Let's walk you through the medical registration process.</p>
        </motion.div>

        <div className="relative h-80 rounded-3xl glass-dark border border-primary/20 p-8 flex flex-col items-center justify-center text-center overflow-hidden">
          {/* Progress Indicators */}
          <div className="absolute top-6 left-0 w-full flex justify-center gap-3">
            {steps.map((_, idx) => (
              <div 
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  idx === currentStep ? 'w-8 bg-primary' : idx < currentStep ? 'w-4 bg-primary/40' : 'w-4 bg-muted'
                }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center w-full"
            >
              <div className={`w-24 h-24 rounded-2xl ${step.bg} flex items-center justify-center mb-6`}>
                <step.icon className={`w-12 h-12 ${step.color}`} />
              </div>
              <h2 className="text-2xl font-bold mb-3">{step.title}</h2>
              <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <motion.div 
          className="mt-8 flex justify-between items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button 
            variant="ghost" 
            onClick={() => {
               if (user) completeOnboarding(user.id)
               router.push('/dashboard/student')
            }}
            className="text-muted-foreground"
          >
            Skip Tutorial
          </Button>
          
          <Button onClick={handleNext} className="gap-2 shadow-lg shadow-primary/20">
            {currentStep === steps.length - 1 ? (
              <>Get Started <CheckCircle2 className="w-4 h-4" /></>
            ) : (
              <>Next Step <ArrowRight className="w-4 h-4" /></>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
