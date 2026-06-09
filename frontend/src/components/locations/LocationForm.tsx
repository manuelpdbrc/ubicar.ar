import { useState, useEffect, type FormEvent } from 'react';
import { useToast } from '../../context/ToastContext';
import { api, ApiRequestError } from '../../lib/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import type { Location, Category } from '../../types';

interface LocationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (location: Location) => void;
  editLocation?: Location | null;
  initialLat?: number;
  initialLng?: number;
}

export function LocationForm({
  isOpen,
  onClose,
  onSuccess,
  editLocation,
  initialLat,
  initialLng,
}: LocationFormProps) {
  const [name, setName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { showToast } = useToast();

  const isEditing = !!editLocation;

  // Load categories
  useEffect(() => {
    if (!isOpen) return;
    api.get<Category[]>('/api/categories')
      .then(setCategories)
      .catch(() => showToast('Error al cargar categorías', 'error'));
  }, [isOpen, showToast]);

  // Populate form for editing
  useEffect(() => {
    if (editLocation) {
      setName(editLocation.name);
      setLatitude(String(editLocation.latitude));
      setLongitude(String(editLocation.longitude));
      setCategoryId(String(editLocation.categoryId));
      setImagePreview(editLocation.imageUrl);
    } else {
      setName('');
      setLatitude(initialLat !== undefined ? String(initialLat) : '');
      setLongitude(initialLng !== undefined ? String(initialLng) : '');
      setCategoryId('');
      setImagePreview(null);
    }
    setImageFile(null);
    setErrors({});
  }, [editLocation, isOpen, initialLat, initialLng]);

  // Handle image selection
  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('La imagen no puede superar 5MB', 'warning');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors['name'] = 'El nombre es obligatorio';
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || lat < -90 || lat > 90) newErrors['latitude'] = 'Latitud inválida (-90 a 90)';
    if (isNaN(lng) || lng < -180 || lng > 180) newErrors['longitude'] = 'Longitud inválida (-180 a 180)';
    if (!categoryId) newErrors['categoryId'] = 'Seleccioná una categoría';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting || !validate()) return;

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('latitude', latitude);
      formData.append('longitude', longitude);
      formData.append('categoryId', categoryId);
      if (imageFile) formData.append('image', imageFile);

      let location: Location;
      if (isEditing) {
        location = await api.upload<Location>(`/api/locations/${editLocation.id}`, formData, 'PUT');
        showToast('Ubicación actualizada', 'success');
      } else {
        location = await api.upload<Location>('/api/locations', formData);
        showToast('Ubicación creada', 'success');
      }

      onSuccess(location);
      onClose();
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : 'Error al guardar';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar ubicación' : 'Nueva ubicación'}
      size="md"
    >
      <form onSubmit={handleSubmit} noValidate>
        <Input
          label="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Oficina Central"
          error={errors['name']}
          required
          autoFocus
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <Input
            label="Latitud"
            type="number"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="-34.6037"
            error={errors['latitude']}
            required
            step="any"
          />
          <Input
            label="Longitud"
            type="number"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder="-58.3816"
            error={errors['longitude']}
            required
            step="any"
          />
        </div>

        {/* Category selector */}
        <div className="form-group">
          <label className="input-label" htmlFor="loc-category">
            Categoría <span style={{ color: 'var(--color-error)' }}>*</span>
          </label>
          <select
            id="loc-category"
            className={`input-field ${errors['categoryId'] ? 'input-error' : ''}`}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
          >
            <option value="">Seleccionar categoría...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors['categoryId'] && (
            <span className="input-error-text">{errors['categoryId']}</span>
          )}
          {categories.length === 0 && (
            <span className="input-helper">Creá una categoría primero desde el panel</span>
          )}
        </div>

        {/* Image upload */}
        <div className="form-group">
          <label className="input-label">Imagen (opcional)</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            className="input-field"
            style={{ padding: '0.5rem' }}
          />
          {imagePreview && (
            <div style={{ marginTop: '0.5rem', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <img
                src={imagePreview}
                alt="Preview"
                style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }}
              />
            </div>
          )}
        </div>

        <div className="form-actions" style={{ justifyContent: 'flex-end' }}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isEditing ? 'Guardar cambios' : 'Crear ubicación'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
