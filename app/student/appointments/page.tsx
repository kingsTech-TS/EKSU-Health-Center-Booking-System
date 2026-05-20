'use client'

import { useState } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { Calendar, Clock, CheckCircle2, XCircle, AlertCircle, FileText } from 'lucide-react'

// Mock Data
const mockAppointments = [
  {
    id: 'APT-1001',
    phase: 1,
    phaseLabel: 'Registrar Check-in',
    date: 'May 10, 2026',
    time: '09:30 AM',
    status: 'COMPLETED',
    staff: 'Mrs. Adebayo (Registrar)'
  },
  {
    id: 'APT-1042',
    phase: 2,
    phaseLabel: 'Laboratory Testing',
    date: 'May 15, 2026',
    time: '11:00 AM',
    status: 'MISSED',
    staff: 'Mr. Johnson (Lab Tech)'
  },
  {
    id: 'APT-1089',
    phase: 2,
    phaseLabel: 'Laboratory Testing',
    date: 'May 20, 2026',
    time: '10:15 AM',
    status: 'SCHEDULED',
    staff: 'Mr. Johnson (Lab Tech)'
  }
]

type FilterType = 'All' | 'Completed' | 'Upcoming' | 'Missed'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, type: 'spring' } },
}

export default function AppointmentsPage() {
  const [filter, setFilter] = useState<FilterType>('All')

  const filteredAppointments = mockAppointments.filter(apt => {
    if (filter === 'All') return true
    if (filter === 'Completed') return apt.status === 'COMPLETED'
    if (filter === 'Upcoming') return apt.status === 'SCHEDULED'
    if (filter === 'Missed') return apt.status === 'MISSED'
    return true
  })

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display">My Appointments</h1>
          <p className="text-muted-foreground">Timeline history of your registration appointments.</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b border-border pb-px overflow-x-auto custom-scrollbar">
        {(['All', 'Upcoming', 'Completed', 'Missed'] as FilterType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 text-sm font-bold capitalize transition-colors relative whitespace-nowrap ${
              filter === tab ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
            {filter === tab && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"
              />
            )}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative pl-6 md:pl-8">
        {/* Vertical Line */}
        <div className="absolute top-4 bottom-4 left-3 md:left-4 w-px bg-border z-0" />

        {filteredAppointments.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white p-12 rounded-2xl border border-border text-center relative z-10"
          >
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
              <Calendar className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold font-display mb-2">No appointments yet</h3>
            <p className="text-muted-foreground">There are no appointments matching your filter.</p>
          </motion.div>
        ) : (
          <motion.div 
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence mode="popLayout">
              {filteredAppointments.map((apt) => {
                const isCompleted = apt.status === 'COMPLETED'
                const isMissed = apt.status === 'MISSED'
                const isScheduled = apt.status === 'SCHEDULED'

                return (
                  <motion.div 
                    key={apt.id} 
                    variants={itemVariants}
                    layout
                    className="relative z-10 pl-6 md:pl-10 group"
                  >
                    {/* Timeline Node */}
                    <div className={`absolute left-[-16px] md:left-[-12px] top-6 w-8 h-8 rounded-full border-4 border-background flex items-center justify-center ${
                      isCompleted ? 'bg-primary text-white' :
                      isMissed ? 'bg-destructive text-white' :
                      'bg-secondary text-white'
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : 
                       isMissed ? <XCircle className="w-4 h-4" /> : 
                       <Clock className="w-4 h-4" />}
                    </div>

                    {/* Card */}
                    <div className="bg-white rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Phase {apt.phase}</span>
                            <span className="text-muted-foreground/50">•</span>
                            <span className="font-mono text-xs text-muted-foreground">{apt.id}</span>
                          </div>
                          <h3 className="text-lg font-bold text-foreground">{apt.phaseLabel}</h3>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider w-fit ${
                          isCompleted ? 'bg-[#A8E6CF]/30 text-primary' :
                          isMissed ? 'bg-destructive/10 text-destructive' :
                          'bg-secondary/10 text-secondary'
                        }`}>
                          {apt.status}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4 text-foreground/50" />
                          <span className="font-medium text-foreground">{apt.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4 text-foreground/50" />
                          <span className="font-medium text-foreground">{apt.time}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <FileText className="w-4 h-4 text-foreground/50" />
                          <span className="font-medium text-foreground">{apt.staff}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  )
}
