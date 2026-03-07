import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';

import { AuthLayout } from './layouts/AuthLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { GuntaManagementPage } from './pages/guntas/GuntaManagementPage';
import { CustomerManagementPage } from './pages/customers/CustomerManagementPage';
import { PaymentPage } from './pages/payments/PaymentPage';
import { InvoicePage } from './pages/invoices/InvoicePage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { CustomerLoginPage } from './pages/customer-portal/CustomerLoginPage';
import { CustomerDashboardPage } from './pages/customer-portal/CustomerDashboardPage';
import { CustomerProtectedRoute } from './components/customer-portal/CustomerProtectedRoute';

function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Routes>
        <Route path="/admin-login" element={<AuthLayout><LoginPage /></AuthLayout>} />

        {/* Customer Portal Routes */}
        <Route path="/login" element={<CustomerLoginPage />} />
        <Route path="/dashboard" element={
          <CustomerProtectedRoute><CustomerDashboardPage /></CustomerProtectedRoute>
        } />

        {/* Default route redirects to customer login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Admin/Staff Routes */}
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="admin"><DashboardLayout><DashboardPage /></DashboardLayout></ProtectedRoute>
        } />

        <Route path="/guntas" element={
          <ProtectedRoute requiredRole="admin"><DashboardLayout><GuntaManagementPage /></DashboardLayout></ProtectedRoute>
        } />

        <Route path="/customers" element={
          <ProtectedRoute requiredRole="admin"><DashboardLayout><CustomerManagementPage /></DashboardLayout></ProtectedRoute>
        } />

        <Route path="/payments" element={
          <ProtectedRoute><DashboardLayout><PaymentPage /></DashboardLayout></ProtectedRoute>
        } />

        <Route path="/invoices" element={
          <ProtectedRoute requiredRole="admin"><DashboardLayout><InvoicePage /></DashboardLayout></ProtectedRoute>
        } />

        <Route path="/reports" element={
          <ProtectedRoute requiredRole="admin"><DashboardLayout><ReportsPage /></DashboardLayout></ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Box>
  );
}

export default App;
