/**
 * Toast component — rendered internally by ToastContext.
 * This file re-exports the useToast hook for convenience.
 * 
 * The toast UI is self-contained in ToastContext.tsx with scoped styles.
 * No separate Toast component is needed.
 */
export { useToast } from '../../context/ToastContext';
