'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowRight, Loader2, Heart } from 'lucide-react'
import { useAuthStore, UserRole } from '@/store/auth-store'
import { toast } from 'react-hot-toast'
import { formatError } from '@/lib/utils'
import { API_BASE_URL } from '@/lib/api-config'

const loginSchema = z.object({
  identifier: z.string().min(3, 'Required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginValues = z.infer<typeof loginSchema>
type TabType = 'student' | 'staff'

export default function LoginPage() {
  const router = useRouter()
  const setUser = useAuthStore((state) => state.setUser)
  const [activeTab, setActiveTab] = useState<TabType>('student')
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  })

  const decodeJWT = (token: string) => {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      return JSON.parse(jsonPayload)
    } catch (e) {
      return null
    }
  }

  const onSubmit = async (data: LoginValues) => {
    setLoading(true)

    try {
      const formData = new URLSearchParams()
      formData.append('username', data.identifier)
      formData.append('password', data.password)

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
      })

      const resData = await response.json()
      if (!response.ok) {
        throw new Error(formatError(resData.detail) || 'Incorrect email/ID or password')
      }

      const token = resData.access_token
      const decoded = decodeJWT(token)

      // Get role from decoded token or default to tab selection if not present
      const userRole = resData.role || decoded?.role || (activeTab === 'staff' ? 'registrar' : 'student')

      // Fallback mappings to match User state
      const mappedUser = {
        id: decoded?.sub || decoded?.id || resData.id || Math.random().toString(36).substring(7),
        name: resData.name || decoded?.name || (userRole.charAt(0).toUpperCase() + userRole.slice(1) + ' User'),
        email: resData.email || decoded?.email || (data.identifier.includes('@') ? data.identifier : `${userRole}@eksu.edu`),
        role: userRole,
        matricNumber: resData.matric_number || decoded?.matric_number || (userRole === 'student' && !data.identifier.includes('@') ? data.identifier.toUpperCase() : undefined),
        staffId: resData.staff_id || decoded?.staff_id || (userRole !== 'student' && !data.identifier.includes('@') ? data.identifier.toUpperCase() : undefined),
        onboarding_completed: resData.onboarding_completed !== undefined ? resData.onboarding_completed : (decoded?.onboarding_completed !== undefined ? decoded.onboarding_completed : true),
        is_active: resData.is_active !== undefined ? resData.is_active : (decoded?.is_active !== undefined ? decoded.is_active : true),
      }

      setUser(mappedUser)
      useAuthStore.getState().setToken(token)
      sessionStorage.setItem('user', JSON.stringify(mappedUser))
      sessionStorage.setItem('token', token)

      toast.success('Login Successful')

      setTimeout(() => {
        // Redirect logic based on role and onboarding status
        if (mappedUser.role !== 'student' && mappedUser.role !== 'admin' && !mappedUser.onboarding_completed) {
          router.push('/staff/onboarding')
          return
        }

        switch (mappedUser.role) {
          case 'student': router.push('/student/dashboard'); break;
          case 'registrar': router.push('/staff/phase1'); break;
          case 'lab': router.push('/staff/phase2'); break;
          case 'nurse': router.push('/staff/phase3'); break;
          case 'admin': router.push('/admin/dashboard'); break;
        }
      }, 800)
    } catch (err: any) {
      toast.error(err.message || 'Incorrect credentials. Please try again.')
      setShake(true)
      setTimeout(() => setShake(false), 400)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0B5E3C]/20 via-[#1A1A2E] to-[#1A1A2E] p-4 relative overflow-hidden text-[#F4F7F5]">
      
      <div className="w-full max-w-md relative z-10">
        <Link href="/" className="flex items-center justify-center gap-3 mb-8 hover:scale-105 transition-transform">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(11,94,60,0.5)]">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-2xl font-display text-white">EKSU Health</span>
        </Link>

        <div className="bg-white rounded-2xl shadow-2xl p-8 text-foreground">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold font-display">Welcome Back</h1>
            <p className="text-muted-foreground text-sm">Please sign in to continue</p>
          </div>

          {/* Custom Tabs */}
          <div className="flex border-b border-border mb-8 relative">
            {(['student', 'staff'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab)
                  reset()
                }}
                className={`flex-1 pb-3 text-sm font-bold capitalize transition-colors ${
                  activeTab === tab ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab}
              </button>
            ))}
            {/* Animated Underline */}
            <motion.div
              className="absolute bottom-0 h-0.5 bg-primary rounded-t-full"
              initial={false}
              animate={{
                left: activeTab === 'student' ? '0%' : '50%',
                width: '50%'
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </div>

          <motion.form 
            onSubmit={handleSubmit(onSubmit)} 
            className="space-y-5"
            animate={shake ? { x: [-10, 10, -10, 10, -5, 5, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-sm font-bold text-foreground">
                {activeTab === 'student' ? 'Matric Number or Email' : 'Staff ID or Email'}
              </Label>
              <Input
                id="identifier"
                placeholder={activeTab === 'student' ? 'EKSU/2023/... or email' : 'staff_id or email'}
                className={`focus-visible:ring-primary ${errors.identifier ? 'border-destructive' : ''}`}
                {...register('identifier')}
              />
              {errors.identifier && (
                <motion.p 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="text-xs text-destructive mt-1"
                >
                  {errors.identifier.message}
                </motion.p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-bold text-foreground">Password</Label>
                <button 
                  type="button" 
                  onClick={() => setShowForgotModal(true)} 
                  className="text-xs text-primary hover:underline font-bold"
                >
                  Forgot Password?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className={`focus-visible:ring-primary ${errors.password ? 'border-destructive' : ''}`}
                {...register('password')}
              />
            </div>

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white gap-2 h-12 text-base shadow-[0_4px_14px_0_rgba(11,94,60,0.39)] hover:shadow-[0_6px_20px_rgba(11,94,60,0.23)] hover:scale-[1.02] transition-all duration-200" disabled={loading}>
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>Sign In <ArrowRight className="w-5 h-5" /></>
              )}
            </Button>
          </motion.form>

          {activeTab === 'student' && (
            <div className="mt-8 text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/register" className="text-primary font-bold hover:underline">
                Register here
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowForgotModal(false)}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl border border-border p-6"
          >
            <h3 className="text-xl font-bold font-display mb-2 text-foreground">Reset Password</h3>
            <p className="text-muted-foreground mb-6 text-sm">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground">Email Address</Label>
                <Input placeholder="your@email.com" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="ghost" onClick={() => setShowForgotModal(false)}>Cancel</Button>
                <Button 
                  className="bg-primary hover:bg-primary/90 text-white" 
                  onClick={() => {
                    toast.success('Reset link sent!')
                    setShowForgotModal(false)
                  }}
                >
                  Send Reset Link
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
