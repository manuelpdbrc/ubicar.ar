import { Card } from '../ui/Card';
import type { Location } from '../../types';

interface LocationCardProps {
  location: Location;
  onClick?: (location: Location) => void;
  onNavigate?: (location: Location) => void;
  onEdit?: (location: Location) => void;
  onHistory?: (location: Location) => void;
  onAddVisit?: (location: Location) => void;
  distance?: number | null;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function LocationCard({ location, onClick, onNavigate, onEdit, onHistory, onAddVisit, distance }: LocationCardProps) {
  const categoryColor = location.category?.color || '#6366F1';

  return (
    <Card
      hoverable
      compact
      onClick={onClick ? () => onClick(location) : undefined}
      className="animate-fadeInUp"
      style={{ padding: '0.25rem 0.5rem' }}
    >
      <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
        {/* Category color dot */}
        <div
          style={{
            width: '1.25rem',
            height: '1.25rem',
            borderRadius: 'var(--radius-md)',
            background: `${categoryColor}18`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: '0.4rem',
              height: '0.4rem',
              borderRadius: '50%',
              backgroundColor: categoryColor,
            }}
          />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <h4 className="truncate" style={{ fontSize: '0.75rem', fontWeight: 600, margin: 0, flexShrink: 1 }}>
            {location.name}
          </h4>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
            {distance != null && (
              <span style={{ fontSize: '0.65rem', fontWeight: 500, color: 'var(--color-text-tertiary)' }}>
                {formatDistance(distance)}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.125rem', alignItems: 'center', flexShrink: 0 }}>
          {onAddVisit && (
            <button
              className="btn btn-ghost btn-icon"
              style={{ width: '24px', height: '24px', minHeight: '24px', color: 'var(--color-primary)' }}
              onClick={(e) => {
                e.stopPropagation();
                onAddVisit(location);
              }}
              title="Registrar visita"
              aria-label={`Registrar visita en ${location.name}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
            </button>
          )}
          {onHistory && (
            <button
              className="btn btn-ghost btn-icon"
              style={{ width: '24px', height: '24px', minHeight: '24px', color: 'var(--color-text-secondary)' }}
              onClick={(e) => {
                e.stopPropagation();
                onHistory(location);
              }}
              title="Historial de visitas"
              aria-label={`Ver historial de ${location.name}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </button>
          )}
          {onEdit && (
            <button
              className="btn btn-ghost btn-icon"
              style={{ width: '24px', height: '24px', minHeight: '24px', color: 'var(--color-text-secondary)' }}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(location);
              }}
              title="Editar ubicación"
              aria-label={`Editar ${location.name}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </button>
          )}
          {onNavigate && (
            <button
              className="btn btn-ghost btn-icon"
              style={{ width: '24px', height: '24px', minHeight: '24px', color: 'var(--color-text-secondary)' }}
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(location);
              }}
              title="Navegar con Google Maps"
              aria-label={`Navegar a ${location.name}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
              </svg>
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
