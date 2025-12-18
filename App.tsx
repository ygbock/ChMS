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

// Admin Pages
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminTransferQueue } from './pages/admin/TransferQueue';
import { StreamingControl } from './pages/admin/StreamingControl';

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
            <Route path="streaming" element={<PortalStreaming />} />
            <Route path="profile" element={<div className="p-8">Profile Page Placeholder</div>} />
            <Route path="calendar" element={<div className="p-8">Calendar Page Placeholder</div>} />
            <Route path="transfer-request" element={<div className="p-8 max-w-2xl"><TransferRequestForm /></div>} />
            <Route path="transfers" element={<div className="p-8"><TransferHistory /></div>} />
          </Route>

          {/* Branch Admin Routes (Protected + Role Check) */}
          <Route path="/admin" element={<ProtectedRoute role="admin" />}>
            <Route index element={<AdminDashboard />} />
            <Route path="streaming" element={<StreamingControl />} />
            <Route path="transfers" element={<div className="p-8"><AdminTransferQueue /></div>} />
            <Route path="members" element={<div className="p-8">Members Management Placeholder</div>} />
            <Route path="finance" element={<div className="p-8">Finance Placeholder</div>} />
            <Route path="settings" element={<div className="p-8">Branch Settings Placeholder</div>} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;