interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  className?: string;
}

const VARIANT_DEFAULTS: Record<string, { width: string; height: string; borderRadius: string }> = {
  text: { width: '100%', height: '1rem', borderRadius: 'var(--radius-xs)' },
  circular: { width: '2.5rem', height: '2.5rem', borderRadius: '50%' },
  rectangular: { width: '100%', height: '8rem', borderRadius: 'var(--radius-md)' },
};

export function Skeleton({
  width,
  height,
  borderRadius,
  variant = 'text',
  className = '',
}: SkeletonProps) {
  const defaults = VARIANT_DEFAULTS[variant] ?? VARIANT_DEFAULTS['text']!;

  return (
    <div
      className={`animate-shimmer ${className}`}
      style={{
        width: width || defaults.width,
        height: height || defaults.height,
        borderRadius: borderRadius || defaults.borderRadius,
      }}
      aria-hidden="true"
      role="presentation"
    />
  );
}
