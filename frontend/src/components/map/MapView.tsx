import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Location } from '../../types';
import { LocationMarker } from './LocationMarker';
import { UserLocationMarker } from './UserLocationMarker';

interface MapViewProps {
  locations: Location[];
  userPosition?: { lat: number; lng: number } | null;
  onLocationClick?: (location: Location) => void;
  onMapClick?: (lat: number, lng: number) => void;
  selectedLocationId?: number | null;
  className?: string;
}

/** Default center: Buenos Aires */
const DEFAULT_CENTER: LatLngExpression = [-34.6037, -58.3816];
const DEFAULT_ZOOM = 13;

/** Component to handle map panning when user position changes */
function FlyToUser({ position }: { position: { lat: number; lng: number } | null }) {
  const map = useMap();
  const hasFlyRef = useRef(false);

  useEffect(() => {
    if (position && !hasFlyRef.current) {
      map.flyTo([position.lat, position.lng], 15, { duration: 1.5 });
      hasFlyRef.current = true;
    }
  }, [map, position]);

  return null;
}

/** Component to handle map panning when a location is selected */
function FlyToLocation({ locationId, locations }: { locationId?: number | null, locations: Location[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (locationId) {
      const loc = locations.find(l => l.id === locationId);
      if (loc) {
        map.flyTo([loc.latitude, loc.longitude], 16, { duration: 1.0 });
      }
    }
  }, [locationId, locations, map]);

  return null;
}

/** Component to center map on user position when button is clicked */
function LocateControl({ position }: { position: { lat: number; lng: number } | null }) {
  const map = useMap();

  if (!position) return null;

  return (
    <div className="leaflet-bottom leaflet-right">
      <div className="leaflet-control leaflet-bar" style={{ margin: '10px' }}>
        <button
          onClick={(e) => {
            e.preventDefault();
            map.flyTo([position.lat, position.lng], 16, { duration: 1.0 });
          }}
          title="Centrar en mi ubicación"
          style={{
            width: '36px',
            height: '36px',
            backgroundColor: 'var(--color-surface)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary)',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
          </svg>
        </button>
      </div>
    </div>
  );
}

/** Component to handle map click events */
function MapClickHandler({ onClick }: { onClick?: (lat: number, lng: number) => void }) {
  const map = useMap();

  useEffect(() => {
    if (!onClick) return;

    const handler = (e: L.LeafletMouseEvent) => {
      onClick(e.latlng.lat, e.latlng.lng);
    };

    map.on('click', handler);
    return () => {
      map.off('click', handler);
    };
  }, [map, onClick]);

  return null;
}

export function MapView({
  locations,
  userPosition,
  onLocationClick,
  onMapClick,
  selectedLocationId,
  className = '',
}: MapViewProps) {
  const center: LatLngExpression = userPosition
    ? [userPosition.lat, userPosition.lng]
    : DEFAULT_CENTER;

  return (
    <div className={`map-container ${className}`}>
      <MapContainer
        center={center}
        zoom={DEFAULT_ZOOM}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        />

        {/* User GPS marker */}
        {userPosition && (
          <UserLocationMarker lat={userPosition.lat} lng={userPosition.lng} />
        )}

        {/* Location markers */}
        {locations.map((location) => (
          <LocationMarker
            key={location.id}
            location={location}
            isSelected={selectedLocationId === location.id}
            onClick={onLocationClick}
          />
        ))}

        {/* Fly to user on first position */}
        <FlyToUser position={userPosition ?? null} />

        {/* Fly to selected location */}
        <FlyToLocation locationId={selectedLocationId} locations={locations} />

        {/* Locate me button */}
        <LocateControl position={userPosition ?? null} />

        {/* Map click handler */}
        <MapClickHandler onClick={onMapClick} />
      </MapContainer>

      {/* Center crosshair */}
      {onMapClick && <div className="map-crosshair" aria-hidden="true" />}

      <style>{`
        .map-container {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: var(--radius-lg);
          overflow: hidden;
          background-color: var(--color-bg-secondary);
          isolation: isolate;
          z-index: 0;
        }

        .map-container .leaflet-container {
          font-family: inherit;
          border-radius: inherit;
        }

        .map-container .leaflet-control-zoom {
          border: none !important;
          box-shadow: var(--shadow-md) !important;
          border-radius: var(--radius-md) !important;
          overflow: hidden;
        }

        .map-container .leaflet-control-zoom a {
          background-color: var(--color-surface) !important;
          color: var(--color-text) !important;
          border-color: var(--color-border-light) !important;
          width: 36px !important;
          height: 36px !important;
          line-height: 36px !important;
          font-size: 1rem !important;
        }

        .map-container .leaflet-control-zoom a:hover {
          background-color: var(--color-surface-hover) !important;
        }

        /* ── Crosshair ── */
        .map-crosshair {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 28px;
          height: 28px;
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: 1000;
        }

        /* Vertical line */
        .map-crosshair::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          width: 2px;
          height: 100%;
          transform: translateX(-50%);
          background-color: rgba(99, 102, 241, 0.7);
          border-radius: 1px;
        }

        /* Horizontal line */
        .map-crosshair::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          width: 100%;
          height: 2px;
          transform: translateY(-50%);
          background-color: rgba(99, 102, 241, 0.7);
          border-radius: 1px;
        }
      `}</style>
    </div>
  );
}
