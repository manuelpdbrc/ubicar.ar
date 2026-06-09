/**
 * Geolocation utility functions
 */

const EARTH_RADIUS_M = 6_371_000; // meters

/** Convert degrees to radians */
function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Haversine distance between two coordinates in meters
 */
export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

/**
 * Build a Map of locationId → distance (meters) from a reference point
 */
export function computeDistances(
  refLat: number,
  refLng: number,
  locations: Array<{ id: number; latitude: number; longitude: number }>,
): Map<number, number> {
  const map = new Map<number, number>();
  for (const loc of locations) {
    map.set(loc.id, haversineDistance(refLat, refLng, loc.latitude, loc.longitude));
  }
  return map;
}

/**
 * Format a distance in meters to a human-readable string
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  if (meters < 10_000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters / 1000)} km`;
}

/**
 * Open Google Maps navigation to a coordinate
 */
export function openGoogleMapsNavigation(lat: number, lng: number): void {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}
