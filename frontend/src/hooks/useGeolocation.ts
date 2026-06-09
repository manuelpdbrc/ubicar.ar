import { useState, useEffect, useCallback, useRef } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  isLoading: boolean;
  isSupported: boolean;
}

interface UseGeolocationOptions {
  /** Enable continuous GPS tracking (default: true) */
  watch?: boolean;
  /** High accuracy mode — uses GPS instead of network (default: true) */
  highAccuracy?: boolean;
  /** Maximum age of cached position in ms (default: 30000) */
  maxAge?: number;
  /** Timeout for getting position in ms (default: 15000) */
  timeout?: number;
}

export function useGeolocation(options: UseGeolocationOptions = {}): GeolocationState & { refresh: () => void } {
  const {
    watch = true,
    highAccuracy = true,
    maxAge = 30_000,
    timeout = 15_000,
  } = options;

  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    isLoading: true,
    isSupported: 'geolocation' in navigator,
  });

  const watchIdRef = useRef<number | null>(null);

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    setState({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      error: null,
      isLoading: false,
      isSupported: true,
    });
  }, []);

  const handleError = useCallback((error: GeolocationPositionError) => {
    let message: string;
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = 'Permiso de ubicación denegado';
        break;
      case error.POSITION_UNAVAILABLE:
        message = 'Ubicación no disponible';
        break;
      case error.TIMEOUT:
        message = 'Tiempo de espera agotado';
        break;
      default:
        message = 'Error de geolocalización';
    }
    setState((prev) => ({
      ...prev,
      error: message,
      isLoading: false,
    }));
  }, []);

  const geoOptions: PositionOptions = {
    enableHighAccuracy: highAccuracy,
    maximumAge: maxAge,
    timeout,
  };

  // Start watching / get position
  useEffect(() => {
    if (!state.isSupported) {
      setState((prev) => ({ ...prev, isLoading: false, error: 'Geolocalización no soportada' }));
      return;
    }

    if (watch) {
      watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, geoOptions);
    } else {
      navigator.geolocation.getCurrentPosition(handleSuccess, handleError, geoOptions);
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch, highAccuracy]);

  const refresh = useCallback(() => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, geoOptions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ...state, refresh };
}
