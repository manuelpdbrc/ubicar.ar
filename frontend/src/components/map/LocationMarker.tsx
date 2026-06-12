import { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { Location } from '../../types';

interface LocationMarkerProps {
  location: Location;
  isSelected?: boolean;
  onClick?: (location: Location) => void;
  onNavigate?: (location: Location) => void;
  onEdit?: (location: Location) => void;
  onHistory?: (location: Location) => void;
  onAddVisit?: (location: Location) => void;
}

/** Create a colored SVG pin marker icon */
function createPinIcon(color: string, isSelected: boolean): L.DivIcon {
  const size = isSelected ? 40 : 32;
  const anchorY = isSelected ? 40 : 32;

  return L.divIcon({
    className: 'custom-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, anchorY],
    popupAnchor: [0, -anchorY + 4],
    html: `
      <svg viewBox="0 0 64 64" width="${size}" height="${size}" fill="none">
        <path d="M32 4C20.954 4 12 12.954 12 24c0 14 20 36 20 36s20-22 20-36C52 12.954 43.046 4 32 4z"
          fill="${color}"
          stroke="${isSelected ? '#fff' : 'none'}"
          stroke-width="${isSelected ? 3 : 0}"
          filter="${isSelected ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))' : 'drop-shadow(0 1px 3px rgba(0,0,0,0.25))'}"
        />
        <circle cx="32" cy="24" r="8" fill="#fff" opacity="0.9"/>
      </svg>
    `,
  });
}

export function LocationMarker({ 
  location, 
  isSelected = false, 
  onClick,
  onNavigate,
  onEdit,
  onHistory,
  onAddVisit
}: LocationMarkerProps) {
  const color = location.category?.color || '#6366F1';

  const icon = useMemo(
    () => createPinIcon(color, isSelected),
    [color, isSelected]
  );

  return (
    <Marker
      position={[location.latitude, location.longitude]}
      icon={icon}
      eventHandlers={{
        click: () => onClick?.(location),
      }}
    >
      <Popup autoPan={false}>
        <div style={{ fontFamily: 'Inter, sans-serif', minWidth: '160px' }}>
          {location.imageUrl && (
            <div style={{ marginBottom: '0.5rem', borderRadius: '4px', overflow: 'hidden', height: '100px' }}>
              <img src={location.imageUrl} alt={location.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          <strong style={{ fontSize: '0.875rem' }}>{location.name}</strong>
          {location.category && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.25rem' }}>
              <span
                style={{
                  width: '0.5rem',
                  height: '0.5rem',
                  borderRadius: '50%',
                  backgroundColor: color,
                  display: 'inline-block',
                }}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                {location.category.name}
              </span>
            </div>
          )}
          <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '0.25rem', marginBottom: '0.75rem' }}>
            {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
          </div>
          
          <div style={{ display: 'flex', gap: '0.125rem', alignItems: 'center', flexShrink: 0, justifyContent: 'flex-start', marginLeft: '-0.375rem' }}>
            {onAddVisit && (
              <button
                className="btn btn-ghost btn-icon btn-sm"
                style={{ width: '28px', height: '28px', minHeight: '28px', color: 'var(--color-primary)' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onAddVisit(location);
                }}
                title="Registrar visita"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
              </button>
            )}
            {onHistory && (
              <button
                className="btn btn-ghost btn-icon btn-sm"
                style={{ width: '28px', height: '28px', minHeight: '28px', color: 'var(--color-text-secondary)' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onHistory(location);
                }}
                title="Historial de visitas"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </button>
            )}
            {onEdit && (
              <button
                className="btn btn-ghost btn-icon btn-sm"
                style={{ width: '28px', height: '28px', minHeight: '28px', color: 'var(--color-text-secondary)' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(location);
                }}
                title="Editar ubicación"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                </svg>
              </button>
            )}
            {onNavigate && (
              <button
                className="btn btn-ghost btn-icon btn-sm"
                style={{ width: '28px', height: '28px', minHeight: '28px', color: 'var(--color-text-secondary)' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate(location);
                }}
                title="Navegar con Google Maps"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                </svg>
              </button>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
