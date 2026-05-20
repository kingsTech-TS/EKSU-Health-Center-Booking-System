'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Search, Filter, ShieldCheck, FileText, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, Eye, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/auth-store'
import { useRegistrationStore, Student } from '@/store/registration-store'

export default function StaffStudentsPage() {
  const { user } = useAuthStore()
  const { students, fetchQueue } = useRegistrationStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  // Determine current phase based on staff role
  const phase = useMemo(() => {
    if (!user) return 1
    if (user.role === 'registrar') return 1
    if (user.role === 'lab') return 2
    if (user.role === 'nurse') return 3
    return 1
  }, [user])

  useEffect(() => {
    fetchQueue(phase)
  }, [phase])

  // Filter students strictly by the staff's respective phase
  const staffPhaseStudents = useMemo(() => {
    return students.filter(s => s.currentPhase === phase)
  }, [students, phase])

  // Search filter logic
  const filteredStudents = useMemo(() => {
    return staffPhaseStudents.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            s.matricNumber.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesSearch
    })
  }, [staffPhaseStudents, searchTerm])

  return (
    <div className="space-y-8 animate-fadeInUp">
      <div>
        <h1 className="text-3xl font-bold font-display text-foreground flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" /> Student Health Records
        </h1>
        <p className="text-muted-foreground mt-1">Look up registered student screening timelines and verification statuses.</p>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white p-6 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by student name, matric number..." 
            className="pl-10 h-11 bg-muted/20 border-border"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground bg-muted px-4 py-2 rounded-lg font-mono">
            Active Scope: <span className="text-primary font-bold uppercase">Phase {phase} Only</span>
          </span>
        </div>
      </div>

      {/* Table grid */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="p-4 text-left font-bold text-muted-foreground">Student Name</th>
                <th className="p-4 text-left font-bold text-muted-foreground">Matric No.</th>
                <th className="p-4 text-left font-bold text-muted-foreground">Clearance Level</th>
                <th className="p-4 text-left font-bold text-muted-foreground">Active Codes</th>
                <th className="p-4 text-right font-bold text-muted-foreground">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredStudents.length > 0 ? (
                filteredStudents.map(student => (
                  <tr key={student.userId} className="hover:bg-muted/20 transition-all">
                    <td className="p-4 font-bold text-foreground">{student.name}</td>
                    <td className="p-4 font-mono text-muted-foreground text-xs">{student.matricNumber}</td>
                    <td className="p-4">
                      {student.currentPhase === 4 ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-500 uppercase tracking-wide">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Fully Cleared
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                          student.currentPhase === 1 ? 'bg-blue-500/10 text-blue-500' :
                          student.currentPhase === 2 ? 'bg-amber-500/10 text-amber-500' :
                          'bg-violet-500/10 text-violet-500'
                        }`}>
                          Phase {student.currentPhase}
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-xs text-muted-foreground">
                      <div className="flex gap-2">
                        {student.phaseNumbers[1] && <span className="bg-muted px-2 py-0.5 rounded text-[10px]">P1: {student.phaseNumbers[1]}</span>}
                        {student.phaseNumbers[2] && <span className="bg-muted px-2 py-0.5 rounded text-[10px]">P2: {student.phaseNumbers[2]}</span>}
                        {student.phaseNumbers[3] && <span className="bg-muted px-2 py-0.5 rounded text-[10px]">P3: {student.phaseNumbers[3]}</span>}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-primary hover:bg-primary/5 h-8 gap-1"
                        onClick={() => setSelectedStudent(student)}
                      >
                        <Eye className="w-4 h-4" /> View Details
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-muted-foreground">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-bold">No clinical files matching conditions.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details modal */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/60 backdrop-blur-sm"
              onClick={() => setSelectedStudent(null)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 w-full max-w-lg bg-white rounded-2xl border border-border shadow-xl overflow-hidden"
            >
              <div className="p-6 border-b border-border bg-muted/30">
                <h3 className="text-lg font-bold font-display text-foreground">Student Diagnostic History</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Matric No: {selectedStudent.matricNumber}</p>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Student Demographics</h4>
                  <div className="p-4 rounded-xl bg-muted/30 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Full Name:</span>
                      <span className="font-bold text-foreground">{selectedStudent.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Diagnostic Status:</span>
                      <span className="font-bold text-foreground uppercase">
                        {selectedStudent.currentPhase === 4 ? 'Fully Cleared' : `Active Phase ${selectedStudent.currentPhase}`}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Clearance Timeline</h4>
                  <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-border">
                    {[
                      { label: 'Phase 1: Initial Registration', code: selectedStudent.phaseNumbers[1], desc: 'Verification of administrative papers and matric validation.' },
                      { label: 'Phase 2: Laboratory Workup', code: selectedStudent.phaseNumbers[2], desc: 'Blood analysis, urine parameters, and baseline values.' },
                      { label: 'Phase 3: Final Medical Approval', code: selectedStudent.phaseNumbers[3], desc: 'Complete clinical clearance letter and secure code release.' },
                    ].map((step, idx) => {
                      const phaseNum = idx + 1
                      const isDone = selectedStudent.currentPhase > phaseNum
                      const isCurrent = selectedStudent.currentPhase === phaseNum

                      return (
                        <div key={idx} className="flex gap-4 relative">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 text-xs font-bold ${
                            isDone ? 'bg-primary text-white' : 
                            isCurrent ? 'bg-secondary text-white' : 'bg-muted text-muted-foreground'
                          }`}>
                            {phaseNum}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground">{step.label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                            {step.code ? (
                              <span className="inline-block mt-1 bg-muted px-2 py-0.5 rounded font-mono text-[10px] text-foreground font-bold">
                                Appointment No: {step.code}
                              </span>
                            ) : (
                              <span className="inline-block mt-1 text-[10px] italic text-muted-foreground">Not started yet</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-border flex justify-end">
                <Button className="bg-primary text-white font-bold" onClick={() => setSelectedStudent(null)}>Close Diagnostic File</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
