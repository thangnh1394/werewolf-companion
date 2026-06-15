import { useState } from 'react';
import { Flag, Flame, Info } from 'lucide-react';
import { findCard, type CurrentTurn, type TransitionVariant } from '@werewolf/shared';
import { formatRoomCode } from '../../lib/format';
import { Button } from '../ui/Button';
import { RevealCard } from './RevealCard';
import { TurnIndicator } from './TurnIndicator';
import { CardDetailDialog } from '../cards/CardDetailDialog';
import { GameStartTransition } from './GameStartTransition';

interface PlayingScreenProps {
  roomCode: string;
  cardId: string | null;
  isHost: boolean;
  onEndGame: () => void;
  /**
   * Phase 3.4: game-start transition variant chosen by server.
   * Null when joining/refreshing mid-game (no transition to show).
   */
  transitionVariant: TransitionVariant | null;
  /** Current game turn. Null until server confirms game started. Phase 4.2 feature. */
  currentTurn: CurrentTurn | null;
  /** GM-only callback to advance the turn. Phase 4.2 feature. */
  onAdvanceTurn: () => void;
}

/**
 * Phase 2.5 / 3.4: Tap-and-hold reveal screen.
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
 *
 * Phase 3.4: When `transitionVariant` is set, a fullscreen overlay plays an
 * animation BEFORE the card UI becomes interactive. The overlay auto-dismisses
 * when the variant duration elapses.
 */
export function PlayingScreen({
  roomCode,
  cardId,
  isHost,
  onEndGame,
  transitionVariant,
  currentTurn,
  onAdvanceTurn,
}: PlayingScreenProps) {
  const card = cardId ? findCard(cardId) : undefined;
  const [showDetail, setShowDetail] = useState(false);

  // Local state tracks whether the start transition is still playing.
  // Init: if server told us about a variant, run it; otherwise skip (refresh case).
  const [transitionActive, setTransitionActive] = useState<boolean>(
    transitionVariant !== null,
  );

  return (
    <div
      className="flex-1 flex flex-col min-h-0 px-4 pt-5 pb-7 animate-fade-in relative"
      style={{
        // Phase 2.5 bug fix: tap-and-hold on text labels triggers Chrome's
        // text-selection menu (Lens, translate, copy). Disable text selection
        // and the iOS/Android long-press callout on the entire playing screen.
        // The "Xem chi tiết" button still works (it's a button, not text).
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
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
        {isHost ? (
          <div className="flex flex-col items-center text-center px-6 w-full">
            {currentTurn && (
              <>
                <TurnIndicator turn={currentTurn} variant="large" />
                <p className="text-text-secondary text-sm leading-relaxed max-w-[280px] mt-2 mb-6">
                  {currentTurn.phase === 'night'
                    ? 'Sói tỉnh dậy. Hãy gọi từng vai trò thức dậy theo thứ tự.'
                    : 'Cả làng tỉnh giấc. Bắt đầu thảo luận và bỏ phiếu treo cổ.'}
                </p>
                <Button
                  fullWidth
                  variant="primary"
                  onClick={onAdvanceTurn}
                  aria-label={currentTurn.phase === 'night' ? 'Kết thúc đêm' : 'Kết thúc ngày'}
                >
                  {currentTurn.phase === 'night' ? 'Kết thúc đêm' : 'Kết thúc ngày'}
                </Button>
              </>
            )}
          </div>
        ) : !card ? (
          <>
            {currentTurn && (
              <div className="flex justify-center mb-3">
                <TurnIndicator turn={currentTurn} variant="compact" />
              </div>
            )}
            <p className="text-text-secondary text-sm italic">Đang nhận bài...</p>
          </>
        ) : (
          <>
            {currentTurn && (
              <div className="flex justify-center mb-3">
                <TurnIndicator turn={currentTurn} variant="compact" />
              </div>
            )}
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

      {/* End Game button — GM only, always visible (GM has no card to reveal) */}
      {isHost && (
        <div className="shrink-0 mt-4 pt-3 border-t border-bg-surface">
          <button
            type="button"
            onClick={onEndGame}
            className="w-full bg-bg-surface border border-bg-surface-hi rounded-xl py-2.5 px-4 text-text-primary text-sm font-medium inline-flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <Flag size={14} className="text-accent" aria-hidden />
            Kết thúc trận
          </button>
        </div>
      )}

      <CardDetailDialog
        card={showDetail && card ? card : null}
        onClose={() => setShowDetail(false)}
      />

      {/* Phase 3.4: Game-start transition overlay (covers everything during animation) */}
      {transitionActive && transitionVariant && (
        <GameStartTransition
          variant={transitionVariant}
          onComplete={() => setTransitionActive(false)}
        />
      )}
    </div>
  );
}
