import { LocationCard } from './LocationCard';
import { EmptyState } from '../ui/EmptyState';
import { Skeleton } from '../ui/Skeleton';
import type { Location } from '../../types';

interface LocationListProps {
  locations: Location[];
  isLoading?: boolean;
  onLocationClick?: (location: Location) => void;
  onNavigate?: (location: Location) => void;
  onAddClick?: () => void;
  distances?: Map<number, number>;
}

export function LocationList({
  locations,
  isLoading,
  onLocationClick,
  onNavigate,
  onAddClick,
  distances,
}: LocationListProps) {
  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" height="5rem" />
        ))}
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <EmptyState
        icon="📍"
        title="Sin ubicaciones"
        description="Creá tu primera ubicación para empezar a mapear"
        action={onAddClick ? { label: 'Crear ubicación', onClick: onAddClick } : undefined}
      />
    );
  }

  // Sort by distance if available
  const sorted = distances
    ? [...locations].sort((a, b) => (distances.get(a.id) ?? Infinity) - (distances.get(b.id) ?? Infinity))
    : locations;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {sorted.map((location, index) => (
        <div
          key={location.id}
          className="stagger-1"
          style={{ animationDelay: `${Math.min(index, 10) * 0.03}s` }}
        >
          <LocationCard
            location={location}
            onClick={onLocationClick}
            onNavigate={onNavigate}
            distance={distances?.get(location.id) ?? null}
          />
        </div>
      ))}
    </div>
  );
}
