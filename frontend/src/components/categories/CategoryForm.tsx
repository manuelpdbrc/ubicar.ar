import { useState, useEffect, type FormEvent } from 'react';
import { useToast } from '../../context/ToastContext';
import { api, ApiRequestError } from '../../lib/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import type { Category } from '../../types';

const DEFAULT_COLORS = [
  '#6366F1', '#3B82F6', '#10B981', '#F59E0B',
  '#EF4444', '#EC4899', '#8B5CF6', '#14B8A6',
  '#F97316', '#06B6D4',
];

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (category: Category) => void;
  editCategory?: Category | null;
}

export function CategoryForm({ isOpen, onClose, onSuccess, editCategory }: CategoryFormProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(DEFAULT_COLORS[0]!);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const isEditing = !!editCategory;

  useEffect(() => {
    if (editCategory) {
      setName(editCategory.name);
      setColor(editCategory.color);
    } else {
      setName('');
      setColor(DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)]!);
    }
    setError('');
  }, [editCategory, isOpen]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    if (!name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      let category: Category;
      if (isEditing) {
        category = await api.put<Category>(`/api/categories/${editCategory.id}`, { name: name.trim(), color });
        showToast('Categoría actualizada', 'success');
      } else {
        category = await api.post<Category>('/api/categories', { name: name.trim(), color });
        showToast('Categoría creada', 'success');
      }
      onSuccess(category);
      onClose();
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : 'Error al guardar';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar categoría' : 'Nueva categoría'}
      size="sm"
    >
      <form onSubmit={handleSubmit} noValidate>
        <Input
          label="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Sucursales"
          error={error}
          required
          autoFocus
        />

        <div className="form-group">
          <label className="input-label">Color</label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {DEFAULT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: c,
                  border: color === c ? '2px solid var(--color-text)' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  transform: color === c ? 'scale(1.15)' : 'scale(1)',
                }}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
        </div>

        <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isEditing ? 'Guardar' : 'Crear'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
