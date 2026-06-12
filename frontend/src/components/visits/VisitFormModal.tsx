import { createPortal } from 'react-dom';
import { VisitForm } from './VisitForm';

interface VisitFormModalProps {
  locationId: number;
  locationName: string;
  circuitId?: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function VisitFormModal({ locationId, locationName, circuitId, isOpen, onClose, onSuccess }: VisitFormModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div 
        style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} 
        onClick={onClose}
      />
      
      <div 
        className="animate-slideUp"
        style={{ 
          position: 'relative', 
          width: '100%', 
          maxWidth: '500px', 
          backgroundColor: 'var(--color-bg)', 
          borderRadius: 'var(--radius-lg)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          margin: '1rem',
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
        }}
      >
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Registrar Visita</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>{locationName}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>✕</button>
        </div>

        <div style={{ padding: '1.25rem', overflowY: 'auto' }}>
          <VisitForm
            locationId={locationId}
            circuitId={circuitId}
            onSuccess={() => {
              onSuccess();
              onClose();
            }}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
