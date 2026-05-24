import { Crown, UserMinus } from 'lucide-react';
import type { PublicPlayer } from '@werewolf/shared';
import { Avatar } from '../ui/Avatar';

interface PlayerRowProps {
  player: PublicPlayer;
  isSelf: boolean;
  /** True if the local viewer is the host (shows kick button on non-self rows) */
  viewerIsHost: boolean;
  onKick?: () => void;
}

export function PlayerRow({ player, isSelf, viewerIsHost, onKick }: PlayerRowProps) {
  return (
    <div
      className={[
        'flex items-center justify-between bg-bg-surface rounded-[12px] px-3 py-2.5',
        isSelf ? 'border-l-[3px] border-accent' : '',
      ].join(' ')}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <Avatar name={player.displayName} isHost={player.isHost} />
        <div className="min-w-0">
          <div className="text-text-primary text-sm font-medium truncate">
            {player.displayName}
            {isSelf && (
              <span className="text-text-secondary text-[11px] ml-1.5">(bạn)</span>
            )}
          </div>
          {player.isHost && (
            <div className="text-accent text-[11px] flex items-center gap-1">
              <Crown size={11} aria-hidden /> Quản trò
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {player.isReady ? (
          <span className="bg-ready-bg text-ready-text text-[11px] font-medium px-2.5 py-1 rounded-[6px]">
            Sẵn sàng
          </span>
        ) : (
          <span className="text-text-secondary text-[11px] italic px-2.5 py-1">
            Đang nghĩ...
          </span>
        )}
        {viewerIsHost && !isSelf && onKick && (
          <button
            type="button"
            onClick={onKick}
            aria-label={`Mời ${player.displayName} ra khỏi phòng`}
            className="bg-transparent border border-danger-border rounded-[6px] p-1.5 text-danger active:scale-90"
          >
            <UserMinus size={14} aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
