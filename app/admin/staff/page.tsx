'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, Search, Plus, Mail, Key, UserPlus, CheckCircle2, AlertTriangle, Eye, Loader2, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/auth-store'
import { toast } from 'react-hot-toast'

interface StaffMember {
  id: string
  email: string
  role: 'registrar' | 'lab' | 'nurse' | 'admin'
  onboarding_completed: boolean
  name?: string
  phone?: string
  staff_id?: string
}

export default function AdminStaffPage() {
  const { token } = useAuthStore()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Form state
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState<'registrar' | 'lab' | 'nurse'>('registrar')

  const fetchStaff = async () => {
    setIsLoading(true)
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
      const res = await fetch(`${apiBase}/api/v1/admin/staff`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (res.ok) {
        const data = await res.json()
        setStaff(data)
      } else {
        toast.error('Failed to load staff directory')
      }
    } catch (e) {
      console.error(e)
      toast.error('Network error loading staff')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (token) fetchStaff()
  }, [token])

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail || !newPassword) return toast.error('Email and password required')

    setIsCreating(true)
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
      const res = await fetch(`${apiBase}/api/v1/admin/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          role: newRole
        })
      })

      if (res.ok) {
        toast.success('Staff member created successfully!')
        setShowCreateModal(false)
        setNewEmail('')
        setNewPassword('')
        setNewRole('registrar')
        fetchStaff()
      } else {
        const err = await res.json()
        toast.error(err.detail || 'Failed to create staff')
      }
    } catch (e) {
      toast.error('Network error creating staff')
    } finally {
      setIsCreating(false)
    }
  }

  const filteredStaff = staff.filter(s => 
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.name && s.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (s.staff_id && s.staff_id.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-8 animate-fadeInUp pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-primary" /> Staff Management
          </h1>
          <p className="text-muted-foreground mt-1">Provision clinical roles and oversee employee clearance platform access.</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2 bg-primary hover:bg-primary/90 text-white shrink-0 shadow-lg shadow-primary/20">
          <UserPlus className="w-4 h-4" /> Provision Staff
        </Button>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by email, name, or ID..." 
            className="pl-10 h-11 bg-muted/20 border-border"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <Button variant="outline" size="sm" className="h-11 shrink-0"><Filter className="w-4 h-4 mr-2"/> All Roles</Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
              <tr>
                <th className="p-4 font-bold tracking-wider">Account Identity</th>
                <th className="p-4 font-bold tracking-wider">Assigned Role</th>
                <th className="p-4 font-bold tracking-wider">Onboarding Status</th>
                <th className="p-4 font-bold tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center">
                    <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary/50" />
                    <p className="mt-4 text-muted-foreground">Loading staff directory...</p>
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-muted-foreground">
                    <ShieldCheck className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No staff accounts found.</p>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((member) => (
                  <tr key={member.id} className="hover:bg-muted/10 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shrink-0">
                          {member.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{member.name || 'Unregistered Name'}</p>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span>{member.email}</span>
                            {member.staff_id && <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono uppercase">{member.staff_id}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        member.role === 'admin' ? 'bg-purple-500/10 text-purple-600' :
                        member.role === 'registrar' ? 'bg-blue-500/10 text-blue-600' :
                        member.role === 'lab' ? 'bg-amber-500/10 text-amber-600' :
                        'bg-emerald-500/10 text-emerald-600'
                      }`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="p-4">
                      {member.onboarding_completed ? (
                        <span className="inline-flex items-center gap-1.5 text-primary text-xs font-bold">
                          <CheckCircle2 className="w-4 h-4" /> Setup Complete
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-amber-500 text-xs font-bold">
                          <AlertTriangle className="w-4 h-4" /> Pending Setup
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setShowCreateModal(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-border overflow-hidden"
            >
              <div className="p-6 sm:p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold font-display text-foreground">Provision Staff</h2>
                  <p className="text-muted-foreground mt-1 text-sm">Create a new clinic portal access account. The staff member will be required to complete their profile upon first login.</p>
                </div>

                <form onSubmit={handleCreateStaff} className="space-y-5">
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        type="email" required
                        placeholder="staff@eksu.edu.ng" 
                        className="pl-10 h-12 bg-muted/20"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Temporary Password</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        type="password" required minLength={6}
                        placeholder="••••••••" 
                        className="pl-10 h-12 bg-muted/20"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Clinic Role</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['registrar', 'lab', 'nurse'] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setNewRole(r)}
                          className={`p-3 rounded-xl border text-sm font-bold uppercase tracking-wider transition-all ${
                            newRole === r 
                              ? 'border-primary bg-primary/5 text-primary shadow-sm' 
                              : 'border-border bg-white text-muted-foreground hover:bg-muted/50'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <Button type="button" variant="outline" className="flex-1 h-12" onClick={() => setShowCreateModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1 h-12 bg-primary hover:bg-primary/90 text-white" disabled={isCreating}>
                      {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
