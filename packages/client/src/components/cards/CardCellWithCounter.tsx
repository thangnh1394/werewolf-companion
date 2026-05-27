import { useRef, type PointerEvent } from 'react';
import type { Card } from '@werewolf/shared';
import { TEAM_INFO } from '@werewolf/shared';

interface CardCellWithCounterProps {
  card: Card;
  count: number;
  /**
   * Increment handler — usually called on quick tap.
   * The handler doesn't update count locally; it sends a SET_CARD_COUNT and
   * waits for ROOM_DESK_UPDATED. The displayed count comes from server state.
   */
  onIncrement: () => void;
  /** Decrement handler — called on long-press (500ms). */
  onDecrement: () => void;
}

const LONG_PRESS_MS = 500;

/**
 * Card cell used in the Room Desk Editor.
 *
 * Interactions:
 *  - Quick tap (< 500ms)   → onIncrement
 *  - Long press (≥ 500ms)  → onDecrement (with light haptic if supported)
 *
 * Implementation: uses pointerdown/pointerup so it works on touch + mouse.
 * iOS Safari's 3D-Touch contextmenu is suppressed via preventDefault.
 *
 * Counter chip appears at top-right when count > 0.
 * Selected (count > 0) cards have a 1.5px border in their team's color.
 */
export function CardCellWithCounter({
  card,
  count,
  onIncrement,
  onDecrement,
}: CardCellWithCounterProps) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);

  const teamInfo = TEAM_INFO[card.team];
  const isSelected = count > 0;

  const gradientByTeam: Record<typeof card.team, string> = {
    wolf: 'linear-gradient(180deg, #3A2A2A, #1F2419)',
    village: 'linear-gradient(180deg, #2D3225, #1F2419)',
    solo: 'linear-gradient(180deg, #2A2A3A, #1F2419)',
  };

  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(15);
      } catch {
        // ignore
      }
    }
  };

  const handlePointerDown = (_e: PointerEvent<HTMLButtonElement>) => {
    longPressFired.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      triggerHaptic();
      onDecrement();
    }, LONG_PRESS_MS);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (!longPressFired.current) {
      onIncrement();
    }
  };

  const handlePointerCancel = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    longPressFired.current = false;
  };

  // Prevent iOS Safari context menu / 3D-Touch from interfering
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <button
      type="button"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerCancel}
      onContextMenu={handleContextMenu}
      aria-label={`${card.name}, hiện ${count}. Bấm để thêm, giữ để bớt.`}
      className="bg-bg-surface rounded-[10px] p-2 relative text-left active:scale-[0.97] transition-transform"
      style={{
        border: isSelected
          ? `1.5px solid ${teamInfo.accentColor}`
          : '1.5px solid transparent',
        touchAction: 'manipulation',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
    >
      <div
        className="aspect-square rounded-md flex items-center justify-center mb-1.5 overflow-hidden"
        style={{ background: gradientByTeam[card.team] }}
      >
        <img
          src={card.imageUrl}
          alt=""
          loading="lazy"
          className="w-full h-full object-cover"
          aria-hidden
          draggable={false}
        />
      </div>
      <div className="text-text-primary text-[11px] font-medium text-center leading-tight">
        {card.name}
      </div>
      {count > 0 && (
        <div
          className="absolute -top-1.5 -right-1.5 font-semibold text-[13px] w-6 h-6 rounded-full flex items-center justify-center"
          style={{
            background: teamInfo.accentColor,
            color: card.team === 'village' ? '#1F2419' : '#FFFFFF',
            border: '2px solid #1F2419',
          }}
          aria-hidden
        >
          {count}
        </div>
      )}
    </button>
  );
}
