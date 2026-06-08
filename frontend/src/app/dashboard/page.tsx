'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function Dashboard() {
  const { token } = useAuth();
  const [locations, setLocations] = useState<any[]>([]);

  useEffect(() => {
    if (token) {
      fetch('http://localhost:4000/api/locations', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setLocations(data))
      .catch(console.error);
    }
  }, [token]);

  return (
    <div>
      <h3 style={{ marginBottom: '1rem' }}>Puntos Geográficos</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {locations.length === 0 ? (
          <p style={{ fontSize: '0.875rem' }}>No hay locaciones disponibles.</p>
        ) : (
          locations.map((loc) => (
            <div key={loc.id} className="card" style={{ padding: '1rem', cursor: 'pointer' }}>
              <h4 style={{ margin: 0, fontSize: '1rem' }}>{loc.name}</h4>
              <p style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>Código: {loc.uniqueCode}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--secondary-color)' }}>
                Ver en mapa →
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
