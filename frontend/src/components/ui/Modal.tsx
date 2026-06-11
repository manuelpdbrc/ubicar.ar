import { useEffect, useCallback, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const SIZE_MAP: Record<string, string> = {
  sm: '400px',
  md: '540px',
  lg: '720px',
};

export function Modal({ isOpen, onClose, title, size = 'md', children }: ModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Escape key handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  // Body scroll lock + key listener
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
      document.addEventListener('keydown', handleKeyDown);

      // Focus first focusable element
      requestAnimationFrame(() => {
        if (contentRef.current?.contains(document.activeElement)) return;
        
        const autoFocusEl = contentRef.current?.querySelector<HTMLElement>('[autofocus]');
        if (autoFocusEl) {
          autoFocusEl.focus();
          return;
        }

        const focusable = contentRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        focusable?.focus();
      });
    } else {
      document.body.classList.remove('modal-open');
    }

    return () => {
      document.body.classList.remove('modal-open');
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return createPortal(
    <div className="overlay animate-fadeIn" onClick={onClose} role="presentation">
      <div
        ref={contentRef}
        className="modal animate-scaleIn"
        style={{ maxWidth: SIZE_MAP[size] }}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Modal'}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {title && (
          <div className="modal__header">
            <h3 className="modal__title">{title}</h3>
            <button
              className="modal__close"
              onClick={onClose}
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
        )}

        {/* Close button when no title */}
        {!title && (
          <button
            className="modal__close modal__close--floating"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        )}

        {/* Body */}
        <div className="modal__body">{children}</div>
      </div>

      <style>{`
        .modal {
          width: calc(100% - 2rem);
          background-color: var(--color-surface);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-xl);
          position: relative;
          max-height: calc(100vh - 4rem);
          max-height: calc(100dvh - 4rem);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .modal__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--color-border);
          flex-shrink: 0;
        }

        .modal__title {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--color-text);
        }

        .modal__close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2rem;
          height: 2rem;
          border-radius: var(--radius-sm);
          font-size: 0.875rem;
          color: var(--color-text-tertiary);
          cursor: pointer;
          transition: all var(--transition-fast);
          border: none;
          background: none;
          flex-shrink: 0;
        }

        .modal__close:hover {
          background-color: var(--color-bg-secondary);
          color: var(--color-text);
        }

        .modal__close--floating {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          z-index: 1;
        }

        .modal__body {
          padding: 1.5rem;
          overflow-y: auto;
          flex: 1;
        }
      `}</style>
    </div>,
    document.body
  );
}
