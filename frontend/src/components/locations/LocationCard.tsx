import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { Location } from '../../types';

interface LocationCardProps {
  location: Location;
  onClick?: (location: Location) => void;
  onNavigate?: (location: Location) => void;
  onEdit?: (location: Location) => void;
  onHistory?: (location: Location) => void;
  distance?: number | null;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function LocationCard({ location, onClick, onNavigate, onEdit, onHistory, distance }: LocationCardProps) {
  const categoryColor = location.category?.color || '#6366F1';

  return (
    <Card
      hoverable
      compact
      onClick={onClick ? () => onClick(location) : undefined}
      className="animate-fadeInUp"
      style={{ padding: '0.375rem 0.75rem' }}
    >
      <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
        {/* Category color dot */}
        <div
          style={{
            width: '1.5rem',
            height: '1.5rem',
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
              width: '0.5rem',
              height: '0.5rem',
              borderRadius: '50%',
              backgroundColor: categoryColor,
            }}
          />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <h4 className="truncate" style={{ fontSize: '0.875rem', fontWeight: 600, margin: 0, flexShrink: 1 }}>
            {location.name}
          </h4>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
            {location.category && (
              <Badge variant="primary" style={{ padding: '0.125rem 0.25rem', fontSize: '0.65rem' }}>
                {location.category.name}
              </Badge>
            )}
            {distance != null && (
              <span className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                {formatDistance(distance)}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.125rem', alignItems: 'center', flexShrink: 0 }}>
          {onHistory && (
            <button
              className="btn btn-ghost btn-icon"
              style={{ width: '28px', height: '28px', minHeight: '28px', color: 'var(--color-text-secondary)' }}
              onClick={(e) => {
                e.stopPropagation();
                onHistory(location);
              }}
              title="Historial de visitas"
              aria-label={`Ver historial de ${location.name}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </button>
          )}
          {onEdit && (
            <button
              className="btn btn-ghost btn-icon"
              style={{ width: '28px', height: '28px', minHeight: '28px', color: 'var(--color-text-secondary)' }}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(location);
              }}
              title="Editar ubicación"
              aria-label={`Editar ${location.name}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </button>
          )}
          {onNavigate && (
            <button
              className="btn btn-ghost btn-icon"
              style={{ width: '28px', height: '28px', minHeight: '28px', color: 'var(--color-text-secondary)' }}
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(location);
              }}
              title="Navegar con Google Maps"
              aria-label={`Navegar a ${location.name}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
              </svg>
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
