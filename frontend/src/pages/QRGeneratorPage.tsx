import { useState } from 'react';
import QRCode from 'react-qr-code';
import { Button } from '../components/ui/Button';

// Utility to generate a random 8-character code
// Excluding I, 1, O, 0 to avoid confusion
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Format as XXXX-XXXX for readability
  return `${result.slice(0, 4)}-${result.slice(4)}`;
}

export function QRGeneratorPage() {
  const [count, setCount] = useState<number>(12);
  const [codes, setCodes] = useState<string[]>([]);

  function handleGenerate() {
    const newCodes = Array.from({ length: count }, () => generateCode());
    setCodes(newCodes);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="page-container qr-generator-page">
      <div className="no-print" style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">Generador de Etiquetas QR</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
          Generá códigos QR genéricos para imprimir en planchas. Luego podrás pegarlos físicamente en las ubicaciones y vincularlos desde la app.
        </p>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0, minWidth: '150px' }}>
            <label className="input-label" htmlFor="qty">Cantidad de etiquetas</label>
            <input
              id="qty"
              type="number"
              min="1"
              max="120"
              className="input-field"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 0)}
            />
          </div>
          <Button onClick={handleGenerate} variant="primary">
            Generar códigos
          </Button>
          {codes.length > 0 && (
            <Button onClick={handlePrint} variant="outline" style={{ marginLeft: 'auto' }}>
              🖨️ Imprimir (A4)
            </Button>
          )}
        </div>
      </div>

      {codes.length > 0 && (
        <div className="print-grid">
          {codes.map((code) => {
            const url = `https://ubicar.ar/scan/${code}`;
            return (
              <div key={code} className="qr-label">
                <div className="qr-label-content">
                  <div className="qr-label-brand">ubicar.ar</div>
                  <div className="qr-label-qr-wrapper">
                    <QRCode value={url} size={90} level="M" />
                  </div>
                  <div className="qr-label-code">{code}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        /* Styles for the screen */
        .print-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
        }

        .qr-label {
          border: 1px dashed var(--color-border);
          padding: 1rem;
          background: white;
          border-radius: var(--radius-md);
          display: flex;
          justify-content: center;
          align-items: center;
          aspect-ratio: 2 / 1;
        }

        .qr-label-content {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .qr-label-brand {
          font-weight: 800;
          font-size: 0.875rem;
          color: var(--color-primary);
          letter-spacing: -0.02em;
        }

        .qr-label-code {
          font-family: monospace;
          font-weight: 700;
          font-size: 1.1rem;
          letter-spacing: 0.1em;
          color: #000;
        }

        /* Styles specifically for printing */
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }

          body * {
            visibility: hidden;
          }

          .print-grid, .print-grid * {
            visibility: visible;
          }

          .print-grid {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: grid;
            /* A4 layout: 3 columns x 8 rows = 24 labels per page (approx 7x3.5 cm) */
            grid-template-columns: repeat(3, 1fr);
            grid-auto-rows: 3.5cm;
            gap: 2mm;
            padding: 0;
          }

          .qr-label {
            border: 1px solid #000;
            border-radius: 4px;
            padding: 0.25cm;
            break-inside: avoid;
            aspect-ratio: auto;
          }

          .qr-label-brand {
            font-size: 9pt;
            color: #000; /* Black and white for print */
          }

          .qr-label-code {
            font-size: 11pt;
          }

          .qr-label-qr-wrapper svg {
            width: 2cm !important;
            height: 2cm !important;
          }
        }
      `}</style>
    </div>
  );
}
