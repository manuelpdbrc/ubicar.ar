import { useState, useRef } from 'react';
import { Button } from '../ui/Button';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';

interface VisitFormProps {
  locationId: number;
  circuitId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function VisitForm({ locationId, circuitId, onSuccess, onCancel }: VisitFormProps) {
  const { showToast } = useToast();
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Future proofing: dynamic form data state
  const [formData, setFormData] = useState<Record<string, any>>({});

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setImages(prev => [...prev, ...newFiles]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      const data = new FormData();
      data.append('locationId', locationId.toString());
      data.append('type', circuitId ? 'CIRCUIT' : 'SPONTANEOUS');
      
      if (circuitId) {
        data.append('circuitId', circuitId.toString());
      }
      
      if (comment.trim()) {
        data.append('comment', comment.trim());
      }

      if (Object.keys(formData).length > 0) {
        data.append('formData', JSON.stringify(formData));
      }

      images.forEach(img => {
        data.append('images', img);
      });

      await api.upload('/api/visits', data);

      showToast('Visita registrada correctamente', 'success');
      onSuccess();
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="visit-form">
      <div className="form-content">
        {/* Future proofing: Dynamic fields could be rendered here based on circuit schema */}
        {/* <DynamicFields schema={circuitSchema} value={formData} onChange={setFormData} /> */}

        <div className="form-group">
          <label className="input-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            Notas y Comentarios
          </label>
          <textarea
            className="input-field"
            rows={4}
            placeholder="Observaciones de la visita..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={{ width: '100%', resize: 'vertical' }}
          />
        </div>

        <div className="form-group">
          <label className="input-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            Fotografías
          </label>
          
          <div className="image-preview-list" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            {images.map((file, index) => (
              <div key={index} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                <img 
                  src={URL.createObjectURL(file)} 
                  alt={`Preview ${index}`} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px' }}
                >
                  ✕
                </button>
              </div>
            ))}
            
            {images.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-md)', border: '2px dashed var(--color-border)', background: 'var(--color-bg-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <span style={{ fontSize: '10px', marginTop: '4px' }}>Agregar</span>
              </button>
            )}
          </div>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            multiple
            capture="environment"
            style={{ display: 'none' }}
          />
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
            Podés adjuntar hasta 5 fotos o tomarlas con tu cámara.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
        <Button type="button" variant="ghost" onClick={onCancel} style={{ flex: 1 }}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting} style={{ flex: 2 }}>
          Guardar Visita
        </Button>
      </div>
    </form>
  );
}
