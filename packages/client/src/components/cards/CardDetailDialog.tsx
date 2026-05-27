import { AlertTriangle, X } from 'lucide-react';
import type { Card } from '@werewolf/shared';
import { TEAM_INFO } from '@werewolf/shared';

interface CardDetailDialogProps {
  card: Card | null;
  onClose: () => void;
}

/**
 * Tap-to-open dialog showing full role information:
 * sticky header (close + image + name + team badge), scrollable body
 * (Khả năng / Thời điểm dậy / Lưu ý / photographer credit).
 *
 * Follows Golden Rule 1 (unified scroll style) for the body.
 */
export function CardDetailDialog({ card, onClose }: CardDetailDialogProps) {
  if (!card) return null;

  const teamInfo = TEAM_INFO[card.team];

  const gradientByTeam: Record<typeof card.team, string> = {
    wolf: 'linear-gradient(180deg, #3A2A2A, #1F2419)',
    village: 'linear-gradient(180deg, #2D3225, #1F2419)',
    solo: 'linear-gradient(180deg, #2A2A3A, #1F2419)',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Chi tiết vai trò ${card.name}`}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center p-5 pt-10 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-bg-base border border-bg-surface-hi rounded-[18px] p-5 w-full max-w-[340px] flex flex-col"
        style={{ maxHeight: 'calc(100dvh - 80px)' }}
      >
        {/* Sticky head */}
        <div className="shrink-0">
          <div className="flex justify-end mb-2">
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="w-7 h-7 bg-transparent border-0 text-text-secondary flex items-center justify-center active:scale-90"
            >
              <X size={18} aria-hidden />
            </button>
          </div>

          <div
            className="aspect-square rounded-[14px] flex items-center justify-center mb-3.5 mx-auto overflow-hidden"
            style={{
              background: gradientByTeam[card.team],
              maxWidth: '180px',
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
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 mb-1.5"
              style={{
                background: `${teamInfo.accentColor}26`,
                border: `1px solid ${teamInfo.accentColor}59`,
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: teamInfo.accentColor }}
                aria-hidden
              />
              <span
                className="text-[11px] font-medium tracking-wider uppercase"
                style={{ color: teamInfo.accentColor }}
              >
                {teamInfo.label}
              </span>
            </div>
            <div className="text-text-primary text-[22px] font-medium">
              {card.name}
            </div>
          </div>
        </div>

        {/* Scrollable body — follows Golden Rule 1 */}
        <div className="scrollable flex-1 min-h-0 overflow-y-auto pr-1">
          <div className="bg-bg-surface border border-bg-surface-hi rounded-[12px] p-3.5 mb-2.5">
            <div className="text-accent text-[10px] font-medium mb-1.5 tracking-wider">
              KHẢ NĂNG
            </div>
            <p className="text-text-primary text-[13px] leading-relaxed m-0">
              {card.ability}
            </p>
          </div>

          <div className="bg-bg-surface border border-bg-surface-hi rounded-[12px] p-3.5 mb-2.5">
            <div className="text-accent text-[10px] font-medium mb-1.5 tracking-wider">
              THỜI ĐIỂM DẬY
            </div>
            <p className="text-text-primary text-[13px] leading-relaxed m-0">
              {card.wakeTime}
            </p>
          </div>

          {card.notes && (
            <div
              className="rounded-[12px] p-3.5 mb-3"
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

          {card.photographer && (
            <div className="text-center">
              <span className="text-text-secondary text-[10px] italic">
                Ảnh: {card.photographer} / Pexels
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
