'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { saveVisitOffline } from '@/lib/db';

export default function ScanPage() {
  const { code } = useParams();
  const { isAuthenticated, isLoading, token } = useAuth();
  const router = useRouter();
  
  const [location, setLocation] = useState<any>(null);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // In a real scenario, we might want to fetch location details from the backend if online.
    // For now, we simulate finding the location based on the code.
    if (!isLoading && !isAuthenticated) {
      // Guest view
      setLocation({ uniqueCode: code, name: 'Punto Registrado (Inicia sesión para ver)' });
    } else if (isAuthenticated) {
      // Authenticated view - typically we'd fetch location details here
      setLocation({ uniqueCode: code, name: 'Punto de Auditoría' });
    }
  }, [code, isAuthenticated, isLoading]);

  const handleVisitLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    try {
      const isOnline = navigator.onLine;

      if (isOnline && token) {
        // Online Sync
        const formData = new FormData();
        formData.append('uniqueCode', code as string);
        formData.append('type', 'SPONTANEOUS');
        formData.append('comment', comment);
        if (image) {
          formData.append('image', image);
        }

        const res = await fetch('/api/visits/log', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });

        if (!res.ok) throw new Error('Error al registrar visita');
      } else {
        // Offline Sync queue
        await saveVisitOffline({
          uniqueCode: code as string,
          type: 'SPONTANEOUS',
          comment,
          dateTimestamp: new Date().toISOString(),
          imageBlob: image ? image : undefined,
          hasImage: !!image
        });
      }

      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (isLoading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando...</div>;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>Escaner de Locación</h2>
        
        {success ? (
          <div style={{ color: 'var(--accent-color)', textAlign: 'center', padding: '2rem 0' }}>
            <h3>¡Visita Registrada Exitosamente!</h3>
            <p>Redirigiendo al inicio...</p>
          </div>
        ) : (
          <>
            <div style={{ backgroundColor: 'var(--background-color)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
              <p style={{ margin: 0, fontWeight: 600 }}>{location?.name}</p>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Código: {code}</p>
            </div>

            {!isAuthenticated ? (
              <div style={{ textAlign: 'center' }}>
                <p style={{ marginBottom: '1rem' }}>Este es un punto geográfico registrado en el sistema. Debes iniciar sesión para registrar una visita.</p>
                <button onClick={() => router.push('/login')} className="btn btn-primary" style={{ width: '100%' }}>
                  Ir a Iniciar Sesión
                </button>
              </div>
            ) : (
              <form onSubmit={handleVisitLog} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {error && <p style={{ color: 'var(--danger-color)', fontSize: '0.875rem' }}>{error}</p>}
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Comentario (Opcional)</label>
                  <textarea 
                    className="input-field" 
                    rows={3} 
                    value={comment} 
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Evidencia Fotográfica (Opcional)</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) setImage(e.target.files[0]);
                    }}
                    className="input-field" 
                    style={{ padding: '0.5rem' }}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', padding: '0.75rem' }}>
                  Registrar Visita Espontánea
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
