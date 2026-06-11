import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { CollectionCard } from '../components/collections/CollectionCard';
import { CollectionForm } from '../components/collections/CollectionForm';
import type { Collection } from '../types';

export function CollectionsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editCollection, setEditCollection] = useState<Collection | null>(null);

  useEffect(() => {
    loadCollections();
  }, []);

  async function loadCollections() {
    try {
      setIsLoading(true);
      const data = await api.get<Collection[]>('/api/collections');
      setCollections(data);
    } catch (err) {
      showToast('Error al cargar las colecciones', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  function handleCreate() {
    setEditCollection(null);
    setIsFormOpen(true);
  }

  function handleEdit(col: Collection) {
    setEditCollection(col);
    setIsFormOpen(true);
  }

  function handleFormSuccess(col: Collection) {
    if (editCollection) {
      setCollections((prev) => prev.map((c) => (c.id === col.id ? col : c)));
    } else {
      setCollections((prev) => [col, ...prev].sort((a, b) => a.name.localeCompare(b.name)));
    }
  }

  return (
    <div className="animate-fadeIn" style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Colecciones</h1>
        <Button onClick={handleCreate} icon="➕">Nueva Colección</Button>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '140px', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : collections.length === 0 ? (
        <EmptyState
          icon="📁"
          title="Sin colecciones"
          description="Agrupá tus ubicaciones creando tu primera colección."
          actionLabel="Crear colección"
          onAction={handleCreate}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {collections.map((col) => (
            <CollectionCard
              key={col.id}
              collection={col}
              onClick={(c) => navigate(`/collections/${c.id}`)}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      <CollectionForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleFormSuccess}
        editCollection={editCollection}
      />
    </div>
  );
}
