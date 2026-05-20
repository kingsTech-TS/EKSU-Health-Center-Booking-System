import { StaffDashboard } from '@/components/staff-dashboard'

export default function Phase1Page() {
  return (
    <StaffDashboard
      phase={1}
      title="Phase 1 — Initial Registration"
      description="Define today's schedule and manage the student check-in queue."
    />
  )
}
