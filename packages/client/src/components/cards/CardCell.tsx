import type { Card } from '@werewolf/shared';

interface CardCellProps {
  card: Card;
  onClick: () => void;
}

/**
 * One cell in the 3-column card grid.
 * Shows: thumbnail image, name, optional "PHỔ BIẾN" badge.
 */
export function CardCell({ card, onClick }: CardCellProps) {
  // Team-specific gradient for image background (used while real photo loads
  // or as fallback if photo missing).
  const gradientByTeam: Record<typeof card.team, string> = {
    wolf: 'linear-gradient(180deg, #3A2A2A, #1F2419)',
    village: 'linear-gradient(180deg, #2D3225, #1F2419)',
    solo: 'linear-gradient(180deg, #2A2A3A, #1F2419)',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-bg-surface rounded-[10px] p-2 relative text-left active:scale-[0.98] transition-transform border-0"
      aria-label={`Xem chi tiết vai trò ${card.name}`}
    >
      <div
        className="aspect-square rounded-md flex items-center justify-center mb-1.5 overflow-hidden"
        style={{ background: gradientByTeam[card.team] }}
      >
        <img
          src={card.imageUrl}
          alt=""
          loading="lazy"
          className="w-full h-full object-cover"
          aria-hidden
        />
      </div>
      <div className="text-text-primary text-[11px] font-medium text-center leading-tight">
        {card.name}
      </div>
      {card.popular && (
        <div className="absolute top-1 right-1 bg-accent text-bg-base text-[8px] font-medium px-1.5 py-0.5 rounded tracking-wider">
          PHỔ BIẾN
        </div>
      )}
    </button>
  );
}
