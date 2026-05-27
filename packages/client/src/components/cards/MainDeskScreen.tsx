import { useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { Card, Team } from '@werewolf/shared';
import { groupByTeam, CARDS } from '@werewolf/shared';
import { TeamSection } from './TeamSection';
import { CardDetailDialog } from './CardDetailDialog';
import { TeamExplainDialog } from './TeamExplainDialog';

interface MainDeskScreenProps {
  onClose: () => void;
}

/**
 * Full-screen Main Desk view — browse all 15 roles grouped by team.
 *
 * Layout follows Golden Rule 1:
 *   sticky header (back button + title)
 *   scrollable body (3 team sections)
 *
 * Tapping a card → CardDetailDialog
 * Tapping a team info icon → TeamExplainDialog
 */
export function MainDeskScreen({ onClose }: MainDeskScreenProps) {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [explainTeam, setExplainTeam] = useState<Team | null>(null);

  const grouped = useMemo(() => groupByTeam(), []);
  const totalCount = CARDS.length;

  return (
    <div className="fixed inset-0 z-40 bg-bg-base flex flex-col animate-fade-in">
      {/* Sticky header */}
      <div className="shrink-0 px-4 pt-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Quay lại lobby"
            className="w-8 h-8 bg-transparent border border-bg-surface-hi rounded-[8px] text-text-primary flex items-center justify-center active:scale-95"
          >
            <ArrowLeft size={15} aria-hidden />
          </button>
          <div>
            <h1 className="text-text-primary text-base font-medium m-0">
              Bộ bài đầy đủ
            </h1>
            <p className="text-text-secondary text-[11px] m-0">
              {totalCount} vai trò trong 3 phe
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable body — Golden Rule 1 */}
      <div className="scrollable flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-7">
        <TeamSection
          team="wolf"
          cards={grouped.wolf}
          onCardClick={setSelectedCard}
          onInfoClick={() => setExplainTeam('wolf')}
        />
        <TeamSection
          team="village"
          cards={grouped.village}
          onCardClick={setSelectedCard}
          onInfoClick={() => setExplainTeam('village')}
        />
        <TeamSection
          team="solo"
          cards={grouped.solo}
          onCardClick={setSelectedCard}
          onInfoClick={() => setExplainTeam('solo')}
        />
      </div>

      <CardDetailDialog
        card={selectedCard}
        onClose={() => setSelectedCard(null)}
      />
      <TeamExplainDialog
        team={explainTeam}
        onClose={() => setExplainTeam(null)}
      />
    </div>
  );
}
