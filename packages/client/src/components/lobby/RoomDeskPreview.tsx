import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Layers as CardsIcon, Pencil } from 'lucide-react';
import type { Card } from '@werewolf/shared';
import { CARDS, TEAM_INFO } from '@werewolf/shared';
import { CardDetailDialog } from '../cards/CardDetailDialog';

interface RoomDeskPreviewProps {
  roomDesk: Record<string, number>;
  isHost: boolean;
  onEdit: () => void;
}

/**
 * Lobby card: collapsible "Bộ bài đêm nay" showing current room desk.
 * Visible to all players (read-only); host also sees an Edit button.
 *
 * Tapping a chip opens the existing CardDetailDialog from Phase 2.1.
 *
 * Always shown when there are cards; if deck is empty, shows an empty state
 * with a "Sửa bộ bài" CTA (host) or hint (player).
 */
export function RoomDeskPreview({ roomDesk, isHost, onEdit }: RoomDeskPreviewProps) {
  const [expanded, setExpanded] = useState(true);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const totalCards = useMemo(
    () => Object.values(roomDesk).reduce((sum, n) => sum + n, 0),
    [roomDesk],
  );

  // Build list of {card, count}, ordered by team (wolf → village → solo)
  // matching original CARDS array order within each team
  const items = useMemo(() => {
    const list: Array<{ card: Card; count: number }> = [];
    for (const card of CARDS) {
      const count = roomDesk[card.id] ?? 0;
      if (count > 0) list.push({ card, count });
    }
    return list;
  }, [roomDesk]);

  const isEmpty = totalCards === 0;

  return (
    <>
      <div
        className="rounded-[12px] mb-3"
        style={{
          background: 'rgba(232, 155, 60, 0.08)',
          border: '1px solid rgba(232, 155, 60, 0.25)',
        }}
      >
        {/* Header row */}
        <button
          type="button"
          onClick={() => !isEmpty && setExpanded((v) => !v)}
          aria-label={expanded ? 'Thu gọn bộ bài' : 'Mở bộ bài đêm nay'}
          aria-expanded={expanded}
          className="w-full bg-transparent border-0 p-3 flex items-center justify-between cursor-pointer"
          style={{ cursor: isEmpty ? 'default' : 'pointer' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <CardsIcon size={16} className="text-accent shrink-0" aria-hidden />
            <div className="text-left min-w-0">
              <div className="text-text-primary text-[13px] font-medium">
                Bộ bài đêm nay
              </div>
              <div className="text-text-secondary text-[11px] truncate">
                {isEmpty
                  ? isHost
                    ? 'Chưa có thẻ nào · Bấm Sửa để chọn'
                    : 'Chủ phòng chưa chọn thẻ nào'
                  : `${totalCards} thẻ · Bấm để ${expanded ? 'thu gọn' : 'mở'}`}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isHost && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                aria-label="Sửa bộ bài"
                className="bg-transparent rounded-md px-2 py-1 flex items-center gap-1 text-accent text-[11px] font-medium active:scale-95"
                style={{ border: '1px solid rgba(232, 155, 60, 0.4)' }}
              >
                <Pencil size={12} aria-hidden /> Sửa
              </button>
            )}
            {!isEmpty &&
              (expanded ? (
                <ChevronUp size={16} className="text-text-secondary" aria-hidden />
              ) : (
                <ChevronDown size={16} className="text-text-secondary" aria-hidden />
              ))}
          </div>
        </button>

        {/* Expanded chips */}
        {expanded && !isEmpty && (
          <div className="px-3 pb-3">
            <div className="flex flex-wrap gap-1.5">
              {items.map(({ card, count }) => {
                const info = TEAM_INFO[card.team];
                const gradientByTeam: Record<typeof card.team, string> = {
                  wolf: 'linear-gradient(180deg, #3A2A2A, #1F2419)',
                  village: 'linear-gradient(180deg, #2D3225, #1F2419)',
                  solo: 'linear-gradient(180deg, #2A2A3A, #1F2419)',
                };
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setSelectedCard(card)}
                    aria-label={`${card.name}, ${count} thẻ. Bấm để xem chi tiết.`}
                    className="bg-bg-surface rounded-[8px] px-2.5 py-1.5 flex items-center gap-1.5 active:scale-95"
                    style={{
                      border: `1px solid ${info.accentColor}59`,
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-sm shrink-0"
                      style={{ background: gradientByTeam[card.team] }}
                      aria-hidden
                    />
                    <span className="text-text-primary text-[12px] font-medium">
                      ×{count}
                    </span>
                    <span className="text-text-primary text-[12px]">{card.name}</span>
                  </button>
                );
              })}
            </div>
            <div className="text-text-secondary text-[10px] mt-2 italic">
              Bấm vào vai để xem chi tiết
            </div>
          </div>
        )}
      </div>

      <CardDetailDialog card={selectedCard} onClose={() => setSelectedCard(null)} />
    </>
  );
}
