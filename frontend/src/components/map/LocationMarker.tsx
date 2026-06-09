import { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { Location } from '../../types';

interface LocationMarkerProps {
  location: Location;
  isSelected?: boolean;
  onClick?: (location: Location) => void;
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

export function LocationMarker({ location, isSelected = false, onClick }: LocationMarkerProps) {
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
      <Popup>
        <div style={{ fontFamily: 'Inter, sans-serif', minWidth: '160px' }}>
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
          <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '0.25rem' }}>
            {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
