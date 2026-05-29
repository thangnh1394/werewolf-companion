import { useState } from 'react';
import { Flame, Info } from 'lucide-react';
import { findCard } from '@werewolf/shared';
import { formatRoomCode } from '../../lib/format';
import { RevealCard } from './RevealCard';
import { CardDetailDialog } from '../cards/CardDetailDialog';

interface PlayingScreenProps {
  roomCode: string;
  cardId: string | null;
}

/**
 * Phase 2.5: Tap-and-hold reveal screen.
 *
 * Default: card is FACE-DOWN. Player presses and holds on the card to reveal
 * their role; releasing flips it back. Tilt animation during the swap.
 *
 * For full role info (Khả năng / Thời điểm dậy / Lưu ý), the player taps a
 * separate "Xem chi tiết vai trò" button outside the card to open
 * CardDetailDialog (reused from Phase 2.1).
 *
 * Tap-and-hold scope: ONLY inside the card. Buttons and header outside the
 * card don't trigger reveal.
 */
export function PlayingScreen({ roomCode, cardId }: PlayingScreenProps) {
  const card = cardId ? findCard(cardId) : undefined;
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div className="flex-1 flex flex-col min-h-0 px-4 pt-5 pb-7 animate-fade-in">
      {/* Sticky header */}
      <div className="shrink-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Flame className="text-accent" size={18} aria-hidden />
            <span className="text-text-primary text-sm font-medium">
              Phòng {formatRoomCode(roomCode)}
            </span>
          </div>
          <div
            className="rounded-md px-2.5 py-0.5"
            style={{
              background: 'rgba(216,90,48,0.15)',
              border: '1px solid rgba(216,90,48,0.35)',
            }}
          >
            <span className="text-[11px] font-medium" style={{ color: '#D85A30' }}>
              ĐANG CHƠI
            </span>
          </div>
        </div>
        <p className="text-text-secondary text-xs italic mb-3">
          "Bài đã được chia. Giữ bí mật vai của bạn..."
        </p>
        <div className="text-center mb-3">
          <span className="text-text-secondary text-[11px] font-medium tracking-widest">
            VAI CỦA BẠN
          </span>
        </div>
      </div>

      {/* Card + controls — centered vertically in remaining space */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center">
        {!card ? (
          <p className="text-text-secondary text-sm italic">Đang nhận bài...</p>
        ) : (
          <>
            <RevealCard card={card} />

            <div className="mt-5 text-center">
              <p className="text-text-primary text-sm font-medium m-0">
                Giữ vào card để xem
              </p>
              <p className="text-text-secondary text-xs mt-0.5">
                Thả tay để giấu bài lại
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowDetail(true)}
              className="mt-5 inline-flex items-center gap-1.5 bg-transparent border border-bg-surface-hi rounded-[10px] px-4 py-2.5 text-accent text-[13px] font-medium active:scale-95"
            >
              <Info size={14} aria-hidden /> Xem chi tiết vai trò
            </button>
          </>
        )}
      </div>

      <CardDetailDialog
        card={showDetail && card ? card : null}
        onClose={() => setShowDetail(false)}
      />
    </div>
  );
}
