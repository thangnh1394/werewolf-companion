import { AlertTriangle, Flame } from 'lucide-react';
import { findCard, TEAM_INFO } from '@werewolf/shared';
import { formatRoomCode } from '../../lib/format';

interface PlayingScreenProps {
  roomCode: string;
  cardId: string | null;
}

/**
 * Phase 2.4 placeholder: shows the player's dealt card with full info
 * (Khả năng / Thời điểm dậy / Lưu ý), in a card format.
 *
 * Phase 2.5 will replace this with a tap-and-hold reveal mechanism
 * to hide the card from over-the-shoulder peeking.
 *
 * Layout follows Golden Rule 1: sticky header + scrollable card body.
 */
export function PlayingScreen({ roomCode, cardId }: PlayingScreenProps) {
  const card = cardId ? findCard(cardId) : undefined;

  const gradientByTeam = {
    wolf: 'linear-gradient(180deg, #3A2A2A, #1F2419)',
    village: 'linear-gradient(180deg, #2D3225, #1F2419)',
    solo: 'linear-gradient(180deg, #2A2A3A, #1F2419)',
  } as const;

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
        <div className="text-center mb-2">
          <span className="text-text-secondary text-[11px] font-medium tracking-widest">
            VAI CỦA BẠN
          </span>
        </div>
      </div>

      {/* Scrollable card body */}
      <div className="scrollable flex-1 min-h-0 overflow-y-auto pr-1">
        {!card ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-text-secondary text-sm italic">Đang nhận bài...</p>
          </div>
        ) : (
          <>
            <div
              className="bg-bg-surface rounded-[16px] p-4"
              style={{ border: `1.5px solid ${TEAM_INFO[card.team].accentColor}` }}
            >
              <div
                className="rounded-[12px] flex items-center justify-center mb-3.5 mx-auto overflow-hidden"
                style={{
                  background: gradientByTeam[card.team],
                  maxWidth: '150px',
                  aspectRatio: '1',
                }}
              >
                <img
                  src={card.imageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  aria-hidden
                />
              </div>

              <div className="text-center mb-3.5">
                <div
                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 mb-2"
                  style={{
                    background: `${TEAM_INFO[card.team].accentColor}26`,
                    border: `1px solid ${TEAM_INFO[card.team].accentColor}59`,
                  }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: TEAM_INFO[card.team].accentColor }}
                    aria-hidden
                  />
                  <span
                    className="text-[11px] font-medium tracking-wider uppercase"
                    style={{ color: TEAM_INFO[card.team].accentColor }}
                  >
                    {TEAM_INFO[card.team].label}
                  </span>
                </div>
                <div className="text-text-primary text-[24px] font-medium">
                  {card.name}
                </div>
              </div>

              <div className="bg-bg-base border border-bg-surface-hi rounded-[10px] p-3 mb-2">
                <div className="text-accent text-[10px] font-medium mb-1.5 tracking-wider">
                  KHẢ NĂNG
                </div>
                <p className="text-text-primary text-[13px] leading-relaxed m-0">
                  {card.ability}
                </p>
              </div>

              <div className="bg-bg-base border border-bg-surface-hi rounded-[10px] p-3 mb-2">
                <div className="text-accent text-[10px] font-medium mb-1.5 tracking-wider">
                  THỜI ĐIỂM DẬY
                </div>
                <p className="text-text-primary text-[13px] leading-relaxed m-0">
                  {card.wakeTime}
                </p>
              </div>

              {card.notes && (
                <div
                  className="rounded-[10px] p-3"
                  style={{
                    background: 'rgba(232, 155, 60, 0.06)',
                    border: '1px solid rgba(232, 155, 60, 0.25)',
                  }}
                >
                  <div className="text-accent text-[10px] font-medium mb-1.5 tracking-wider flex items-center gap-1">
                    <AlertTriangle size={11} aria-hidden /> LƯU Ý
                  </div>
                  <p className="text-text-primary text-[13px] leading-relaxed m-0">
                    {card.notes}
                  </p>
                </div>
              )}
            </div>

            <div
              className="mt-3 rounded-[10px] p-2.5 text-center"
              style={{
                background: 'rgba(232, 155, 60, 0.06)',
                border: '1px dashed rgba(232, 155, 60, 0.25)',
              }}
            >
              <span className="text-text-secondary text-[11px] italic">
                Phase 2.5 sẽ thêm hiệu ứng tap-and-hold để giấu bài
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
