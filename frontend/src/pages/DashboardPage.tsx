import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
import { VisitHistoryModal } from '../components/visits/VisitHistoryModal';
import { VisitFormModal } from '../components/visits/VisitFormModal';
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
  const [historyLocation, setHistoryLocation] = useState<Location | null>(null);
  const [addVisitLocation, setAddVisitLocation] = useState<Location | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [initialFormCoords, setInitialFormCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [currentMapCenter, setCurrentMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [isListExpanded, setIsListExpanded] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    setPortalElement(document.getElementById('sidebar-map-portal'));
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const userPosition = useMemo(
    () => (geo.latitude && geo.longitude ? { lat: geo.latitude, lng: geo.longitude } : null),
    [geo.latitude, geo.longitude]
  );

  const categories = useMemo(() => {
    const map = new Map<number, { id: number; name: string; color: string }>();
    locations.forEach(l => {
      if (l.category) {
        map.set(l.category.id, l.category);
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [locations]);

  const filteredLocations = useMemo(() => {
    if (!selectedCategoryId) return locations;
    return locations.filter(l => l.category?.id === selectedCategoryId);
  }, [locations, selectedCategoryId]);

  const distances = useMemo(
    () => (userPosition ? computeDistances(userPosition.lat, userPosition.lng, filteredLocations) : undefined),
    [userPosition, filteredLocations]
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

  const handleMapCenterChange = useCallback((lat: number, lng: number) => {
    setCurrentMapCenter({ lat, lng });
  }, []);

  const locationPanel = (
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
      <div className={styles.panelHeader} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className={styles.panelTitle}>Ubicaciones</h2>
          <Button variant="ghost" size="sm" onClick={() => setShowCategoryManager(true)} title="Gestionar categorías" style={{ padding: '0.25rem' }}>
            🏷️
          </Button>
        </div>
        
        <div style={{ marginTop: '0.5rem', marginBottom: '0.25rem' }}>
          <select
            className="input"
            style={{ width: '100%', padding: '0.25rem 0.5rem', fontSize: '0.8rem', height: 'auto', minHeight: '32px' }}
            value={selectedCategoryId || ''}
            onChange={(e) => setSelectedCategoryId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Todas las categorías</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <p className={styles.panelSubtitle}>
          {filteredLocations.length} ubicación{filteredLocations.length !== 1 ? 'es' : ''}
          {userPosition && !geo.error && ' · Ordenadas por cercanía'}
        </p>
      </div>

      {/* Location List */}
      <div className={styles.panelContent}>
        <LocationList
          locations={filteredLocations}
          isLoading={isLoading}
          onLocationClick={handleLocationClick}
          onNavigate={handleNavigate}
          onEdit={handleEditLocation}
          onHistory={setHistoryLocation}
          onAddVisit={setAddVisitLocation}
          onAddClick={handleAddNew}
          distances={distances}
        />
      </div>
    </div>
  );

  return (
    <div className={styles.page}>
      {/* Map Area */}
      <div className={styles.mapArea}>
        <MapView
          locations={filteredLocations}
          userPosition={userPosition}
          onLocationClick={handleMapLocationClick}
          onMapClick={handleMapClick}
          onCenterChange={handleMapCenterChange}
          selectedLocationId={selectedLocationId}
          onEdit={handleEditLocation}
          onHistory={setHistoryLocation}
          onNavigate={handleNavigate}
          onAddVisit={setAddVisitLocation}
        />

        {/* Floating action buttons */}
        <div className={styles.fab}>
          <Button variant="primary" onClick={handleAddNew} className={styles.fabButton}>
            + Nueva ubicación
          </Button>
        </div>
      </div>

      {/* Location Panel (Portal on desktop, Bottom Sheet on mobile) */}
      {isDesktop && portalElement ? createPortal(locationPanel, portalElement) : locationPanel}

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

      {historyLocation && (
        <VisitHistoryModal
          locationId={historyLocation.id}
          locationName={historyLocation.name}
          isOpen={true}
          onClose={() => setHistoryLocation(null)}
        />
      )}

      {addVisitLocation && (
        <VisitFormModal
          locationId={addVisitLocation.id}
          locationName={addVisitLocation.name}
          isOpen={true}
          onClose={() => setAddVisitLocation(null)}
          onSuccess={() => {
            // Optional: Reload logic or show toast (already handled inside VisitForm)
            loadLocations(); // Refresh to update visits count or cache
          }}
        />
      )}
    </div>
  );
}
