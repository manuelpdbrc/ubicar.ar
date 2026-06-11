import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import type { Location } from '../types';

export function ScanPage() {
  const { code } = useParams();
  const { isAuthenticated } = useAuth();
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        // This is a public endpoint, no auth required
        const res = await api.get<Location>(`/api/locations/code/${code}`);
        setLocation(res.data);
      } catch (err: any) {
        setError(err.message || 'Error al cargar la ubicación');
      } finally {
        setIsLoading(false);
      }
    }
    if (code) load();
  }, [code]);

  if (isLoading) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column' }}>
        <div className="spinner spinner-lg" style={{ marginBottom: '1rem' }} />
        <p>Buscando ubicación...</p>
      </div>
    );
  }

  if (error || !location) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: '1rem', padding: '2rem', textAlign: 'center' }}>
        <span style={{ fontSize: '3rem' }}>❓</span>
        <h2>Código No Asignado</h2>
        <p className="text-muted">
          {error === 'Ubicación no encontrada' 
            ? 'Este código QR aún no está asociado a ninguna ubicación. Si sos administrador, vinculalo desde la app.' 
            : (error || 'No se encontró la ubicación escaneada.')}
        </p>
        <Link to="/dashboard">
          <Button variant="primary">Ir a la App</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: '600px', margin: '0 auto', paddingTop: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--color-primary)', fontSize: '1.25rem', marginBottom: '0.25rem' }}>
          ubicar.ar
        </h1>
        <p className="text-xs text-muted" style={{ letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Locación Registrada
        </p>
      </div>

      <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        {location.imageUrl ? (
          <img
            src={api.getImageUrl(location.imageUrl)}
            alt={location.name}
            style={{ width: '100%', height: '250px', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: '100%', height: '200px', background: 'var(--color-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
            📍
          </div>
        )}

        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{location.name}</h2>
              {location.category && (
                <Badge variant="primary" style={{ backgroundColor: location.category.color, color: '#fff', border: 'none' }}>
                  {location.category.name}
                </Badge>
              )}
            </div>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {!isAuthenticated ? (
              <div style={{ background: 'var(--color-bg)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                  Iniciá sesión para registrar una visita a esta ubicación.
                </p>
                <Link to={`/login?returnUrl=/scan/${code}`} style={{ textDecoration: 'none' }}>
                  <Button variant="primary" style={{ width: '100%' }}>Iniciar Sesión</Button>
                </Link>
              </div>
            ) : (
              <Button variant="primary" size="lg" style={{ width: '100%' }}>
                📸 Registrar Visita
              </Button>
            )}
            
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <Button variant="outline" style={{ width: '100%' }}>
                🧭 Cómo llegar
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
