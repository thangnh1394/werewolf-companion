import { useEffect, useRef, type ChangeEvent, type KeyboardEvent } from 'react';
import { ROOM_CODE_LENGTH } from '@werewolf/shared';

interface CodeInputProps {
  value: string;
  onChange: (next: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
}

/**
 * Renders the visual segmented 6-cell code grid, but uses a single hidden
 * input under the hood for accessibility, mobile keyboard, and auto-paste support.
 */
export function CodeInput({
  value,
  onChange,
  autoFocus = false,
  disabled = false,
  ariaLabel = 'Code 6 số',
}: CodeInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const digits = value.padEnd(ROOM_CODE_LENGTH, ' ').slice(0, ROOM_CODE_LENGTH).split('');
  const activeIndex = Math.min(value.length, ROOM_CODE_LENGTH - 1);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, ROOM_CODE_LENGTH);
    onChange(raw);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Allow native Backspace to delete one char at a time.
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  const handleCellClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div
      className="relative"
      onClick={handleCellClick}
      role="group"
      aria-label={ariaLabel}
    >
      {/* Hidden accessible input */}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="\d{6}"
        maxLength={ROOM_CODE_LENGTH}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-label={ariaLabel}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />
      {/* Visual cells */}
      <div className="flex gap-2 justify-between pointer-events-none">
        {digits.map((digit, i) => {
          const isFilled = digit.trim() !== '';
          const isActive = i === activeIndex && !disabled;
          return (
            <div
              key={i}
              className={[
                'flex-1 aspect-square max-w-[46px] rounded-[10px] flex items-center justify-center text-[22px] font-medium',
                isFilled
                  ? 'bg-[rgba(232,155,60,0.08)] border border-[rgba(232,155,60,0.4)] text-text-primary'
                  : isActive
                    ? 'bg-bg-surface border border-accent text-text-primary'
                    : 'bg-bg-surface border border-bg-surface-hi text-text-muted',
              ].join(' ')}
            >
              {isFilled ? digit : i === activeIndex ? '' : '_'}
            </div>
          );
        })}
      </div>
    </div>
  );
}
