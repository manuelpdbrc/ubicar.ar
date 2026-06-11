import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { Collection } from '../../types';

interface CollectionCardProps {
  collection: Collection;
  onClick: (col: Collection) => void;
  onEdit?: (col: Collection) => void;
}

export function CollectionCard({ collection, onClick, onEdit }: CollectionCardProps) {
  const isCreator = collection.userRole === 'CREATOR';
  const roleBadgeColor = isCreator ? 'primary' : 'default';
  
  const roleMap: Record<string, string> = {
    'CREATOR': 'Propietario',
    'EDITOR': 'Editor',
    'VIEWER': 'Visualizador'
  };

  return (
    <Card hoverable onClick={() => onClick(collection)} className="animate-fadeInUp" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0, color: 'var(--color-text)' }}>
          {collection.name}
        </h3>
        {onEdit && (isCreator || collection.userRole === 'EDITOR') && (
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(collection);
            }}
            title="Editar colección"
            aria-label={`Editar ${collection.name}`}
          >
            ✏️
          </button>
        )}
      </div>

      {collection.description && (
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {collection.description}
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.5rem' }}>
        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          📍 {collection._count?.locations || 0} ubicaciones
        </span>
        <Badge variant={roleBadgeColor}>
          {roleMap[collection.userRole || 'VIEWER']}
        </Badge>
      </div>
    </Card>
  );
}
