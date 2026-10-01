import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Sidebar } from './components/layout/Sidebar';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { ResearchPage } from './pages/ResearchPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';

const AuthenticatedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ProtectedRoute>
      <div className="flex h-screen w-screen overflow-hidden bg-canvas font-sans text-ink">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {children}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Auth Route */}
          <Route path="/login" element={<AuthPage />} />

          {/* Protected Workspace Routes */}
          <Route
            path="/"
            element={
              <AuthenticatedLayout>
                <Navigate to="/dashboard" replace />
              </AuthenticatedLayout>
            }
          />
          <Route
            path="/dashboard"
            element={
              <AuthenticatedLayout>
                <DashboardPage />
              </AuthenticatedLayout>
            }
          />
          <Route
            path="/documents"
            element={
              <AuthenticatedLayout>
                <DocumentsPage />
              </AuthenticatedLayout>
            }
          />
          <Route
            path="/research"
            element={
              <AuthenticatedLayout>
                <ResearchPage />
              </AuthenticatedLayout>
            }
          />
          <Route
            path="/history"
            element={
              <AuthenticatedLayout>
                <HistoryPage />
              </AuthenticatedLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <AuthenticatedLayout>
                <SettingsPage />
              </AuthenticatedLayout>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
