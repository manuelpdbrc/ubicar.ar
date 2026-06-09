import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import { api, ApiRequestError } from '../../lib/api';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { CategoryForm } from './CategoryForm';
import type { Category } from '../../types';

interface CategoryWithCount extends Category {
  _count?: { locations: number };
}

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CategoryManager({ isOpen, onClose }: CategoryManagerProps) {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { showToast } = useToast();

  const loadCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.get<CategoryWithCount[]>('/api/categories');
      setCategories(data);
    } catch {
      showToast('Error al cargar categorías', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (isOpen) loadCategories();
  }, [isOpen, loadCategories]);

  async function handleDelete(cat: CategoryWithCount) {
    if (cat._count && cat._count.locations > 0) {
      showToast(`No se puede eliminar: tiene ${cat._count.locations} ubicación(es)`, 'warning');
      return;
    }

    setDeletingId(cat.id);
    try {
      await api.delete(`/api/categories/${cat.id}`);
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      showToast('Categoría eliminada', 'success');
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : 'Error al eliminar';
      showToast(msg, 'error');
    } finally {
      setDeletingId(null);
    }
  }

  function handleFormSuccess(category: Category) {
    setCategories((prev) => {
      const idx = prev.findIndex((c) => c.id === category.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx]!, ...category };
        return updated;
      }
      return [{ ...category, _count: { locations: 0 } }, ...prev];
    });
    setShowForm(false);
    setEditCategory(null);
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Categorías" size="md">
        <div style={{ marginBottom: '1rem' }}>
          <Button
            variant="primary"
            size="sm"
            onClick={() => { setEditCategory(null); setShowForm(true); }}
          >
            + Nueva categoría
          </Button>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[1, 2, 3].map((i) => <Skeleton key={i} height="3rem" />)}
          </div>
        ) : categories.length === 0 ? (
          <EmptyState
            icon="🏷️"
            title="Sin categorías"
            description="Creá tu primera categoría para organizar ubicaciones"
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {categories.map((cat) => (
              <Card key={cat.id} compact className="animate-fadeIn">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '1rem',
                      height: '1rem',
                      borderRadius: '50%',
                      backgroundColor: cat.color,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ flex: 1, fontWeight: 500, fontSize: '0.9375rem' }}>{cat.name}</span>
                  <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                    {cat._count?.locations ?? 0} ubic.
                  </span>
                  <button
                    className="btn btn-ghost btn-sm btn-icon"
                    onClick={() => { setEditCategory(cat); setShowForm(true); }}
                    aria-label={`Editar ${cat.name}`}
                    style={{ fontSize: '0.75rem' }}
                  >
                    ✏️
                  </button>
                  <button
                    className="btn btn-ghost btn-sm btn-icon"
                    onClick={() => handleDelete(cat)}
                    disabled={deletingId === cat.id}
                    aria-label={`Eliminar ${cat.name}`}
                    style={{ fontSize: '0.75rem' }}
                  >
                    {deletingId === cat.id ? <span className="spinner spinner-sm" /> : '🗑️'}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Modal>

      <CategoryForm
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditCategory(null); }}
        onSuccess={handleFormSuccess}
        editCategory={editCategory}
      />
    </>
  );
}
