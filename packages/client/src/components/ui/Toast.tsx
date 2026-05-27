import { useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ToastProps {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
  /** Auto-dismiss after N ms. 0 = manual close only. Default 4000. */
  autoCloseMs?: number;
}

/**
 * Slide-in toast notification for errors and important info.
 * Positions itself absolute at top of viewport with backdrop blur.
 * Follows Phase 2.3 design: coral red bg + warm white text.
 */
export function Toast({
  open,
  title,
  message,
  onClose,
  autoCloseMs = 4000,
}: ToastProps) {
  useEffect(() => {
    if (!open || autoCloseMs <= 0) return;
    const timer = setTimeout(onClose, autoCloseMs);
    return () => clearTimeout(timer);
  }, [open, onClose, autoCloseMs]);

  if (!open) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed top-5 left-4 right-4 z-[60] rounded-[12px] px-3.5 py-3 flex items-start gap-2.5 animate-fade-in"
      style={{
        background: 'rgba(216, 90, 48, 0.95)',
        border: '1px solid rgba(216, 90, 48, 0.6)',
        backdropFilter: 'blur(4px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        maxWidth: '380px',
        marginLeft: 'auto',
        marginRight: 'auto',
      }}
    >
      <AlertCircle
        size={20}
        className="shrink-0 mt-0.5"
        style={{ color: '#FFFFFF' }}
        aria-hidden
      />
      <div className="flex-1 min-w-0">
        <div className="text-white text-[13px] font-medium mb-0.5">{title}</div>
        <div className="text-white/85 text-[12px] leading-snug">{message}</div>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng"
        className="bg-transparent border-0 text-white/70 p-0 shrink-0 cursor-pointer active:scale-90"
      >
        <X size={16} aria-hidden />
      </button>
    </div>
  );
}
