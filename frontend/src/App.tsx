import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import { QRGeneratorPage } from './pages/QRGeneratorPage';
import { ScannerPage } from './pages/ScannerPage';
import { ScanPage } from './pages/ScanPage';
import { CollectionsPage } from './pages/CollectionsPage';
import { CollectionDetailPage } from './pages/CollectionDetailPage';
import type { ReactNode } from 'react';

// ---- Route Guards ----

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
}

function GuestRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh' }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// ---- Placeholder Pages ----

function PlaceholderPage({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="flex-center animate-fadeIn" style={{ height: '100%', flexDirection: 'column', gap: '1rem' }}>
      <span style={{ fontSize: '3rem' }}>{icon}</span>
      <h2 style={{ fontSize: '1.25rem' }}>{title}</h2>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Próximamente</p>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="flex-center animate-fadeIn" style={{ minHeight: '100vh', flexDirection: 'column', gap: '1rem' }}>
      <span style={{ fontSize: '4rem' }}>🔍</span>
      <h1 style={{ fontSize: '1.5rem' }}>Página no encontrada</h1>
      <p style={{ color: 'var(--color-text-secondary)' }}>La página que buscás no existe.</p>
      <a href="/dashboard" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
        Ir al inicio
      </a>
    </div>
  );
}

// ---- App ----

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Guest-only */}
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

      {/* Protected with AppLayout */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/qr-generator" element={<ProtectedRoute><QRGeneratorPage /></ProtectedRoute>} />
      <Route path="/scanner" element={<ProtectedRoute><ScannerPage /></ProtectedRoute>} />
      <Route path="/collections" element={<ProtectedRoute><CollectionsPage /></ProtectedRoute>} />
      <Route path="/collections/:id" element={<ProtectedRoute><CollectionDetailPage /></ProtectedRoute>} />
      <Route path="/circuits" element={<ProtectedRoute><PlaceholderPage title="Circuitos" icon="🔄" /></ProtectedRoute>} />

      {/* Public scan landing */}
      <Route path="/scan/:code" element={<ScanPage />} />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  );
}
