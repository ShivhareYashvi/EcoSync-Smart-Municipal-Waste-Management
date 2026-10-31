import { Outlet, useLocation } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { Navbar } from '../components/Navbar';

export function DashboardLayout() {
  const location = useLocation();
  const isCitizenHub = location.pathname === '/dashboard/user' || location.pathname.startsWith('/dashboard/user');

  // Citizen Hub uses its own dedicated accessible Top Header + Sidebar layout
  if (isCitizenHub) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
      <div>
        {/* Sticky persistent dashboard header */}
        <Navbar mode="dashboard" />

        {/* Dashboard Workspace */}
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>

      {/* Unobtrusive compact dashboard footer */}
      <Footer mode="dashboard" />
    </div>
  );
}
