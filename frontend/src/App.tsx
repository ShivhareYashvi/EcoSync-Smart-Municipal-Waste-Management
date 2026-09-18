import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { BulkGeneratorsPage } from './pages/admin/BulkGeneratorsPage';
import { FleetManagementPage } from './pages/admin/FleetManagementPage';
import { RouteDispatchPage } from './pages/admin/RouteDispatchPage';
import { ZoneAnalyticsDashboard } from './pages/admin/ZoneAnalyticsDashboard';
import { DriverDashboard } from './pages/driver/DriverDashboard';
import { FeatureModulesPage } from './pages/FeatureModulesPage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { PriceBoardPage } from './pages/PriceBoardPage';
import { RecyclerDashboard } from './pages/recycler/RecyclerDashboard';
import { UserDashboard } from './pages/user/UserDashboard';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/price-board" element={<PriceBoardPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login/:role" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<Navigate to="/dashboard/user" replace />} />
        <Route element={<ProtectedRoute allowedRoles={['citizen']} />}>
          <Route path="user" element={<UserDashboard />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['driver']} />}>
          <Route path="driver" element={<DriverDashboard />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['recycler']} />}>
          <Route path="recycler" element={<RecyclerDashboard />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/zones" element={<ZoneAnalyticsDashboard />} />
          <Route path="admin/fleet" element={<FleetManagementPage />} />
          <Route path="admin/bulk-generators" element={<BulkGeneratorsPage />} />
          <Route path="admin/routes" element={<RouteDispatchPage />} />
        </Route>
      </Route>
      <Route path="/features" element={<DashboardLayout />}>
        <Route index element={<FeatureModulesPage />} />
      </Route>
    </Routes>
  );
}

