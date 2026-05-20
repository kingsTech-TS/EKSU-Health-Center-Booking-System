'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart, Home, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0B5E3C]/20 via-[#1A1A2E] to-[#1A1A2E] p-4 relative overflow-hidden">
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-secondary/5 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
      </div>

      <div className="relative z-10 text-center max-w-lg mx-auto">
        {/* EKSU Logo */}
        <motion.div
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(11,94,60,0.4)]"
        >
          <Heart className="w-10 h-10 text-white" />
        </motion.div>

        {/* 404 Graphic */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8"
        >
          <div className="relative inline-block">
            <span className="text-[120px] md:text-[160px] font-bold font-display leading-none text-white/5 select-none">
              404
            </span>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center border border-destructive/20">
                <AlertTriangle className="w-12 h-12 text-destructive" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="space-y-4 mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-bold font-display text-white">
            Page Not Found
          </h1>
          <p className="text-white/60 text-lg max-w-sm mx-auto leading-relaxed">
            This page doesn't exist or you don't have access to view it.
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href="/">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white gap-2 shadow-[0_4px_14px_0_rgba(11,94,60,0.5)] hover:scale-[1.02] transition-all duration-200"
            >
              <Home className="w-5 h-5" />
              Go to Homepage
            </Button>
          </Link>
          <Link href="/login">
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 hover:text-white gap-2 transition-all duration-200"
            >
              Back to Login
            </Button>
          </Link>
        </motion.div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-12 text-white/30 text-sm"
        >
          EKSU Health Center Appointment System
        </motion.p>
      </div>
    </div>
  )
}
