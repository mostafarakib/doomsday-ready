import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'brand';
  size?: 'sm' | 'md';
  className?: string;
  onRemove?: () => void;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  onRemove,
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center font-medium rounded-md tracking-tight';

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  const variantStyles = {
    default: 'bg-[#222222] text-[#a3a3a3] border border-[#333333]',
    success: 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/50',
    warning: 'bg-amber-950/40 text-amber-300 border border-amber-800/50',
    danger: 'bg-rose-950/40 text-rose-300 border border-rose-800/50',
    brand: 'bg-red-950/40 text-red-300 border border-red-800/50',
  };

  return (
    <span className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}>
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 hover:text-white rounded-full p-0.5 transition-colors focus:outline-none"
          aria-label="Remove"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </span>
  );
}
