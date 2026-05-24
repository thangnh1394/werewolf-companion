import { Fragment, useMemo } from 'react';
import type { PublicPlayer, SessionId } from '@werewolf/shared';
import { PlayerRow } from './PlayerRow';

interface PlayerListProps {
  players: PublicPlayer[];
  selfSessionId: SessionId | null;
  hostSessionId: SessionId | null;
  onKick?: (targetSessionId: SessionId) => void;
}

/**
 * Sort order (matches DESIGN.md spec):
 *   1. Self — always pinned at top
 *   2. Not-ready players — sorted by joinedAt
 *   3. Divider (only if both groups exist)
 *   4. Ready players — sorted by joinedAt
 */
function sortPlayers(
  players: PublicPlayer[],
  selfSessionId: SessionId | null,
): { notReady: PublicPlayer[]; ready: PublicPlayer[]; self: PublicPlayer | null } {
  let self: PublicPlayer | null = null;
  const notReady: PublicPlayer[] = [];
  const ready: PublicPlayer[] = [];

  for (const p of players) {
    if (p.sessionId === selfSessionId) {
      self = p;
      continue;
    }
    if (p.isReady) ready.push(p);
    else notReady.push(p);
  }

  notReady.sort((a, b) => a.joinedAt - b.joinedAt);
  ready.sort((a, b) => a.joinedAt - b.joinedAt);

  return { notReady, ready, self };
}

export function PlayerList({
  players,
  selfSessionId,
  hostSessionId,
  onKick,
}: PlayerListProps) {
  const viewerIsHost = selfSessionId !== null && selfSessionId === hostSessionId;

  const { notReady, ready, self } = useMemo(
    () => sortPlayers(players, selfSessionId),
    [players, selfSessionId],
  );

  const renderRow = (p: PublicPlayer) => (
    <PlayerRow
      key={p.sessionId}
      player={p}
      isSelf={p.sessionId === selfSessionId}
      viewerIsHost={viewerIsHost}
      onKick={onKick ? () => onKick(p.sessionId) : undefined}
    />
  );

  const showDivider = notReady.length > 0 && ready.length > 0;

  return (
    <div className="flex flex-col gap-1.5">
      {self && renderRow(self)}
      {notReady.map(renderRow)}
      {showDivider && (
        <div className="h-px bg-bg-surface my-2" aria-hidden />
      )}
      {ready.map(renderRow)}
    </div>
  );
}
