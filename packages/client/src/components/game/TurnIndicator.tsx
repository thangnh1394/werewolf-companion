import type { CurrentTurn } from '@werewolf/shared';
import { Moon, Sun } from 'lucide-react';

interface TurnIndicatorProps {
  turn: CurrentTurn;
  variant: 'large' | 'compact';
}

export function TurnIndicator({ turn, variant }: TurnIndicatorProps) {
  const isNight = turn.phase === 'night';
  const Icon = isNight ? Moon : Sun;

  if (variant === 'compact') {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bg-surface text-text-secondary text-xs"
        role="status"
        aria-label={`${isNight ? 'Đêm' : 'Sáng'} ngày ${turn.day}`}
      >
        <Icon size={12} aria-hidden />
        <span>{isNight ? 'Đêm' : 'Sáng'} ngày {turn.day}</span>
      </div>
    );
  }

  // large variant — GM view
  const label = isNight ? 'ĐÊM' : 'SÁNG';
  return (
    <div className="flex flex-col items-center gap-2 py-4" role="status">
      <div className={`flex items-center gap-2 ${isNight ? 'text-text-primary' : 'text-accent'}`}>
        <Icon size={20} aria-hidden />
        <span className="text-2xl font-medium tracking-wider">{label}</span>
      </div>
      <div className="text-text-secondary text-sm">Ngày {turn.day}</div>
    </div>
  );
}
