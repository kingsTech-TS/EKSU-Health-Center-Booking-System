'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowRight, Loader2, Heart, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { useRegistrationStore } from '@/store/registration-store'
import { toast } from 'react-hot-toast'
import { formatError } from '@/lib/utils'
import { API_BASE_URL } from '@/lib/api-config'
import confetti from 'canvas-confetti'

const signupSchema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  matricNumber: z.string().min(5, 'Invalid matric number'),
  faculty: z.string().min(1, 'Faculty is required'),
  level: z.string().min(1, 'Level is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type SignupValues = z.infer<typeof signupSchema>

const formVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

export default function SignupPage() {
  const router = useRouter()
  const setUser = useAuthStore((state) => state.setUser)
  const registerStudent = useRegistrationStore((state) => state.registerStudent)
  const [loading, setLoading] = useState(false)

  // Validation States
  const [matricStatus, setMatricStatus] = useState<'idle' | 'checking' | 'verified' | 'error'>('idle')
  const [passwordStrength, setPasswordStrength] = useState(0)

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    formState: { errors, isValid, dirtyFields },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange'
  })

  const passwordValue = watch('password', '')
  const matricValue = watch('matricNumber', '')

  // Password Strength Check (runs whenever password changes)
  useEffect(() => {
    let score = 0
    if (passwordValue.length >= 6) score++
    if (/\d/.test(passwordValue)) score++
    if (/[A-Z]/.test(passwordValue)) score++
    if (/[^A-Za-z0-9]/.test(passwordValue)) score++
    if (passwordValue !== '') setPasswordStrength(score)
    else setPasswordStrength(0)
  }, [passwordValue])

  const handleMatricBlur = () => {
    if (matricValue.length > 4) {
      setMatricStatus('checking')
      setTimeout(() => {
        if (matricValue.toUpperCase().startsWith('EKSU/')) {
          setMatricStatus('verified')
        } else {
          setMatricStatus('error')
        }
        trigger('matricNumber')
      }, 800)
    }
  }

  const onSubmit = async (data: SignupValues) => {
    setLoading(true)

    try {
      if (!data.matricNumber.toUpperCase().startsWith('EKSU/')) {
        toast.error('Your record was not found. Please contact the admin.')
        setLoading(false)
        return
      }

      const regResponse = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          role: 'student',
          name: data.fullName,
          matric_number: data.matricNumber,
        })
      })

      const regData = await regResponse.json()
      if (!regResponse.ok) {
        throw new Error(formatError(regData.detail) || 'Registration failed. Please contact the admin.')
      }

      // Auto-login under-the-hood for seamless UX
      const formData = new URLSearchParams()
      formData.append('username', data.email)
      formData.append('password', data.password)

      const loginResponse = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
      })

      const loginData = await loginResponse.json()
      if (loginResponse.ok) {
        const token = loginData.access_token
        const registeredUser = {
          id: regData.id || Math.random().toString(36).substring(7),
          name: data.fullName,
          email: data.email,
          matricNumber: data.matricNumber,
          role: 'student' as const,
        }
        setUser(registeredUser)
        useAuthStore.getState().setToken(token)
        sessionStorage.setItem('user', JSON.stringify(registeredUser))
        sessionStorage.setItem('token', token)
      } else {
        toast.error('Account created! Please sign in manually.')
        router.push('/login')
        return
      }

      toast.success('Registration successful!')
      
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0B5E3C', '#E8960C', '#A8E6CF', '#FFFFFF']
      })

      setTimeout(() => {
        router.push('/onboarding')
      }, 2000)
    } catch (err: any) {
      toast.error(err.message || 'An error occurred during registration')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex text-[#1A1A2E]">
      {/* Left Illustration Panel */}
      <div className="hidden lg:flex w-1/2 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0B5E3C] via-[#08452c] to-[#042417] p-12 flex-col justify-between relative overflow-hidden text-white">
        
        {/* Abstract SVG Background */}
        <svg className="absolute -bottom-20 -right-20 w-[600px] h-[600px] text-white/5 opacity-50 z-0" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="currentColor" />
          <circle cx="50" cy="50" r="30" fill="transparent" stroke="currentColor" strokeWidth="2" />
          <path d="M50 10 v80 M10 50 h80" stroke="currentColor" strokeWidth="2" />
        </svg>

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 w-fit hover:scale-105 transition-transform">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-[0_0_15px_rgba(255,255,255,0.5)]">
              <Heart className="w-6 h-6" />
            </div>
            <span className="font-bold text-2xl font-display">EKSU Health</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-6 max-w-md">
          <h1 className="text-5xl font-bold font-display leading-tight">Your health journey starts here.</h1>
          <p className="text-white/80 text-lg">Register to easily track your medical clearance process and book appointments without the hassle.</p>
        </div>

        <div className="relative z-10 text-white/50 text-sm">
          © {new Date().getFullYear()} Ekiti State University
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-[#F4F7F5]">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-border/50">
          <div className="text-center lg:text-left mb-8">
            <h2 className="text-3xl font-bold font-display text-foreground mb-2">Create Account</h2>
            <p className="text-muted-foreground text-sm">Please fill in your details to register</p>
          </div>

          <motion.form 
            onSubmit={handleSubmit(onSubmit)} 
            className="space-y-4"
            variants={formVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="space-y-2 relative">
              <Label htmlFor="fullName" className="font-bold">Full Name</Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                className={`focus-visible:ring-primary ${errors.fullName ? 'border-destructive' : ''}`}
                {...register('fullName')}
              />
              {dirtyFields.fullName && !errors.fullName && <CheckCircle2 className="absolute right-3 top-9 w-4 h-4 text-primary" />}
              {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName.message}</p>}
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
              <div className="space-y-2 relative">
                <Label htmlFor="matricNumber" className="font-bold">Matric Number</Label>
                <div className="relative">
                  <Input
                    id="matricNumber"
                    placeholder="EKSU/20XX/..."
                    className={`focus-visible:ring-primary ${errors.matricNumber || matricStatus === 'error' ? 'border-destructive' : matricStatus === 'verified' ? 'border-primary' : ''}`}
                    {...register('matricNumber')}
                    onBlur={(e) => {
                      register('matricNumber').onBlur(e)
                      handleMatricBlur()
                    }}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {matricStatus === 'checking' && <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />}
                    {matricStatus === 'verified' && <CheckCircle2 className="w-4 h-4 text-primary" />}
                  </div>
                </div>
                {matricStatus === 'error' && <p className="text-xs text-destructive mt-1 flex items-center gap-1">Record not found. Contact the Admin.</p>}
                {matricStatus === 'verified' && <p className="text-xs text-primary mt-1 flex items-center gap-1">Record verified ✓</p>}
                {errors.matricNumber && matricStatus !== 'error' && <p className="text-xs text-destructive mt-1">{errors.matricNumber.message}</p>}
              </div>

              <div className="space-y-2 relative">
                <Label htmlFor="level" className="font-bold">Level</Label>
                <select
                  id="level"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                  {...register('level')}
                >
                  <option value="">Select</option>
                  <option value="100L">100L</option>
                  <option value="200L">200L</option>
                  <option value="300L">300L</option>
                  <option value="400L">400L</option>
                  <option value="500L">500L</option>
                </select>
                {errors.level && <p className="text-xs text-destructive mt-1">{errors.level.message}</p>}
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2 relative">
              <Label htmlFor="faculty" className="font-bold">Faculty</Label>
              <select
                id="faculty"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                {...register('faculty')}
              >
                <option value="">Select Faculty</option>
                <option value="Science">Science</option>
                <option value="Engineering">Engineering</option>
                <option value="Arts">Arts</option>
                <option value="Law">Law</option>
                <option value="Medicine">Medicine</option>
              </select>
              {errors.faculty && <p className="text-xs text-destructive mt-1">{errors.faculty.message}</p>}
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-2 relative">
              <Label htmlFor="email" className="font-bold">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                className={`focus-visible:ring-primary ${errors.email ? 'border-destructive' : ''}`}
                {...register('email')}
              />
              {dirtyFields.email && !errors.email && <CheckCircle2 className="absolute right-3 top-9 w-4 h-4 text-primary" />}
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
              <div className="space-y-2 relative">
                <Label htmlFor="password" className="font-bold">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className={`focus-visible:ring-primary ${errors.password ? 'border-destructive' : ''}`}
                  {...register('password')}
                />
                {/* Password Strength Meter */}
                <div className="flex gap-1 h-1 mt-1.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div 
                      key={i} 
                      className={`flex-1 rounded-full transition-colors duration-300 ${
                        passwordStrength >= i 
                          ? i === 1 ? 'bg-destructive' 
                            : i === 2 ? 'bg-orange-500' 
                            : i === 3 ? 'bg-yellow-500' 
                            : 'bg-primary'
                          : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
                {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
              </div>

              <div className="space-y-2 relative">
                <Label htmlFor="confirmPassword" className="font-bold">Confirm</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className={`focus-visible:ring-primary ${errors.confirmPassword ? 'border-destructive' : ''}`}
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && <p className="text-xs text-destructive mt-1">{errors.confirmPassword.message}</p>}
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="pt-2">
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white gap-2 h-12 text-base shadow-[0_4px_14px_0_rgba(11,94,60,0.39)] hover:shadow-[0_6px_20px_rgba(11,94,60,0.23)] hover:scale-[1.02] transition-all duration-200" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying your record...
                  </>
                ) : (
                  <>
                    Register Account
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </motion.div>
          </motion.form>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-bold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
