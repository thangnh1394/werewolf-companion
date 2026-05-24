import type { InputHTMLAttributes, ReactNode } from 'react';

interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  helper?: ReactNode;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

export function TextInput({
  label,
  helper,
  leadingIcon,
  trailingIcon,
  className = '',
  id,
  ...rest
}: TextInputProps) {
  const inputId = id ?? `input-${rest.name ?? Math.random().toString(36).slice(2, 7)}`;
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-[13px] font-medium text-text-primary mb-2"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leadingIcon && (
          <span
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none flex items-center"
            aria-hidden
          >
            {leadingIcon}
          </span>
        )}
        <input
          id={inputId}
          {...rest}
          className={[
            'w-full bg-bg-surface border border-bg-surface-hi rounded-[12px] text-[15px] text-text-primary outline-none',
            'placeholder:text-text-muted',
            'focus:border-accent',
            'transition-colors',
            leadingIcon ? 'pl-11' : 'pl-3.5',
            trailingIcon ? 'pr-11' : 'pr-3.5',
            'py-3.5',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
        />
        {trailingIcon && (
          <span
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none flex items-center"
            aria-hidden
          >
            {trailingIcon}
          </span>
        )}
      </div>
      {helper && (
        <div className="text-[11px] text-text-secondary mt-1.5 flex items-center gap-1.5">
          {helper}
        </div>
      )}
    </div>
  );
}
