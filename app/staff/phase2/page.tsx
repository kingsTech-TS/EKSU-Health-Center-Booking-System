import { StaffDashboard } from '@/components/staff-dashboard'

export default function Phase2Page() {
  return (
    <StaffDashboard
      phase={2}
      title="Phase 2 — Laboratory Testing"
      description="Manage lab appointment slots and process student test results."
    />
  )
}
