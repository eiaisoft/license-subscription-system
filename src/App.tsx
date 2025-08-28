import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { theme } from './theme';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LicenseStore from './pages/user/LicenseStore';
import MySubscriptions from './pages/user/MySubscriptions';
import InstitutionManagement from './pages/admin/InstitutionManagement';
import LicenseManagement from './pages/admin/LicenseManagement';
import SubscriptionManagement from './pages/admin/SubscriptionManagement';
import UserManagement from './pages/admin/UserManagement';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <AuthProvider>
          <ToastProvider>
            <Router>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected user routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/licenses" element={
                  <ProtectedRoute>
                    <Layout>
                      <LicenseStore />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/subscriptions" element={
                  <ProtectedRoute>
                    <Layout>
                      <MySubscriptions />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                {/* Protected admin routes */}
                <Route path="/admin/*" element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <Routes>
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="institutions" element={<InstitutionManagement />} />
                        <Route path="licenses" element={<LicenseManagement />} />
                        <Route path="subscriptions" element={<SubscriptionManagement />} />
                        <Route path="users" element={<UserManagement />} />
                        <Route path="" element={<Navigate to="dashboard" replace />} />
                      </Routes>
                    </AdminLayout>
                  </ProtectedRoute>
                } />
                
                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Router>
          </ToastProvider>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
