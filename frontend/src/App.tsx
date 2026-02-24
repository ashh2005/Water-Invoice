
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';

// Layouts
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardLayout } from './layouts/DashboardLayout';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { SectorManagementPage } from './pages/sectors/SectorManagementPage';
import { RoomManagementPage } from './pages/rooms/RoomManagementPage';
import { CustomerManagementPage } from './pages/customers/CustomerManagementPage';
import { PaymentPage } from './pages/payments/PaymentPage';
import { InvoicePage } from './pages/invoices/InvoicePage';
import { ReportsPage } from './pages/reports/ReportsPage';

// Components
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoadingSpinner } from './components/common/LoadingSpinner';

function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={
          <AuthLayout>
            <LoginPage />
          </AuthLayout>
        } />

        {/* Protected Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardLayout>
              <DashboardPage />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/sectors" element={
          <ProtectedRoute requiredRole="admin">
            <DashboardLayout>
              <SectorManagementPage />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/rooms" element={
          <ProtectedRoute>
            <DashboardLayout>
              <RoomManagementPage />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/customers" element={
          <ProtectedRoute>
            <DashboardLayout>
              <CustomerManagementPage />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/payments" element={
          <ProtectedRoute>
            <DashboardLayout>
              <PaymentPage />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/invoices" element={
          <ProtectedRoute>
            <DashboardLayout>
              <InvoicePage />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/reports" element={
          <ProtectedRoute requiredRole="admin">
            <DashboardLayout>
              <ReportsPage />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh' 
          }}>
            <LoadingSpinner />
          </Box>
        } />
      </Routes>
    </Box>
  );
}

export default App;