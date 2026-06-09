import type { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  compact?: boolean;
  hoverable?: boolean;
}

export function Card({ children, compact, hoverable, className = '', onClick, ...rest }: CardProps) {
  const classes = [
    'card',
    compact ? 'card-compact' : '',
    hoverable ? 'card-hoverable' : '',
    onClick ? 'card-clickable' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classes}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(e as unknown as React.MouseEvent<HTMLDivElement>); } } : undefined}
      {...rest}
    >
      {children}
    </div>
  );
}
