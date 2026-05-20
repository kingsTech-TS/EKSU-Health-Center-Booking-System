'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ShieldCheck, ArrowRight, Loader2, User, Phone, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { toast } from 'react-hot-toast'

export default function StaffOnboardingPage() {
  const router = useRouter()
  const { user, token, setUser } = useAuthStore()
  
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [staffId, setStaffId] = useState('')

  const handleCompleteSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !phone || !staffId) return toast.error('All fields are required.')

    setLoading(true)
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
      const res = await fetch(`${apiBase}/api/v1/staff/onboarding`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name: name,
          phone_number: phone,
          staff_id: staffId
        })
      })

      if (res.ok) {
        toast.success('Profile setup complete!')
        
        // Update local user state
        if (user) {
          const updatedUser = { ...user, name, staffId, onboarding_completed: true }
          setUser(updatedUser)
          sessionStorage.setItem('user', JSON.stringify(updatedUser))
        }

        // Route to their phase
        switch (user?.role) {
          case 'registrar': router.push('/staff/phase1'); break;
          case 'lab': router.push('/staff/phase2'); break;
          case 'nurse': router.push('/staff/phase3'); break;
          default: router.push('/staff/queue'); break;
        }
      } else {
        const err = await res.json()
        toast.error(err.detail || 'Failed to complete setup.')
      }
    } catch (e) {
      toast.error('Network error during profile setup.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Complete Staff Profile</h1>
          <p className="text-muted-foreground">Please set up your details before accessing the health center clinical dashboard.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-8 rounded-3xl border border-border shadow-xl relative overflow-hidden"
        >
          <form onSubmit={handleCompleteSetup} className="space-y-5">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  required
                  placeholder="Dr. Sarah Johnson" 
                  className="pl-10 h-12 bg-muted/20"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  required type="tel"
                  placeholder="+234..." 
                  className="pl-10 h-12 bg-muted/20"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Official Staff ID</Label>
              <div className="relative">
                <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  required
                  placeholder="EKSU/STAFF/0123" 
                  className="pl-10 h-12 bg-muted/20 uppercase"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value.toUpperCase())}
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 text-white mt-4 gap-2" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Access Dashboard <ArrowRight className="w-4 h-4" /></>}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
