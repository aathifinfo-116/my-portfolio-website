import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { PortfolioPage } from '@/pages/PortfolioPage';
import { ToastProvider } from '@/components/ui/Toast';
import { AdminAuthProvider } from '@/adminportal/context/AdminAuthContext';
import { AdminLayout } from '@/adminportal/components/AdminLayout';
import { ProtectedRoute } from '@/adminportal/components/ProtectedRoute';
import { LoginPage } from '@/adminportal/pages/LoginPage';
import { DashboardPage } from '@/adminportal/pages/DashboardPage';
import { ProfilePage } from '@/adminportal/pages/ProfilePage';
import { ServicesPage } from '@/adminportal/pages/ServicesPage';
import { ProjectsPage } from '@/adminportal/pages/ProjectsPage';
import { CertificationsPage } from '@/adminportal/pages/CertificationsPage';
import { DocumentsPage } from '@/adminportal/pages/DocumentsPage';
import { AwardsPage } from '@/adminportal/pages/AwardsPage';

/**
 * ToastProvider wraps the router so both the public site and the admin portal
 * share one notification surface.
 */
export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AdminAuthProvider>
          <Routes>
            <Route path="/" element={<PortfolioPage />} />

            <Route path="/admin/login" element={<LoginPage />} />

            {/* Everything below requires a valid session. */}
            <Route element={<ProtectedRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="services" element={<ServicesPage />} />
                <Route path="projects" element={<ProjectsPage />} />
                <Route path="certifications" element={<CertificationsPage />} />
                <Route path="documents" element={<DocumentsPage />} />
                <Route path="awards" element={<AwardsPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AdminAuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
