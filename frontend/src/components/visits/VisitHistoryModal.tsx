import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import type { Visit } from '../../types';

interface VisitHistoryModalProps {
  locationId: number;
  locationName: string;
  isOpen: boolean;
  onClose: () => void;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short'
  });
}

export function VisitHistoryModal({ locationId, locationName, isOpen, onClose }: VisitHistoryModalProps) {
  const { showToast } = useToast();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    const fetchVisits = async () => {
      try {
        setIsLoading(true);
        const res = await api.get<Visit[]>(`/api/locations/${locationId}/visits`);
        if (mounted) {
          setVisits(res);
        }
      } catch (error) {
        if (mounted) {
          showToast('Error al cargar historial', 'error');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchVisits();
    return () => { mounted = false; };
  }, [locationId, isOpen, showToast]);

  if (!isOpen) return null;

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div 
        style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} 
        onClick={onClose}
      />
      
      <div 
        className="animate-slideUp"
        style={{ 
          position: 'relative', 
          width: '100%', 
          maxWidth: '600px', 
          backgroundColor: 'var(--color-bg)', 
          borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Historial de Visitas</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>{locationName}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>✕</button>
        </div>

        <div style={{ padding: '1rem', overflowY: 'auto', flex: 1 }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>Cargando...</div>
          ) : visits.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
              No hay visitas registradas aún.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {visits.map(visit => (
                <div key={visit.id} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{visit.user?.name || visit.user?.email || 'Usuario'}</div>
                    <div style={{ color: 'var(--color-text-tertiary)', fontSize: '0.8125rem' }}>{formatDate(visit.dateTimestamp)}</div>
                  </div>
                  
                  {visit.comment && (
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem', whiteSpace: 'pre-wrap' }}>
                      {visit.comment}
                    </div>
                  )}

                  {visit.formData && Object.keys(visit.formData).length > 0 && (
                    <div style={{ fontSize: '0.8125rem', background: 'var(--color-bg-secondary)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem' }}>
                      <strong>Datos recolectados:</strong>
                      <pre style={{ margin: 0, fontFamily: 'inherit' }}>{JSON.stringify(visit.formData, null, 2)}</pre>
                    </div>
                  )}

                  {visit.images && visit.images.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                      {visit.images.map(img => (
                        <img 
                          key={img.id}
                          src={import.meta.env.VITE_API_URL + img.imageUrl}
                          alt="Foto visita"
                          style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', cursor: 'pointer', border: '1px solid var(--color-border-light)' }}
                          onClick={() => setSelectedImage(import.meta.env.VITE_API_URL + img.imageUrl)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image Viewer Overlay */}
      {selectedImage && (
        <div 
          style={{ position: 'fixed', inset: 0, zIndex: 10000, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setSelectedImage(null)}
        >
          <button style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'white', fontSize: '2rem', cursor: 'pointer' }}>✕</button>
          <img src={selectedImage} alt="Visita ampliada" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
        </div>
      )}
    </div>,
    document.body
  );
}
