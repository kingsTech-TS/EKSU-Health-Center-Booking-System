'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, ShieldCheck, Mail, Phone, BookOpen, Fingerprint, Award, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/auth-store'
import { useRegistrationStore } from '@/store/registration-store'
import { toast } from 'react-hot-toast'

export default function StudentProfilePage() {
  const { user } = useAuthStore()
  const { students } = useRegistrationStore()
  
  // Find matching student progress
  const studentProgress = students.find(s => s.userId === user?.id || s.matricNumber === user?.matricNumber)

  const [phone, setPhone] = useState('08123456789')
  const [email, setEmail] = useState(user?.email || 'student@eksu.edu.ng')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      setIsEditing(false)
      toast.success('Profile contact info updated successfully!')
    }, 800)
  }

  if (!user) return null

  return (
    <div className="space-y-8 animate-fadeInUp">
      <div>
        <h1 className="text-3xl font-bold font-display text-foreground flex items-center gap-3">
          <User className="w-8 h-8 text-primary" /> My Profile
        </h1>
        <p className="text-muted-foreground mt-1">Manage your contact information and view your EKSU academic & health credentials.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Card: University Digital ID Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/95 to-primary shadow-xl p-6 text-white">
            {/* Hologram or background design */}
            <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-white/10 blur-xl pointer-events-none" />
            <div className="absolute -left-6 -top-6 w-32 h-32 rounded-full bg-secondary/15 blur-xl pointer-events-none" />

            {/* University Logo / Header */}
            <div className="flex items-center justify-between border-b border-white/20 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Award className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <span className="font-bold text-xs uppercase tracking-widest font-display block">EKSU Health Portal</span>
                  <span className="text-[9px] text-white/70 block -mt-0.5">Ekiti State University</span>
                </div>
              </div>
              <span className="bg-accent/20 border border-accent/30 text-accent font-bold px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider">
                Active Student
              </span>
            </div>

            {/* ID Details */}
            <div className="flex gap-4 items-start mb-6">
              <div className="w-16 h-16 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white font-extrabold text-2xl uppercase">
                {user.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-lg leading-tight font-display">{user.name}</p>
                <p className="text-xs text-white/80 font-mono mt-1">{studentProgress?.matricNumber || 'EKSU/2023/1001'}</p>
                <p className="text-[10px] text-accent font-bold uppercase mt-1">FACULTY OF SCIENCE</p>
              </div>
            </div>

            {/* Micro details */}
            <div className="grid grid-cols-2 gap-4 text-xs border-t border-white/20 pt-4 font-mono">
              <div>
                <span className="text-white/60 block text-[9px] uppercase">Card Status</span>
                <span className="font-bold">Verified</span>
              </div>
              <div>
                <span className="text-white/60 block text-[9px] uppercase">Portal Access</span>
                <span className="font-bold text-accent">Authorized</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Personal details & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details Form */}
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/20 flex justify-between items-center">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-primary" /> Personal Information
              </h3>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Edit Info</Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button size="sm" disabled={isSaving} onClick={handleSave}>Save</Button>
                </div>
              )}
            </div>

            <div className="p-6 grid sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Matric Number</Label>
                <Input disabled value={studentProgress?.matricNumber || 'EKSU/2023/1001'} className="bg-muted/30 border-border" />
              </div>

              <div className="space-y-1">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Faculty</Label>
                <Input disabled value="Faculty of Science" className="bg-muted/30 border-border" />
              </div>

              <div className="space-y-1">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" /> Email Address
                </Label>
                <Input 
                  disabled={!isEditing} 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="bg-white border-border/80 focus-visible:ring-primary disabled:bg-muted/30"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" /> Phone Number
                </Label>
                <Input 
                  disabled={!isEditing} 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  className="bg-white border-border/80 focus-visible:ring-primary disabled:bg-muted/30"
                />
              </div>
            </div>
          </div>

          {/* Clearance Status details */}
          <div className="bg-white p-6 rounded-2xl border border-border shadow-sm space-y-6">
            <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" /> Active Clearance Track
            </h3>

            <div className="space-y-6 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-border">
              {[
                { phase: 1, label: 'Phase 1: Registration Check', code: studentProgress?.phaseNumbers[1], desc: 'Verification of administrative papers and matric validation.' },
                { phase: 2, label: 'Phase 2: Laboratory Workup', code: studentProgress?.phaseNumbers[2], desc: 'Blood analysis, urine parameters, and baseline values.' },
                { phase: 3, label: 'Phase 3: Final Medical Approval', code: studentProgress?.phaseNumbers[3], desc: 'Complete clinical clearance letter and secure code release.' },
              ].map((step) => {
                const cur = studentProgress?.currentPhase || 1
                const done = cur > step.phase
                const active = cur === step.phase

                return (
                  <div key={step.phase} className="flex gap-4 relative">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 text-xs font-bold border transition-colors ${
                      done ? 'bg-primary text-white border-primary' :
                      active ? 'bg-secondary text-white border-secondary' : 'bg-muted text-muted-foreground border-border'
                    }`}>
                      {done ? <CheckCircle2 className="w-4 h-4" /> : step.phase}
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-sm">{step.label}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                      {step.code && (
                        <span className="inline-block mt-1 bg-muted px-2 py-0.5 rounded text-[10px] font-mono font-bold text-foreground">
                          Appointment Ref: {step.code}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
