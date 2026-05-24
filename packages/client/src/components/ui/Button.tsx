import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-accent text-bg-base font-medium active:scale-[0.98] active:bg-accent-dim disabled:bg-bg-surface-hi disabled:text-text-secondary disabled:cursor-not-allowed',
  secondary:
    'bg-bg-surface border border-bg-surface-hi text-text-primary active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed',
  danger:
    'bg-danger text-white font-medium active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed',
  ghost:
    'bg-transparent border border-bg-surface-hi text-text-primary active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
};

export function Button({
  variant = 'primary',
  fullWidth = false,
  children,
  className = '',
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-[14px] px-4 py-4 text-base transition-transform',
        fullWidth ? 'w-full' : '',
        variantStyles[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </button>
  );
}
