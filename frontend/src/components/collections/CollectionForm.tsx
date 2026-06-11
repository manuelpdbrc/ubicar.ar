import { useState, useEffect, type FormEvent } from 'react';
import { useToast } from '../../context/ToastContext';
import { api, ApiRequestError } from '../../lib/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import type { Collection } from '../../types';

interface CollectionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (col: Collection) => void;
  editCollection?: Collection | null;
}

export function CollectionForm({ isOpen, onClose, onSuccess, editCollection }: CollectionFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { showToast } = useToast();

  const isEditing = !!editCollection;

  useEffect(() => {
    if (editCollection) {
      setName(editCollection.name);
      setDescription(editCollection.description || '');
    } else {
      setName('');
      setDescription('');
    }
    setErrors({});
  }, [editCollection, isOpen]);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors['name'] = 'El nombre es obligatorio';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting || !validate()) return;

    setIsSubmitting(true);
    try {
      let col: Collection;
      if (isEditing) {
        col = await api.put<Collection>(`/api/collections/${editCollection.id}`, {
          name: name.trim(),
          description: description.trim() || null,
        });
        showToast('Colección actualizada', 'success');
      } else {
        col = await api.post<Collection>('/api/collections', {
          name: name.trim(),
          description: description.trim() || null,
        });
        showToast('Colección creada', 'success');
      }
      onSuccess(col);
      onClose();
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : 'Error al guardar';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Editar colección' : 'Nueva colección'} size="sm">
      <form onSubmit={handleSubmit} noValidate>
        <Input
          label="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Hoteles"
          error={errors['name']}
          required
          autoFocus
        />

        <div className="form-group" style={{ marginTop: '1rem' }}>
          <label className="input-label" htmlFor="col-desc">Descripción (opcional)</label>
          <textarea
            id="col-desc"
            className="input-field"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Breve descripción de la colección"
            rows={3}
          />
        </div>

        <div className="form-actions" style={{ justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isEditing ? 'Guardar cambios' : 'Crear colección'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
