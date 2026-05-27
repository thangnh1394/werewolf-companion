import type { Team } from '@werewolf/shared';
import { TEAM_INFO } from '@werewolf/shared';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';

interface TeamExplainDialogProps {
  team: Team | null;
  onClose: () => void;
}

/**
 * Modal explaining a team's objective and win condition.
 * Opens from the info icon on each team's section header in Main Desk.
 */
export function TeamExplainDialog({ team, onClose }: TeamExplainDialogProps) {
  if (!team) return null;

  const info = TEAM_INFO[team];

  // Team-specific emoji as visual anchor (matches placeholder thumbnails).
  const emojiByTeam: Record<Team, string> = {
    wolf: '🐺',
    village: '🏘️',
    solo: '🌑',
  };

  return (
    <Dialog open onClose={onClose} ariaLabel={`Thông tin ${info.label}`}>
      <div
        className="w-14 h-14 rounded-[14px] flex items-center justify-center mb-4"
        style={{ background: `${info.accentColor}26` /* 15% alpha */ }}
      >
        <span className="text-[28px]" aria-hidden>
          {emojiByTeam[team]}
        </span>
      </div>

      <h2 className="text-text-primary text-lg font-medium mb-1">{info.label}</h2>
      <p className="text-text-secondary text-xs mb-4">
        {info.sublabel}
      </p>

      <div className="mb-3.5">
        <div className="text-accent text-[11px] font-medium mb-1 tracking-wider">
          MỤC TIÊU
        </div>
        <p className="text-text-primary text-sm leading-relaxed">{info.objective}</p>
      </div>

      <div className="mb-5">
        <div className="text-accent text-[11px] font-medium mb-1 tracking-wider">
          ĐIỀU KIỆN THẮNG
        </div>
        <p className="text-text-primary text-sm leading-relaxed">
          {info.winCondition}
        </p>
      </div>

      <Button fullWidth onClick={onClose}>
        Đã hiểu
      </Button>
    </Dialog>
  );
}
