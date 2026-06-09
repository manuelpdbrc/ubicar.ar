import { forwardRef, type InputHTMLAttributes, useId } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, className = '', id: idProp, ...rest }, ref) => {
    const generatedId = useId();
    const id = idProp || generatedId;
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;

    return (
      <div className="form-group">
        {label && (
          <label htmlFor={id} className="input-label">
            {label}
            {rest.required && <span style={{ color: 'var(--color-error)', marginLeft: '2px' }}>*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`input-field ${error ? 'input-error' : ''} ${className}`}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : helper ? helperId : undefined}
          {...rest}
        />
        {error && (
          <span id={errorId} className="input-error-text" role="alert">
            {error}
          </span>
        )}
        {helper && !error && (
          <span id={helperId} className="input-helper">
            {helper}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
