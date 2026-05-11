import { useState } from 'react';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { logout } from '../features/auth/authThunks';
import { selectAuthUser, selectAuthRole } from '../features/auth/authSelectors';

interface SidebarLinkProps {
  to: string;
  icon: string;
  label: string;
  onClick?: () => void;
}

const SidebarLink = ({ to, icon, label, onClick }: SidebarLinkProps) => (
  <Link
    to={to}
    onClick={onClick}
    className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
  >
    <span className="mr-3 text-lg">{icon}</span>
    <span className="font-medium">{label}</span>
  </Link>
);

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(selectAuthUser);
  const role = useAppSelector(selectAuthRole);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      case 'APPROVER':
        return 'bg-purple-100 text-purple-800';
      case 'REVIEWER':
        return 'bg-blue-100 text-blue-800';
      case 'APPLICANT':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:z-auto lg:shadow-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">Bank Portal</h1>
          </div>

          <nav className="flex-1 px-2 py-4 space-y-1">
            <SidebarLink to="/dashboard" label="Dashboard" />
            <SidebarLink to="/applications" label="Applications" />
            <SidebarLink to="/reviews" label="Reviews" />
            <SidebarLink to="/audit-logs" label="Audit Logs" />
          </nav>
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              <span className="sr-only">Open sidebar</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center space-x-4 ml-auto">
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(role || '')}`}>
                  {role}
                </span>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1">
          <div className="p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};