import { NavLink, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/dashboard', icon: '🗺️', label: 'Mapa' },
  { path: '/scanner', icon: '📷', label: 'Escanear' },
  { path: '/collections', icon: '📁', label: 'Colecciones' },
  { path: '/circuits', icon: '🔄', label: 'Circuitos' },
];

export function BottomNav() {
  const location = useLocation();

  // Don't show on auth pages
  if (['/login', '/register'].includes(location.pathname)) return null;
  if (location.pathname.startsWith('/scan/')) return null;

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Navegación principal">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`
          }
        >
          <span className="bottom-nav__icon">{item.icon}</span>
          <span className="bottom-nav__label">{item.label}</span>
        </NavLink>
      ))}

      <style>{`
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: var(--z-fixed);
          display: flex;
          align-items: stretch;
          height: var(--bottom-nav-height);
          padding-bottom: var(--safe-area-bottom);
          background-color: var(--color-surface);
          border-top: 1px solid var(--color-border-light);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .bottom-nav__item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.125rem;
          text-decoration: none;
          color: var(--color-text-tertiary);
          transition: color var(--transition-fast);
          position: relative;
          -webkit-tap-highlight-color: transparent;
        }

        .bottom-nav__item--active {
          color: var(--color-primary);
        }

        .bottom-nav__item--active::before {
          content: '';
          position: absolute;
          top: 0;
          left: 25%;
          right: 25%;
          height: 2.5px;
          background: var(--color-primary);
          border-radius: 0 0 var(--radius-full) var(--radius-full);
        }

        .bottom-nav__icon {
          font-size: 1.25rem;
          line-height: 1;
          transition: transform var(--transition-spring);
        }

        .bottom-nav__item--active .bottom-nav__icon {
          transform: scale(1.15) translateY(-1px);
        }

        .bottom-nav__label {
          font-size: 0.625rem;
          font-weight: 600;
          letter-spacing: 0.01em;
        }

        /* Hide on desktop */
        @media (min-width: 768px) {
          .bottom-nav {
            display: none;
          }
        }

        /* Hide when virtual keyboard is likely open (mobile) */
        @media (max-width: 767px) {
          body:has(input:not([type="radio"]):not([type="checkbox"]):not([type="file"]):focus, textarea:focus) .bottom-nav {
            display: none !important;
          }
        }
      `}</style>
    </nav>
  );
}
