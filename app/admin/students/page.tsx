'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Search, Filter, ShieldCheck, FileText, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, Eye, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRegistrationStore, Student } from '@/store/registration-store'
import { toast } from 'react-hot-toast'

export default function AdminStudentsPage() {
  const { students } = useRegistrationStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | 'Phase 1' | 'Phase 2' | 'Phase 3' | 'Cleared'>('All')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  
  // Sorting state
  const [sortField, setSortField] = useState<'name' | 'matricNumber' | 'currentPhase'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const toggleSort = (field: 'name' | 'matricNumber' | 'currentPhase') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  // Filter & Search Logic
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            s.matricNumber.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesFilter = 
        statusFilter === 'All' ? true :
        statusFilter === 'Phase 1' ? s.currentPhase === 1 :
        statusFilter === 'Phase 2' ? s.currentPhase === 2 :
        statusFilter === 'Phase 3' ? s.currentPhase === 3 :
        statusFilter === 'Cleared' ? s.currentPhase === 4 : true

      return matchesSearch && matchesFilter
    }).sort((a, b) => {
      let valA = a[sortField]
      let valB = b[sortField]
      
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
      }
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA
      }
      return 0
    })
  }, [students, searchTerm, statusFilter, sortField, sortOrder])

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage)
  
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredStudents.slice(start, start + itemsPerPage)
  }, [filteredStudents, currentPage])

  return (
    <div className="space-y-8 animate-fadeInUp">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" /> Student Directory
          </h1>
          <p className="text-muted-foreground mt-1">Review student progress, active phases, and medical clearances.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-full font-mono">
            {filteredStudents.length} Students found
          </span>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className="bg-white p-6 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name, matric number..." 
            className="pl-10 h-11 bg-muted/20 border-border/80 focus-visible:ring-primary"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0 hidden sm:inline" />
          {(['All', 'Phase 1', 'Phase 2', 'Phase 3', 'Cleared'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => { setStatusFilter(tab); setCurrentPage(1) }}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all shrink-0 uppercase tracking-wider ${
                statusFilter === tab
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="p-4 text-left font-bold text-muted-foreground">
                  <button onClick={() => toggleSort('name')} className="flex items-center gap-1 hover:text-primary">
                    Student Name <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th className="p-4 text-left font-bold text-muted-foreground">
                  <button onClick={() => toggleSort('matricNumber')} className="flex items-center gap-1 hover:text-primary">
                    Matric No. <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th className="p-4 text-left font-bold text-muted-foreground">
                  <button onClick={() => toggleSort('currentPhase')} className="flex items-center gap-1 hover:text-primary">
                    Phase Status <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th className="p-4 text-left font-bold text-muted-foreground">Reg Phase Numbers</th>
                <th className="p-4 text-right font-bold text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {paginatedStudents.length > 0 ? (
                paginatedStudents.map(student => (
                  <tr key={student.userId} className="hover:bg-muted/20 transition-all">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                          {student.name.charAt(0)}
                        </div>
                        <span className="font-bold text-foreground">{student.name}</span>
                      </div>
                    </td>
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
                    <p className="font-bold">No students found matching filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/10">
            <span className="text-xs text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(c => c - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(c => c + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
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
                <h3 className="text-lg font-bold font-display text-foreground">Medical Screening History</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Matric No: {selectedStudent.matricNumber}</p>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Student Profiles</h4>
                  <div className="p-4 rounded-xl bg-muted/30 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Full Name:</span>
                      <span className="font-bold text-foreground">{selectedStudent.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Clearance Status:</span>
                      <span className="font-bold text-foreground uppercase">
                        {selectedStudent.currentPhase === 4 ? 'Cleared' : `Phase ${selectedStudent.currentPhase}`}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Clearance Timeline</h4>
                  <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-border">
                    {[
                      { label: 'Phase 1: Initial Registration', code: selectedStudent.phaseNumbers[1], desc: 'Demographics, medical files checked.' },
                      { label: 'Phase 2: Lab Testing', code: selectedStudent.phaseNumbers[2], desc: 'Blood count, urinalysis & physical stats.' },
                      { label: 'Phase 3: Clinical Review & Nurse Clearance', code: selectedStudent.phaseNumbers[3], desc: 'Irreversible sign-off & clearance ID.' },
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
                <Button className="bg-primary text-white" onClick={() => setSelectedStudent(null)}>Close</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
