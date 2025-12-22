import React, { useState } from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Video, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Calendar,
  CreditCard,
  Building,
  ShieldCheck,
  ArrowRightLeft,
  History,
  FileText,
  BookUser,
  ClipboardList,
  CheckSquare,
  Bell,
  Share2,
  Network
} from 'lucide-react';
import { Spinner, Button } from './ui';

interface SidebarProps {
  isAdmin?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isAdmin }) => {
  const { signOut, profile } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const adminLinks = [
    { name: 'Overview', path: '/admin', icon: LayoutDashboard },
    { name: 'Members', path: '/admin/members', icon: Users },
    { name: 'Transfers', path: '/admin/transfers', icon: ArrowRightLeft },
    { name: 'Streaming', path: '/admin/streaming', icon: Video },
    { name: 'Events', path: '/admin/events', icon: Calendar },
    { name: 'Finance', path: '/admin/finance', icon: CreditCard },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const portalLinks = [
    { name: 'Dashboard', path: '/portal', icon: LayoutDashboard },
    { name: 'Live Stream', path: '/portal/streaming', icon: Video },
    { name: 'Calendar', path: '/portal/calendar', icon: Calendar },
    { name: 'Groups', path: '/portal/groups', icon: Users },
    { name: 'Directory', path: '/portal/directory', icon: BookUser },
    { name: 'Departments', path: '/portal/departments', icon: Network },
    { name: 'Attendance', path: '/portal/attendance', icon: CheckSquare },
    { name: 'Registrations', path: '/portal/registrations', icon: ClipboardList },
    { name: 'Notifications', path: '/portal/notifications', icon: Bell },
    { name: 'Transfers', path: '/portal/transfers', icon: ArrowRightLeft },
    { name: 'Share', path: '/portal/share', icon: Share2 },
    { name: 'Settings', path: '/portal/settings', icon: Settings },
  ];

  const links = isAdmin ? adminLinks : portalLinks;

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b z-50 flex items-center px-4 justify-between">
        <span className="font-bold text-lg text-primary">FaithConnect</span>
        <button onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-100 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:h-screen lg:flex lg:flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        mt-16 lg:mt-0
      `}>
        <div className="h-16 flex items-center px-6 font-bold text-xl border-b border-slate-800">
          FaithConnect
          {isAdmin && <span className="ml-2 text-xs bg-primary px-2 py-0.5 rounded text-white">Admin</span>}
        </div>

        <div className="p-4 border-b border-slate-800">
          <Link to={isAdmin ? "/admin/settings" : "/portal/profile"} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-lg font-bold">
              {profile?.email?.[0].toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium">{profile?.email}</p>
              <p className="text-xs text-slate-400 capitalize">{profile?.primary_role}</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isActive 
                    ? 'bg-primary text-white' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon size={20} />
                {link.name}
              </Link>
            );
          })}
          
          {isAdmin && (
            <div className="mt-8">
              <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Super Admin
              </p>
              <Link
                to="/superadmin"
                className="flex items-center gap-3 px-3 py-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors mb-1"
              >
                <ShieldCheck size={20} />
                Global View
              </Link>
              <Link
                to="/superadmin/audit-logs"
                className="flex items-center gap-3 px-3 py-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <FileText size={20} />
                Audit Logs
              </Link>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => signOut()}
            className="flex items-center gap-3 w-full px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export const ProtectedRoute: React.FC<{ role?: 'admin' | 'any' }> = ({ role = 'any' }) => {
  const { session, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  if (role === 'admin' && !isAdmin) {
    return <Navigate to="/portal" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar isAdmin={role === 'admin'} />
      <main className="flex-1 overflow-y-auto p-4 lg:p-8 mt-16 lg:mt-0">
        <Outlet />
      </main>
    </div>
  );
};