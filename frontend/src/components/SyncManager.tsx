'use client';

import { useEffect, useState } from 'react';
import { getOfflineVisits, clearOfflineVisits } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';

export default function SyncManager() {
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      
      const handleOnline = () => {
        setIsOnline(true);
        syncData();
      };
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [token]);

  const syncData = async () => {
    if (!token || syncing) return;
    
    try {
      setSyncing(true);
      const visits = await getOfflineVisits();
      
      if (visits.length === 0) {
        setSyncing(false);
        return;
      }

      const formData = new FormData();
      
      // We append the JSON array as a string
      formData.append('visits', JSON.stringify(visits.map(v => ({
        uniqueCode: v.uniqueCode,
        type: v.type,
        circuitId: v.circuitId,
        comment: v.comment,
        dateTimestamp: v.dateTimestamp,
        hasImage: v.hasImage
      }))));

      // Append image blobs if any
      visits.forEach(v => {
        if (v.hasImage && v.imageBlob) {
          formData.append('images', v.imageBlob, `visit-${v.uniqueCode}.jpg`);
        }
      });

      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        await clearOfflineVisits();
        console.log('Sincronización exitosa!');
      } else {
        console.error('Error en la sincronización:', await res.text());
      }
    } catch (error) {
      console.error('Network error during sync', error);
    } finally {
      setSyncing(false);
    }
  };

  if (!isOnline) {
    return (
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'var(--warning-color)', color: 'white', textAlign: 'center', padding: '0.5rem', zIndex: 1000, fontSize: '0.875rem' }}>
        Estás trabajando sin conexión. Los datos se guardarán localmente y se sincronizarán al recuperar la señal.
      </div>
    );
  }

  if (syncing) {
    return (
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'var(--accent-color)', color: 'white', textAlign: 'center', padding: '0.5rem', zIndex: 1000, fontSize: '0.875rem' }}>
        Sincronizando datos pendientes...
      </div>
    );
  }

  return null;
}
