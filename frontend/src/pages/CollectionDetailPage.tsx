import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { LocationCard } from '../components/locations/LocationCard';
import { MapView } from '../components/map/MapView';
import { LocationMarker } from '../components/map/LocationMarker';
import { useGeolocation } from '../hooks/useGeolocation';
import { computeDistances } from '../lib/geo';
import type { Collection, Location, CollectionPermission } from '../types';

export function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [collection, setCollection] = useState<Collection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'locations' | 'permissions'>('locations');
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);

  const geo = useGeolocation({ watch: true });
  const userPosition = geo.latitude && geo.longitude ? { lat: geo.latitude, lng: geo.longitude } : null;

  // Permissions state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'EDITOR' | 'VIEWER'>('VIEWER');
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    loadCollection();
  }, [id]);

  async function loadCollection() {
    try {
      setIsLoading(true);
      const data = await api.get<Collection>(`/api/collections/${id}`);
      setCollection(data);
    } catch (err) {
      showToast('Error al cargar la colección', 'error');
      navigate('/collections');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRemoveLocation(loc: Location) {
    if (!confirm(`¿Quitar ${loc.name} de la colección?`)) return;
    try {
      await api.delete(`/api/collections/${id}/locations/${loc.id}`);
      setCollection(prev => prev ? {
        ...prev,
        locations: prev.locations?.filter(cl => cl.id !== loc.id)
      } : null);
      showToast('Ubicación removida', 'success');
      loadCollection(); // reload to get fresh data
    } catch (err) {
      showToast('Error al remover ubicación', 'error');
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      showToast('Email inválido', 'error');
      return;
    }

    setIsInviting(true);
    try {
      await api.post(`/api/collections/${id}/permissions`, { email: inviteEmail, role: inviteRole });
      showToast('Acceso actualizado', 'success');
      setInviteEmail('');
      loadCollection();
    } catch (err: any) {
      showToast(err.message || 'Error al actualizar acceso', 'error');
    } finally {
      setIsInviting(false);
    }
  }

  async function handleRemovePermission(email: string) {
    if (!confirm(`¿Revocar acceso a ${email}?`)) return;
    try {
      await api.delete(`/api/collections/${id}/permissions/${encodeURIComponent(email)}`);
      showToast('Acceso revocado', 'success');
      loadCollection();
    } catch (err) {
      showToast('Error al revocar acceso', 'error');
    }
  }

  async function handleDeleteCollection() {
    if (!confirm('¿Estás seguro de eliminar esta colección por completo?')) return;
    try {
      await api.delete(`/api/collections/${id}`);
      showToast('Colección eliminada', 'success');
      navigate('/collections');
    } catch (err) {
      showToast('Error al eliminar', 'error');
    }
  }

  if (isLoading) {
    return (
      <div className="animate-fadeIn" style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="skeleton" style={{ height: '40px', width: '30%', marginBottom: '1rem' }} />
        <div className="skeleton" style={{ height: '300px', borderRadius: 'var(--radius-lg)', marginBottom: '1rem' }} />
      </div>
    );
  }

  if (!collection) return null;

  const canEdit = collection.userRole === 'CREATOR' || collection.userRole === 'EDITOR';
  const isCreator = collection.userRole === 'CREATOR';
  const rawLocations = (collection.locations as any) || []; // Since the backend directly attached it
  
  const distances = userPosition ? computeDistances(userPosition.lat, userPosition.lng, rawLocations) : undefined;
  
  const sortedLocations = [...rawLocations].sort((a, b) => {
    if (!distances) return 0;
    return (distances.get(a.id) ?? Infinity) - (distances.get(b.id) ?? Infinity);
  });
  
  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1rem 0 1rem', background: 'var(--color-bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <button 
            onClick={() => navigate('/collections')}
            style={{ background: 'none', border: 'none', padding: '0.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{collection.name}</h1>
          <Badge variant={isCreator ? 'primary' : 'default'} style={{ marginLeft: 'auto' }}>
            {collection.userRole === 'CREATOR' ? 'Propietario' : collection.userRole === 'EDITOR' ? 'Editor' : 'Visualizador'}
          </Badge>
        </div>
        {collection.description && (
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1rem', paddingLeft: '2.5rem' }}>
            {collection.description}
          </p>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)' }}>
          <button
            onClick={() => setActiveTab('locations')}
            style={{
              padding: '0.75rem 1rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'locations' ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === 'locations' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontWeight: activeTab === 'locations' ? 600 : 400,
              cursor: 'pointer'
            }}
          >
            Ubicaciones ({rawLocations.length})
          </button>
          {(isCreator || collection.userRole === 'EDITOR') && (
            <button
              onClick={() => setActiveTab('permissions')}
              style={{
                padding: '0.75rem 1rem',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'permissions' ? '2px solid var(--color-primary)' : '2px solid transparent',
                color: activeTab === 'permissions' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontWeight: activeTab === 'permissions' ? 600 : 400,
                cursor: 'pointer'
              }}
            >
              Accesos
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--color-bg)', padding: '1rem' }}>
        {activeTab === 'locations' && (
          <>
            {/* Map */}
            {rawLocations.length > 0 && (
              <div style={{ height: '300px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '1rem', border: '1px solid var(--color-border)' }}>
                <MapView 
                  locations={rawLocations}
                  selectedLocationId={selectedLocationId || rawLocations[0].id}
                  userPosition={userPosition}
                  onLocationClick={(loc) => setSelectedLocationId(prev => prev === loc.id ? null : loc.id)}
                  fitAllLocations={true}
                />
              </div>
            )}

            {/* List */}
            {rawLocations.length === 0 ? (
              <EmptyState
                icon="📍"
                title="Sin ubicaciones"
                description="Aún no se han agregado ubicaciones a esta colección."
                actionLabel={canEdit ? "Ir al mapa" : undefined}
                onAction={canEdit ? () => navigate('/') : undefined}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {sortedLocations.map((loc: any) => (
                  <div key={loc.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <LocationCard
                        location={loc}
                        distance={distances?.get(loc.id) ?? null}
                        onClick={() => setSelectedLocationId(loc.id)}
                        onNavigate={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}`)}
                      />
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => handleRemoveLocation(loc)}
                        className="btn btn-ghost btn-icon btn-sm"
                        style={{ color: 'var(--color-error)' }}
                        title="Quitar de la colección"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'permissions' && (
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ padding: '1rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: '0 0 1rem 0' }}>Invitar usuario</h3>
              <form onSubmit={handleInvite} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <Input
                    label="Email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    required
                  />
                </div>
                <div className="form-group" style={{ width: '120px' }}>
                  <label className="input-label" style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.375rem', display: 'block' }}>Rol</label>
                  <select className="input-field" value={inviteRole} onChange={(e) => setInviteRole(e.target.value as any)} style={{ height: '42px' }}>
                    <option value="VIEWER">Visualizador</option>
                    <option value="EDITOR">Editor</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', height: '64px' }}>
                  <Button type="submit" variant="primary" isLoading={isInviting} style={{ height: '42px' }}>Invitar</Button>
                </div>
              </form>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '0.75rem' }}>
                Si el usuario no tiene cuenta, se le asignará el acceso automáticamente cuando se registre con ese email.
              </p>
            </div>

            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: '0 0 1rem 0' }}>Personas con acceso</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {collection.permissions?.map((p: any, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 500 }}>{p.name}</span>
                      {p.status === 'pending' && <Badge variant="warning">Pendiente</Badge>}
                    </div>
                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{p.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                      {p.role === 'CREATOR' ? 'Propietario' : p.role === 'EDITOR' ? 'Editor' : 'Visualizador'}
                    </span>
                    {p.role !== 'CREATOR' && isCreator && (
                      <button onClick={() => handleRemovePermission(p.email)} className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--color-error)' }} title="Revocar acceso">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {(!collection.permissions || collection.permissions.length === 0) && (
                <p style={{ color: 'var(--color-text-tertiary)', fontSize: '0.875rem' }}>Nadie más tiene acceso.</p>
              )}
            </div>

            {isCreator && (
              <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-error)', margin: '0 0 0.5rem 0' }}>Zona de Peligro</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
                  Eliminar la colección removerá todos los accesos. Las ubicaciones NO serán eliminadas de la base de datos.
                </p>
                <Button variant="outline" onClick={handleDeleteCollection} style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}>
                  Eliminar Colección
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
