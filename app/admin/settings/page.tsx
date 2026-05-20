'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, Shield, Clock, Users, CheckCircle2, Save, Play, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'react-hot-toast'

export default function AdminSettingsPage() {
  const [clinicOpen, setClinicOpen] = useState(true)
  const [autoAdvance, setAutoAdvance] = useState(true)
  const [maxDailySlots, setMaxDailySlots] = useState(500)
  const [duration, setDuration] = useState(15)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      toast.success('System settings updated successfully!')
    }, 1000)
  }

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all temporary queues, active sessions, and database mock logs? This cannot be undone.')) {
      toast.success('Mock database state refreshed successfully!')
    }
  }

  return (
    <div className="space-y-8 animate-fadeInUp">
      <div>
        <h1 className="text-3xl font-bold font-display text-foreground flex items-center gap-3">
          <Settings className="w-8 h-8 text-primary" /> System Settings
        </h1>
        <p className="text-muted-foreground mt-1">Configure global medical center parameters, active hours, and queue defaults.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* General Config */}
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border bg-muted/20">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" /> Global Parameters
              </h3>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                <div>
                  <Label className="font-bold text-foreground block mb-0.5">Health Center Queue Active</Label>
                  <span className="text-xs text-muted-foreground">Allows students to request slots and checks-in today.</span>
                </div>
                <button 
                  onClick={() => setClinicOpen(!clinicOpen)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${clinicOpen ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                >
                  <span className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${clinicOpen ? 'left-6.5' : 'left-0.5'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                <div>
                  <Label className="font-bold text-foreground block mb-0.5">Automated Multi-Phase Pipeline Gating</Label>
                  <span className="text-xs text-muted-foreground">Enforces linear screening steps (Phase 1 ➜ Phase 2 ➜ Phase 3).</span>
                </div>
                <button 
                  onClick={() => setAutoAdvance(!autoAdvance)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${autoAdvance ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                >
                  <span className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${autoAdvance ? 'left-6.5' : 'left-0.5'}`} />
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="maxSlots" className="font-bold text-xs uppercase text-muted-foreground">Max Daily Slots Cap</Label>
                  <Input 
                    id="maxSlots" type="number" 
                    value={maxDailySlots} onChange={(e) => setMaxDailySlots(parseInt(e.target.value) || 0)}
                    className="h-11 bg-muted/20 border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration" className="font-bold text-xs uppercase text-muted-foreground">Default Duration Per Student (min)</Label>
                  <Input 
                    id="duration" type="number" 
                    value={duration} onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                    className="h-11 bg-muted/20 border-border"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dangerous Zone */}
          <div className="bg-white rounded-2xl border border-destructive/20 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border bg-destructive/5">
              <h3 className="font-bold text-destructive flex items-center gap-2">
                ⚠️ System Maintenance
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Reset system logs, clear appointment queues, and restore local state storage to baseline. These actions cannot be undone.
              </p>
              <div className="flex gap-4 flex-wrap">
                <Button 
                  variant="outline" 
                  className="border-destructive/30 text-destructive hover:bg-destructive/5 gap-2"
                  onClick={handleResetData}
                >
                  <RefreshCw className="w-4 h-4" /> Reset Database Logs
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Action */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-border shadow-sm space-y-4">
            <h3 className="font-bold text-foreground text-lg">Save Settings</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Applying changes immediately updates the configuration dashboard parameters for all Registrar, Lab, and Nurse staff.
            </p>
            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold gap-2 py-6 rounded-xl shadow-lg shadow-primary/20"
              disabled={isSaving}
              onClick={handleSave}
            >
              {isSaving ? (
                <>Saving Changes...</>
              ) : (
                <>
                  <Save className="w-5 h-5" /> Save Configuration
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
