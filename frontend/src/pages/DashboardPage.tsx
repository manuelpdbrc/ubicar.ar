import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { computeDistances, openGoogleMapsNavigation } from '../lib/geo';
import { useGeolocation } from '../hooks/useGeolocation';
import { Button } from '../components/ui/Button';
import { LocationList } from '../components/locations/LocationList';
import { LocationForm } from '../components/locations/LocationForm';
import { CategoryManager } from '../components/categories/CategoryManager';
import { MapView } from '../components/map/MapView';
import type { Location, PaginatedResponse } from '../types';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const geo = useGeolocation({ watch: true });

  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [editLocation, setEditLocation] = useState<Location | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [initialFormCoords, setInitialFormCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [currentMapCenter, setCurrentMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [isListExpanded, setIsListExpanded] = useState(false);

  const userPosition = useMemo(
    () => (geo.latitude && geo.longitude ? { lat: geo.latitude, lng: geo.longitude } : null),
    [geo.latitude, geo.longitude]
  );

  const distances = useMemo(
    () => (userPosition ? computeDistances(userPosition.lat, userPosition.lng, locations) : undefined),
    [userPosition, locations]
  );

  const loadLocations = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get<PaginatedResponse<Location>>('/api/locations');
      setLocations(res.data);
    } catch {
      showToast('Error al cargar ubicaciones', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  function handleLocationSuccess(location: Location) {
    setLocations((prev) => {
      const idx = prev.findIndex((l) => l.id === location.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = location;
        return updated;
      }
      return [location, ...prev];
    });
    setInitialFormCoords(null);
  }

  function handleLocationClick(location: Location) {
    setSelectedLocationId(location.id);
  }

  function handleEditLocation(location: Location) {
    setSelectedLocationId(location.id);
    setEditLocation(location);
    setShowLocationForm(true);
  }

  function handleMapLocationClick(location: Location) {
    setSelectedLocationId((prev) => (prev === location.id ? null : location.id));
  }

  function handleMapClick(lat: number, lng: number) {
    setInitialFormCoords({ lat, lng });
    setEditLocation(null);
    setShowLocationForm(true);
  }

  function handleNavigate(location: Location) {
    openGoogleMapsNavigation(location.latitude, location.longitude);
  }

  function handleLinkQR(location: Location) {
    navigate(`/scanner?linkLocationId=${location.id}`);
  }

  function handleAddNew() {
    setEditLocation(null);
    setInitialFormCoords(currentMapCenter);
    setShowLocationForm(true);
  }

  return (
    <div className={styles.page}>
      {/* Map Area */}
      <div className={styles.mapArea}>
        <MapView
          locations={locations}
          userPosition={userPosition}
          onLocationClick={handleMapLocationClick}
          onMapClick={handleMapClick}
          onCenterChange={(lat, lng) => setCurrentMapCenter({ lat, lng })}
          selectedLocationId={selectedLocationId}
        />

        {/* Floating action buttons */}
        <div className={styles.fab}>
          <Button variant="primary" onClick={handleAddNew} className={styles.fabButton}>
            + Nueva ubicación
          </Button>
        </div>
      </div>

      {/* Location Panel */}
      <div className={`${styles.panel} ${isListExpanded ? styles.panelExpanded : ''}`}>
        {/* Mobile drag handle */}
        <button
          className={styles.dragHandle}
          onClick={() => setIsListExpanded(!isListExpanded)}
          aria-label={isListExpanded ? 'Colapsar panel' : 'Expandir panel'}
        >
          <span className={styles.dragBar} />
        </button>

        {/* Panel Header */}
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>Ubicaciones</h2>
            <p className={styles.panelSubtitle}>
              {locations.length} ubicación{locations.length !== 1 ? 'es' : ''}
              {userPosition && !geo.error && ' · Ordenadas por cercanía'}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowCategoryManager(true)}>
            🏷️
          </Button>
        </div>

        {/* Location List */}
        <div className={styles.panelContent}>
          <LocationList
            locations={locations}
            isLoading={isLoading}
            onLocationClick={handleLocationClick}
            onNavigate={handleNavigate}
            onEdit={handleEditLocation}
            onAddClick={handleAddNew}
            distances={distances}
          />
        </div>
      </div>

      {/* Modals */}
      <LocationForm
        isOpen={showLocationForm}
        onClose={() => { setShowLocationForm(false); setEditLocation(null); setInitialFormCoords(null); }}
        onSuccess={handleLocationSuccess}
        editLocation={editLocation}
        initialLat={initialFormCoords?.lat}
        initialLng={initialFormCoords?.lng}
      />

      <CategoryManager
        isOpen={showCategoryManager}
        onClose={() => setShowCategoryManager(false)}
      />
    </div>
  );
}
