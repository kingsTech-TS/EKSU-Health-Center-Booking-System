'use client'

import { motion, type Variants } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Heart, Calendar, ArrowRight, Activity, Clock, ChevronDown } from 'lucide-react'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden bg-[#1A1A2E] text-[#F4F7F5]">
      {/* Background Gradient Mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0B5E3C]/40 via-[#1A1A2E] to-[#1A1A2E] z-0 pointer-events-none" />

      {/* Navbar / Logo */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-8 md:px-12">
        <motion.div 
          className="flex items-center gap-3"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(11,94,60,0.5)]">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl font-display tracking-tight text-white">EKSU Health</span>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <motion.section
        className="relative z-10 flex flex-col items-center justify-center min-h-[75vh] px-6 text-center max-w-4xl mx-auto"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.h1
          variants={itemVariants}
          className="text-5xl md:text-[64px] font-bold mb-6 font-display leading-tight text-white"
        >
          EKSU Health Center
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="text-lg md:text-[20px] max-w-2xl mx-auto mb-10 text-accent/90"
        >
          Book your medical appointment in minutes. Skip the queue.
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link href="/register">
            <Button 
              size="lg" 
              className="gap-2 text-base bg-primary text-white hover:bg-primary/90 hover:scale-105 hover:shadow-[0_0_20px_rgba(11,94,60,0.4)] transition-all duration-300"
            >
              Book Appointment <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button 
              size="lg" 
              variant="outline"
              className="gap-2 text-base border-primary/50 text-white bg-transparent hover:bg-secondary hover:text-secondary-foreground hover:border-secondary transition-all duration-300"
            >
              Staff Login
            </Button>
          </Link>
        </motion.div>

        {/* Scroll Down Indicator */}
        <motion.div 
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown className="w-8 h-8 text-white/50" />
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <section className="relative z-10 px-6 py-24 md:py-32 max-w-6xl mx-auto">
        <motion.div 
          className="grid md:grid-cols-3 gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          {[
            {
              icon: Calendar,
              title: 'Schedule Appointments',
              description: 'Book time slots in advance from the comfort of your hostel.',
            },
            {
              icon: Activity,
              title: 'Three-Phase Tracking',
              description: 'Track your registration journey from Registrar to Lab to Nurse.',
            },
            {
              icon: Clock,
              title: 'No More Waiting',
              description: 'Arrive at your exact time slot and skip the chaotic walk-in queue.',
            },
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              className="p-8 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:-translate-y-2 transition-transform duration-300"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-6">
                <feature.icon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-bold text-xl mb-3 font-display text-white">{feature.title}</h3>
              <p className="text-white/70 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between text-sm text-white/50">
          <p>© {new Date().getFullYear()} EKSU Health Center</p>
          <p>Ekiti State University, Ado-Ekiti</p>
        </div>
      </footer>
    </main>
  )
}
