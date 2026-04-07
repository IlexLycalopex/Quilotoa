import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/layouts/AppShell'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { OpportunitiesPage } from '@/pages/OpportunitiesPage'
import { NewOpportunityPage } from '@/pages/NewOpportunityPage'
import { OpportunityLayout } from '@/layouts/OpportunityLayout'
import { QualificationPage } from '@/pages/QualificationPage'
import { DiscoveryPage } from '@/pages/DiscoveryPage'
import { CoiPage } from '@/pages/CoiPage'
import { RoiPage } from '@/pages/RoiPage'
import { ProposalsPage } from '@/pages/ProposalsPage'
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage'
import { AdminConfigPage } from '@/pages/admin/AdminConfigPage'
import { RequireAuth } from '@/components/shared/RequireAuth'
import { RequireRole } from '@/components/shared/RequireRole'
import { Role } from '@msas/shared'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
            <Route path="/app/dashboard" element={<DashboardPage />} />
            <Route path="/app/opportunities" element={<OpportunitiesPage />} />
            <Route path="/app/opportunities/new" element={<NewOpportunityPage />} />

            <Route path="/app/opportunities/:id" element={<OpportunityLayout />}>
              <Route path="qualification" element={<QualificationPage />} />
              <Route path="discovery" element={<DiscoveryPage />} />
              <Route path="coi" element={<CoiPage />} />
              <Route path="roi" element={<RoiPage />} />
              <Route path="proposals" element={<ProposalsPage />} />
            </Route>

            <Route element={<RequireRole roles={[Role.ADMIN]} />}>
              <Route path="/app/admin/users" element={<AdminUsersPage />} />
              <Route path="/app/admin/configuration" element={<AdminConfigPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
