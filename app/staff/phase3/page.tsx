import { StaffDashboard } from '@/components/staff-dashboard'

export default function Phase3Page() {
  return (
    <StaffDashboard
      phase={3}
      title="Phase 3 — Final Medical Clearance"
      description="Confirm final clearances. This action is irreversible and fully clears a student."
    />
  )
}
