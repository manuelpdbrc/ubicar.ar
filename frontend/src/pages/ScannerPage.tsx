import { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { QRScanner } from '../components/scanner/QRScanner';
import { Button } from '../components/ui/Button';

export function ScannerPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const linkLocationId = searchParams.get('linkLocationId');

  const [isPaused, setIsPaused] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const processCode = useCallback(async (code: string) => {
    setIsPaused(true);

    if (linkLocationId) {
      // LINK MODE
      try {
        setIsSubmitting(true);
        await api.put(`/api/locations/${linkLocationId}`, { uniqueCode: code });
        showToast('Código vinculado correctamente', 'success');
        navigate('/dashboard');
      } catch (err: any) {
        setIsSubmitting(false);
        showToast(err.message || 'Error al vincular el código', 'error');
        // Unpause to allow scanning again
        setTimeout(() => setIsPaused(false), 2000);
      }
    } else {
      // SCAN MODE
      navigate(`/scan/${code}`);
    }
  }, [linkLocationId, navigate, showToast]);

  const handleScan = useCallback((decodedText: string) => {
    // If the scanned text is a full URL from our app, extract the code
    let code = decodedText.trim();
    try {
      const url = new URL(code);
      if (url.pathname.startsWith('/scan/')) {
        code = url.pathname.split('/scan/')[1].replace(/\/$/, '');
      }
    } catch {
      // Not a valid URL, assume it's just the code
    }
    processCode(code);
  }, [processCode]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    processCode(manualCode.trim());
  };

  return (
    <div className="page-container scanner-page" style={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#000' }}>
      <div style={{ padding: '1rem', color: 'white', textAlign: 'center', zIndex: 10 }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>
          {linkLocationId ? 'Vincular Etiqueta QR' : 'Escanear Ubicación'}
        </h2>
        <p className="text-xs" style={{ opacity: 0.8, marginTop: '0.25rem' }}>
          {linkLocationId ? 'Apuntá al código para asociarlo' : 'Apuntá al código para registrar visita'}
        </p>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <QRScanner onScan={handleScan} isPaused={isPaused} />
      </div>

      <div style={{ padding: '1.5rem', backgroundColor: 'var(--color-surface)', borderTopRadius: '24px' }}>
        <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
          <div className="form-group" style={{ margin: 0, flex: 1 }}>
            <input
              type="text"
              className="input-field"
              placeholder="O ingresá el código (ej. K9X2-M4B1)"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              disabled={isSubmitting || isPaused}
            />
          </div>
          <Button type="submit" variant="primary" disabled={!manualCode.trim() || isSubmitting || isPaused}>
            {linkLocationId ? 'Vincular' : 'Buscar'}
          </Button>
        </form>
      </div>

      <style>{`
        .scanner-page {
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
