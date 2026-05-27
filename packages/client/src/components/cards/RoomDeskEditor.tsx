import { useMemo } from 'react';
import { ArrowLeft, Check, AlertTriangle } from 'lucide-react';
import type { Team } from '@werewolf/shared';
import { groupByTeam, TEAM_INFO } from '@werewolf/shared';
import { CardCellWithCounter } from './CardCellWithCounter';

interface RoomDeskEditorProps {
  /** Current deck — cardId → count. Server-authoritative; we just display. */
  roomDesk: Record<string, number>;
  /** Current player count (used for "X / Y" deck size display) */
  playerCount: number;
  /** Called when host taps a card to add */
  onIncrement: (cardId: string) => void;
  /** Called when host long-presses a card to remove */
  onDecrement: (cardId: string) => void;
  onClose: () => void;
}

/**
 * Host-only screen for composing the room desk.
 *
 * Layout follows Golden Rule 1:
 *   - Sticky header: back button + title + hint subtitle
 *   - Sticky deck-counter card (green when matched, amber when off)
 *   - Scrollable body: 3 team sections of CardCellWithCounter
 */
export function RoomDeskEditor({
  roomDesk,
  playerCount,
  onIncrement,
  onDecrement,
  onClose,
}: RoomDeskEditorProps) {
  const grouped = useMemo(() => groupByTeam(), []);

  // Calculate deck size + match status
  const deckSize = useMemo(
    () => Object.values(roomDesk).reduce((sum, n) => sum + n, 0),
    [roomDesk],
  );
  const matched = deckSize === playerCount;
  const diff = playerCount - deckSize; // positive: missing, negative: too many

  // Per-team subtotal (for section header)
  const teamSubtotal = useMemo(() => {
    const totals: Record<Team, number> = { wolf: 0, village: 0, solo: 0 };
    for (const [cardId, count] of Object.entries(roomDesk)) {
      const card = grouped.wolf
        .concat(grouped.village)
        .concat(grouped.solo)
        .find((c) => c.id === cardId);
      if (card) totals[card.team] += count;
    }
    return totals;
  }, [roomDesk, grouped]);

  return (
    <div className="fixed inset-0 z-40 bg-bg-base flex flex-col animate-fade-in">
      {/* Sticky header */}
      <div className="shrink-0 px-4 pt-5">
        <div className="flex items-center gap-3 mb-4">
          <button
            type="button"
            onClick={onClose}
            aria-label="Quay lại lobby"
            className="w-8 h-8 bg-transparent border border-bg-surface-hi rounded-[8px] text-text-primary flex items-center justify-center active:scale-95"
          >
            <ArrowLeft size={15} aria-hidden />
          </button>
          <div>
            <h1 className="text-text-primary text-base font-medium m-0">Sửa bộ bài</h1>
            <p className="text-text-secondary text-[11px] m-0">
              Bấm để thêm · Giữ để bớt
            </p>
          </div>
        </div>

        {/* Deck counter card */}
        <div
          className="rounded-[12px] p-3 mb-4 flex items-center justify-between"
          style={{
            background: matched
              ? 'rgba(74, 107, 42, 0.12)'
              : 'rgba(232, 155, 60, 0.08)',
            border: matched
              ? '1px solid rgba(74, 107, 42, 0.4)'
              : '1px solid rgba(232, 155, 60, 0.4)',
          }}
        >
          <div>
            <div className="text-text-secondary text-[10px] font-medium tracking-wider mb-0.5">
              SỐ THẺ HIỆN TẠI
            </div>
            <div className="text-[22px] font-medium">
              <span style={{ color: matched ? '#D4E8B0' : '#E89B3C' }}>{deckSize}</span>
              <span className="text-text-secondary text-sm"> / {playerCount} thẻ</span>
            </div>
          </div>
          {matched ? (
            <div
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1"
              style={{ background: 'rgba(74, 107, 42, 0.25)' }}
            >
              <Check size={13} style={{ color: '#D4E8B0' }} aria-hidden />
              <span className="text-[11px] font-medium" style={{ color: '#D4E8B0' }}>
                Đủ thẻ
              </span>
            </div>
          ) : (
            <div
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1"
              style={{ background: 'rgba(232, 155, 60, 0.18)' }}
            >
              <AlertTriangle size={13} className="text-accent" aria-hidden />
              <span className="text-[11px] font-medium text-accent">
                {diff > 0 ? `Thiếu ${diff} thẻ` : `Thừa ${-diff} thẻ`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable body — Golden Rule 1 */}
      <div className="scrollable flex-1 min-h-0 overflow-y-auto px-4 pb-7">
        {(['wolf', 'village', 'solo'] as const).map((team) => {
          const info = TEAM_INFO[team];
          const cards = grouped[team];
          const subtotal = teamSubtotal[team];
          return (
            <div key={team} className="mb-5">
              <div className="flex items-center gap-1.5 mb-2.5">
                <div
                  className="w-2 h-2 rounded-sm"
                  style={{ background: info.accentColor }}
                  aria-hidden
                />
                <span className="text-text-primary text-[11px] font-medium tracking-wider uppercase">
                  {info.label}
                </span>
                <span className="text-text-secondary text-[11px]">
                  · {subtotal} thẻ
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {cards.map((card) => (
                  <CardCellWithCounter
                    key={card.id}
                    card={card}
                    count={roomDesk[card.id] ?? 0}
                    onIncrement={() => onIncrement(card.id)}
                    onDecrement={() => onDecrement(card.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
