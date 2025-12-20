import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/Layout';
import { Landing } from './pages/Landing';
import { Auth } from './pages/Auth';
import { TransferRequestForm } from './components/TransferRequestForm';

// Portal Pages
import { PortalDashboard } from './pages/portal/Dashboard';
import { PortalStreaming } from './pages/portal/Streaming';
import { TransferHistory } from './pages/portal/TransferHistory';
import { PortalProfile } from './pages/portal/Profile';
import { PortalDirectory } from './pages/portal/Directory';
import { PortalAttendance } from './pages/portal/Attendance';
import { PortalRegistrations } from './pages/portal/Registrations';
import { PortalGroups } from './pages/portal/Groups';
import { PortalDepartments } from './pages/portal/Departments';
import { PortalNotifications } from './pages/portal/Notifications';
import { PortalSettings, PortalShare, PortalCalendar } from './pages/portal/Placeholders';

// Admin Pages
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminTransferQueue } from './pages/admin/TransferQueue';
import { AdminMembers } from './pages/admin/Members';
import { StreamingControl } from './pages/admin/StreamingControl';

// Super Admin Pages
import { SuperAdminDashboard } from './pages/superadmin/Dashboard';
import { SuperAdminBranches } from './pages/superadmin/Branches';
import { SuperAdminUsers } from './pages/superadmin/Users';
import { AuditLogs } from './pages/superadmin/AuditLog';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />

          {/* Member Portal Routes (Protected) */}
          <Route path="/portal" element={<ProtectedRoute role="any" />}>
            <Route index element={<PortalDashboard />} />
            <Route path="profile" element={<PortalProfile />} />
            <Route path="directory" element={<PortalDirectory />} />
            <Route path="registrations" element={<PortalRegistrations />} />
            <Route path="attendance" element={<PortalAttendance />} />
            <Route path="groups" element={<PortalGroups />} />
            <Route path="calendar" element={<PortalCalendar />} />
            <Route path="notifications" element={<PortalNotifications />} />
            <Route path="settings" element={<PortalSettings />} />
            <Route path="share" element={<PortalShare />} />
            <Route path="departments" element={<PortalDepartments />} />
            <Route path="streaming" element={<PortalStreaming />} />
            <Route path="streaming/:streamId" element={<PortalStreaming />} />

            {/* Existing functionality retained */}
            <Route path="transfer-request" element={<div className="p-8 max-w-2xl"><TransferRequestForm /></div>} />
            <Route path="transfers" element={<div className="p-8"><TransferHistory /></div>} />
            <Route path="giving" element={<div className="p-8">Giving Placeholder</div>} />
          </Route>

          {/* Branch Admin Routes (Protected + Role Check) */}
          <Route path="/admin" element={<ProtectedRoute role="admin" />}>
            <Route index element={<AdminDashboard />} />
            <Route path="streaming" element={<StreamingControl />} />
            <Route path="transfers" element={<div className="p-8"><AdminTransferQueue /></div>} />
            <Route path="members" element={<div className="p-8"><AdminMembers /></div>} />
            <Route path="finance" element={<div className="p-8">Finance Placeholder</div>} />
            <Route path="settings" element={<div className="p-8">Branch Settings Placeholder</div>} />
          </Route>

          {/* Super Admin Routes */}
          <Route path="/superadmin" element={<ProtectedRoute role="superadmin" />}>
            <Route index element={<SuperAdminDashboard />} />
            <Route path="branches" element={<div className="p-8"><SuperAdminBranches /></div>} />
            <Route path="users" element={<div className="p-8"><SuperAdminUsers /></div>} />
            <Route path="audit-logs" element={<AuditLogs />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;