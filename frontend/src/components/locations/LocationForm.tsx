import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { api, ApiRequestError } from '../../lib/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import type { Location, Category } from '../../types';

const QUICK_COLORS = [
  '#6366F1', '#3B82F6', '#10B981', '#F59E0B',
  '#EF4444', '#EC4899', '#8B5CF6', '#14B8A6',
];

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
  const navigate = useNavigate();
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

  // Inline category creation state
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(QUICK_COLORS[0]!);
  const [isCreatingCat, setIsCreatingCat] = useState(false);

  const isEditing = !!editLocation;

  // Load categories
  useEffect(() => {
    if (!isOpen) return;
    api.get<Category[]>('/api/categories')
      .then(setCategories)
      .catch(() => showToast('Error al cargar categorías', 'error'));
  }, [isOpen, showToast]);

  // Populate form for editing or new
  useEffect(() => {
    if (editLocation) {
      setName(editLocation.name);
      setLatitude(String(editLocation.latitude));
      setLongitude(String(editLocation.longitude));
      setCategoryId(String(editLocation.categoryId));
      setImagePreview(editLocation.imageUrl ?? null);
    } else {
      setName('');
      setLatitude(initialLat !== undefined ? String(initialLat) : '');
      setLongitude(initialLng !== undefined ? String(initialLng) : '');
      setCategoryId('');
      setImagePreview(null);
    }
    setImageFile(null);
    setErrors({});
    setShowNewCategory(false);
    setNewCatName('');
  }, [editLocation, isOpen, initialLat, initialLng]);

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

    // Parse lat/lng — handle both . and , as decimal separator
    const latStr = latitude.replace(',', '.');
    const lngStr = longitude.replace(',', '.');
    const lat = Number(latStr);
    const lng = Number(lngStr);

    if (!latitude.trim() || isNaN(lat) || lat < -90 || lat > 90) {
      newErrors['latitude'] = 'Latitud inválida (-90 a 90)';
    }
    if (!longitude.trim() || isNaN(lng) || lng < -180 || lng > 180) {
      newErrors['longitude'] = 'Longitud inválida (-180 a 180)';
    }
    if (!categoryId) newErrors['categoryId'] = 'Seleccioná una categoría';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleCreateCategory() {
    if (!newCatName.trim()) return;
    setIsCreatingCat(true);
    try {
      const cat = await api.post<Category>('/api/categories', {
        name: newCatName.trim(),
        color: newCatColor,
      });
      setCategories((prev) => [cat, ...prev]);
      setCategoryId(String(cat.id));
      setShowNewCategory(false);
      setNewCatName('');
      showToast(`Categoría "${cat.name}" creada`, 'success');
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : 'Error al crear categoría';
      showToast(msg, 'error');
    } finally {
      setIsCreatingCat(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting || !validate()) return;

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      // Normalize decimals before sending
      formData.append('latitude', latitude.replace(',', '.'));
      formData.append('longitude', longitude.replace(',', '.'));
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
            type="text"
            inputMode="decimal"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="Ej: -34.6037"
            error={errors['latitude']}
            required
          />
          <Input
            label="Longitud"
            type="text"
            inputMode="decimal"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder="Ej: -58.3816"
            error={errors['longitude']}
            required
          />
        </div>
        {!latitude && !longitude && (
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '-0.5rem', marginBottom: '0.75rem' }}>
            💡 Tocá en el mapa para completar las coordenadas automáticamente
          </p>
        )}

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

          {/* Quick add category */}
          {!showNewCategory ? (
            <button
              type="button"
              onClick={() => setShowNewCategory(true)}
              style={{
                marginTop: '0.5rem',
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                fontWeight: 500,
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              + Crear nueva categoría
            </button>
          ) : (
            <div
              style={{
                marginTop: '0.75rem',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-secondary)',
              }}
            >
              <p style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Nueva categoría
              </p>
              <Input
                label=""
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Nombre de la categoría"
              />
              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                {QUICK_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewCatColor(c)}
                    style={{
                      width: '1.5rem',
                      height: '1.5rem',
                      borderRadius: '50%',
                      backgroundColor: c,
                      border: newCatColor === c ? '2px solid var(--color-text)' : '2px solid transparent',
                      cursor: 'pointer',
                      transition: 'transform 0.15s',
                      transform: newCatColor === c ? 'scale(1.2)' : 'scale(1)',
                    }}
                    aria-label={`Color ${c}`}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => { setShowNewCategory(false); setNewCatName(''); }}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleCreateCategory}
                  isLoading={isCreatingCat}
                  disabled={!newCatName.trim()}
                >
                  Crear
                </Button>
              </div>
            </div>
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

        {/* QR Code link */}
        {isEditing && editLocation && (
          <div className="form-group" style={{ padding: '1rem', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)' }}>
            <label className="input-label">Código Identificador (QR)</label>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.25rem' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 600 }}>
                {(editLocation.uniqueCode && editLocation.uniqueCode.length < 36) ? editLocation.uniqueCode : 'No Definido'}
              </span>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => {
                  onClose();
                  navigate(`/scanner?linkLocationId=${editLocation.id}`);
                }}
              >
                📷 Vincular QR
              </Button>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '0.5rem' }}>
              Podés escanear una etiqueta impresa para asociarla a esta ubicación.
            </p>
          </div>
        )}

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
