import { useEffect, type ReactNode } from 'react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Accessible label for screen readers */
  ariaLabel: string;
}

/**
 * Custom dialog overlay with backdrop. Uses normal-flow layout (no position:fixed)
 * for compatibility with the rest of the app's mobile-first approach.
 *
 * Closes on:
 * - Escape key
 * - Click on backdrop (outside the dialog body)
 */
export function Dialog({ open, onClose, children, ariaLabel }: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-bg-base border border-bg-surface-hi rounded-[18px] p-6 w-full max-w-[340px]"
      >
        {children}
      </div>
    </div>
  );
}
