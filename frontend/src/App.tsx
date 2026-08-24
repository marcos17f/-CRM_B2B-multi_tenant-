import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/app-shell'
import { ProtectedRoute } from '@/features/auth/protected-route'
import { LoginPage } from '@/features/auth/login-page'
import { RegisterPage } from '@/features/auth/register-page'
import { SelectWorkspacePage } from '@/features/auth/select-workspace-page'
import { AcceptInvitePage } from '@/features/auth/accept-invite-page'
import { InboxPage } from '@/features/inbox/inbox-page'
import { OverviewPage } from '@/features/inbox/overview-page'
import { BoardsPage } from '@/features/boards/boards-page'
import { ContactsPage } from '@/features/contacts/contacts-page'
import { ContactDetailPage } from '@/features/contacts/contact-detail-page'
import { CompaniesPage } from '@/features/companies/companies-page'
import { CompanyDetailPage } from '@/features/companies/company-detail-page'
import { CampaignsPage } from '@/features/campaigns/campaigns-page'
import { CampaignDetailPage } from '@/features/campaigns/campaign-detail-page'
import { ActivitiesPage } from '@/features/activities/activities-page'
import { OperationsPage } from '@/features/operations/operations-page'
import { ReportsPage } from '@/features/reports/reports-page'
import { SegmentsPage } from '@/features/segments/segments-page'
import { CatalogPage } from '@/features/catalog/catalog-page'
import { SettingsPage } from '@/features/settings/settings-page'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/select-workspace" element={<SelectWorkspacePage />} />
      <Route path="/accept-invite" element={<AcceptInvitePage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/inbox" replace />} />
          <Route path="/inbox" element={<InboxPage />} />
          <Route path="/overview" element={<OverviewPage />} />
          <Route path="/boards" element={<BoardsPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/contacts/:id" element={<ContactDetailPage />} />
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="/companies/:id" element={<CompanyDetailPage />} />
          <Route path="/campaigns" element={<CampaignsPage />} />
          <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
          <Route path="/activities" element={<ActivitiesPage />} />
          <Route path="/operations" element={<OperationsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/segments" element={<SegmentsPage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/inbox" replace />} />
    </Routes>
  )
}
