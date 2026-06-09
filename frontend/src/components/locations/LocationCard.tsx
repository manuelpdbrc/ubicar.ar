import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { Location } from '../../types';

interface LocationCardProps {
  location: Location;
  onClick?: (location: Location) => void;
  onNavigate?: (location: Location) => void;
  distance?: number | null;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function LocationCard({ location, onClick, onNavigate, distance }: LocationCardProps) {
  const categoryColor = location.category?.color || '#6366F1';

  return (
    <Card
      hoverable
      compact
      onClick={onClick ? () => onClick(location) : undefined}
      className="animate-fadeInUp"
    >
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        {/* Category color dot */}
        <div
          style={{
            width: '2.5rem',
            height: '2.5rem',
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
              width: '0.75rem',
              height: '0.75rem',
              borderRadius: '50%',
              backgroundColor: categoryColor,
            }}
          />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h4 className="truncate" style={{ fontSize: '0.9375rem', fontWeight: 600 }}>
              {location.name}
            </h4>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {location.category && (
              <Badge variant="primary">{location.category.name}</Badge>
            )}
            {distance != null && (
              <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                📍 {formatDistance(distance)}
              </span>
            )}
          </div>

          <p className="text-xs truncate" style={{ color: 'var(--color-text-tertiary)', marginTop: '0.375rem' }}>
            {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
          </p>
        </div>

        {/* Navigate button */}
        {onNavigate && (
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(location);
            }}
            title="Navegar con Google Maps"
            aria-label={`Navegar a ${location.name}`}
          >
            🧭
          </button>
        )}
      </div>

      <style>{`
        .location-card__image {
          width: 3.5rem;
          height: 3.5rem;
          border-radius: var(--radius-md);
          object-fit: cover;
          flex-shrink: 0;
        }
      `}</style>
    </Card>
  );
}
