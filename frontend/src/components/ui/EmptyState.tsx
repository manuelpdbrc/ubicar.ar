import { Button } from './Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state animate-fadeInUp" role="status">
      <span className="empty-state__icon" aria-hidden="true">{icon}</span>
      <h3 className="empty-state__title">{title}</h3>
      {description && <p className="empty-state__description">{description}</p>}
      {action && (
        <Button
          variant="primary"
          size="sm"
          onClick={action.onClick}
          style={{ marginTop: '1rem' }}
        >
          {action.label}
        </Button>
      )}

      <style>{`
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 1.5rem;
          text-align: center;
        }

        .empty-state__icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          display: block;
        }

        .empty-state__title {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--color-text);
          margin-bottom: 0.5rem;
        }

        .empty-state__description {
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          max-width: 280px;
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
}
