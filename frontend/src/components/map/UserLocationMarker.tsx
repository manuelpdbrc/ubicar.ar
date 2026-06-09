import { CircleMarker, Circle } from 'react-leaflet';

interface UserLocationMarkerProps {
  lat: number;
  lng: number;
  accuracy?: number;
}

export function UserLocationMarker({ lat, lng, accuracy }: UserLocationMarkerProps) {
  return (
    <>
      {/* Accuracy circle */}
      {accuracy && accuracy < 500 && (
        <Circle
          center={[lat, lng]}
          radius={accuracy}
          pathOptions={{
            color: '#6366F1',
            fillColor: '#6366F1',
            fillOpacity: 0.06,
            weight: 1,
            opacity: 0.2,
          }}
        />
      )}

      {/* Outer pulse ring */}
      <CircleMarker
        center={[lat, lng]}
        radius={16}
        pathOptions={{
          color: '#6366F1',
          fillColor: '#6366F1',
          fillOpacity: 0.12,
          weight: 1.5,
          opacity: 0.3,
        }}
        className="user-pulse"
      />

      {/* Inner dot */}
      <CircleMarker
        center={[lat, lng]}
        radius={7}
        pathOptions={{
          color: '#FFFFFF',
          fillColor: '#6366F1',
          fillOpacity: 1,
          weight: 3,
          opacity: 1,
        }}
      />

      <style>{`
        @keyframes userPulse {
          0% { opacity: 0.4; transform: scale(1); }
          70% { opacity: 0; transform: scale(2.5); }
          100% { opacity: 0; transform: scale(2.5); }
        }

        .user-pulse path {
          animation: userPulse 2s ease-out infinite;
          transform-origin: center;
        }
      `}</style>
    </>
  );
}
