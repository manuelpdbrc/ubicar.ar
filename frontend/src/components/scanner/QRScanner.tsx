import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  onScan: (text: string) => void;
  onError?: (error: unknown) => void;
  isPaused?: boolean;
}

export function QRScanner({ onScan, onError, isPaused }: QRScannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let mounted = true;
    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;

    const startScanner = async () => {
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0 && mounted) {
          setHasPermission(true);
          await scanner.start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
            },
            (decodedText) => {
              if (mounted && !isPaused) {
                onScan(decodedText);
              }
            },
            (errorMsg) => {
              // Ignore typical "not found" errors which happen every frame
              if (onError && mounted && !errorMsg.includes('NotFound')) {
                onError(errorMsg);
              }
            }
          );
        } else if (mounted) {
          setHasPermission(false);
          if (onError) onError('No se detectaron cámaras.');
        }
      } catch (err) {
        if (mounted) {
          setHasPermission(false);
          if (onError) onError(err);
        }
      }
    };

    startScanner();

    return () => {
      mounted = false;
      if (scanner.isScanning) {
        scanner.stop().catch(console.error);
      }
    };
  }, [onScan, onError, isPaused]);

  if (hasPermission === false) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>No se pudo acceder a la cámara.</p>
        <p className="text-xs text-muted">Asegurate de haber dado permisos.</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '500px', margin: '0 auto' }}>
      <div id="qr-reader" ref={containerRef} style={{ width: '100%' }} />
      {/* Target overlay */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '250px',
        height: '250px',
        border: '2px solid rgba(255, 255, 255, 0.5)',
        borderRadius: '24px',
        pointerEvents: 'none',
        boxShadow: '0 0 0 4000px rgba(0, 0, 0, 0.5)',
      }}>
        {/* Corner markers */}
        <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '20px', height: '20px', borderTop: '4px solid white', borderLeft: '4px solid white', borderTopLeftRadius: '24px' }} />
        <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '20px', height: '20px', borderTop: '4px solid white', borderRight: '4px solid white', borderTopRightRadius: '24px' }} />
        <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: '20px', height: '20px', borderBottom: '4px solid white', borderLeft: '4px solid white', borderBottomLeftRadius: '24px' }} />
        <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '20px', height: '20px', borderBottom: '4px solid white', borderRight: '4px solid white', borderBottomRightRadius: '24px' }} />
      </div>
    </div>
  );
}
