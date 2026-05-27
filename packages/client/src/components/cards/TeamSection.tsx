import { Info } from 'lucide-react';
import type { Card, Team } from '@werewolf/shared';
import { TEAM_INFO } from '@werewolf/shared';
import { CardCell } from './CardCell';

interface TeamSectionProps {
  team: Team;
  cards: Card[];
  onCardClick: (card: Card) => void;
  onInfoClick: () => void;
}

export function TeamSection({
  team,
  cards,
  onCardClick,
  onInfoClick,
}: TeamSectionProps) {
  const info = TEAM_INFO[team];

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-sm"
            style={{ background: info.accentColor }}
            aria-hidden
          />
          <span className="text-text-primary text-xs font-medium tracking-wider uppercase">
            {info.label}
          </span>
          <span className="text-text-secondary text-[11px]">
            · {cards.length} vai trò
          </span>
        </div>
        <button
          type="button"
          onClick={onInfoClick}
          aria-label={`Thông tin ${info.label}`}
          className="bg-transparent border-0 text-text-secondary p-1 active:scale-90"
        >
          <Info size={16} aria-hidden />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {cards.map((card) => (
          <CardCell key={card.id} card={card} onClick={() => onCardClick(card)} />
        ))}
      </div>
    </div>
  );
}
