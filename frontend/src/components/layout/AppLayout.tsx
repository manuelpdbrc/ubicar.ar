import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { ReactNode } from 'react';
import { BottomNav } from './BottomNav';

const SIDEBAR_ITEMS = [
  { path: '/dashboard', icon: '🗺️', label: 'Mapa' },
  { path: '/scanner', icon: '📷', label: 'Escanear QR' },
  { path: '/collections', icon: '📁', label: 'Colecciones' },
  { path: '/circuits', icon: '🔄', label: 'Circuitos' },
];

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth();

  return (
    <div className="app-layout">
      {/* Desktop Sidebar */}
      <aside className="sidebar" role="navigation" aria-label="Menú principal">
        {/* Logo */}
        <div className="sidebar__logo">
          <svg viewBox="0 0 64 64" fill="none" width="28" height="28">
            <path d="M32 4C20.954 4 12 12.954 12 24c0 14 20 36 20 36s20-22 20-36C52 12.954 43.046 4 32 4z" fill="#6366F1"/>
            <circle cx="32" cy="24" r="9" fill="#fff"/>
          </svg>
          <span className="sidebar__brand">ubicar.ar</span>
        </div>

        {/* Nav Items */}
        <nav className="sidebar__nav">
          {SIDEBAR_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
              }
            >
              <span className="sidebar__link-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User info at bottom */}
        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="avatar avatar-sm">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="truncate" style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user?.name}</p>
              <p className="truncate text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{user?.email}</p>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm btn-full" onClick={logout} style={{ marginTop: '0.5rem' }}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="app-main">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <BottomNav />

      <style>{`
        .app-layout {
          display: flex;
          min-height: 100vh;
          min-height: 100dvh;
        }

        /* ── Sidebar (desktop only) ─────────────────── */
        .sidebar {
          display: none;
        }

        @media (min-width: 768px) {
          .sidebar {
            display: flex;
            flex-direction: column;
            width: var(--sidebar-width);
            max-width: 280px;
            background-color: var(--color-surface);
            border-right: 1px solid var(--color-border-light);
            padding: 1.25rem;
            flex-shrink: 0;
            position: sticky;
            top: 0;
            height: 100vh;
            height: 100dvh;
            overflow-y: auto;
          }
        }

        .sidebar__logo {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.25rem 0.5rem;
          margin-bottom: 1.5rem;
        }

        .sidebar__brand {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--color-text);
          letter-spacing: -0.025em;
        }

        .sidebar__nav {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          flex: 1;
        }

        .sidebar__link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.625rem 0.75rem;
          border-radius: var(--radius-md);
          color: var(--color-text-secondary);
          text-decoration: none;
          font-size: 0.9375rem;
          font-weight: 500;
          transition: all var(--transition-fast);
        }

        .sidebar__link:hover {
          background-color: var(--color-bg-secondary);
          color: var(--color-text);
        }

        .sidebar__link--active {
          background: linear-gradient(135deg, var(--color-primary-50), var(--color-primary-100));
          color: var(--color-primary-dark);
          font-weight: 600;
        }

        .sidebar__link-icon {
          font-size: 1.125rem;
          width: 1.5rem;
          text-align: center;
        }

        .sidebar__footer {
          padding-top: 1rem;
          border-top: 1px solid var(--color-border);
        }

        .sidebar__user {
          display: flex;
          align-items: center;
          gap: 0.625rem;
        }

        /* ── Main Content ───────────────────────────── */
        .app-main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          padding-bottom: var(--bottom-nav-height);
        }

        @media (min-width: 768px) {
          .app-main {
            padding-bottom: 0;
          }
        }
      `}</style>
    </div>
  );
}
