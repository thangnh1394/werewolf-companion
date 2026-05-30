# PLAN — Phase 2.6: End Game Flow

> **Agent:** Architect
> **Sub-phase:** 2.6 (LAST)
> **Builds on:** Phase 2.4 dealing + Phase 2.5 reveal

## Architecture overview

End-game is a pure reducer: `LobbyState → LobbyState` that:
1. Clears `assignments` (clean slate)
2. Resets `isReady` for non-host players (host stays ready, matching initial-room behavior)
3. Sets `phase: 'lobby'`
4. PRESERVES `roomDesk` (next round reuses same deck)

The handler validates (host + playing-phase only), applies reducer, persists to SQLite, then broadcasts `GAME_ENDED`. Clients receive `GAME_ENDED`, state machine transitions `playing → in_lobby`, clear local `yourCard`, LobbyScreen re-renders. No server-side card data ever leaks (assignments cleared before broadcast; `GAME_ENDED` carries no payload).

Refresh during transition is handled by the existing `STATE_SNAPSHOT` flow — a player reconnecting after end_game gets `phase: 'lobby'`, no `yourCard`, and the guarded transition routes them to `in_lobby` (since `snapshotIsPlaying` is now false). Works for free.

## Shared changes

```ts
// Client → Server
export const EndGameMessageSchema = z.object({
  type: z.literal('END_GAME'),
});

// Server → Client (broadcast, no payload — privacy)
export const GameEndedMessageSchema = z.object({
  type: z.literal('GAME_ENDED'),
});
```

Add to `ClientMessageSchema` and `ServerMessageSchema` discriminated unions.

## Server reducer

```ts
// lobbyState.ts
export function endGame(state: LobbyState): LobbyState {
  // Reset isReady: host stays true, non-host → false
  const players = new Map<SessionId, PublicPlayer>();
  for (const [sid, p] of state.players) {
    const isHostPlayer = p.sessionId === state.hostSessionId;
    players.set(sid, { ...p, isReady: isHostPlayer });
  }

  return {
    ...state,
    phase: 'lobby',
    assignments: new Map(),
    players,
    // roomDesk unchanged (preserved for next round)
  };
}
```

## Server handler

```ts
private async handleEndGame(requesterId: SessionId): Promise<void> {
  // Validate: only host
  if (this.lobby.hostSessionId !== requesterId) return;
  // Validate: only during playing phase
  if (this.lobby.phase !== 'playing') return;

  this.lobby = endGame(this.lobby);
  await this.persistState();
  await this.touchActivity();

  this.broadcastMessage({ type: 'GAME_ENDED' });
}
```

Dispatch case in `onMessage`:
```ts
case 'END_GAME':
  if (!data) { sender.close(1008, 'not_joined'); return; }
  await this.handleEndGame(data.sessionId);
  return;
```

## Client state machine

Add `GAME_ENDED` event handler in `playing` state:

```ts
playing: {
  on: {
    // ... existing
    GAME_ENDED: {
      target: 'in_lobby',
      actions: 'clearCard',
    },
  },
},
```

New action:
```ts
clearCard: assign({
  yourCard: () => null,
}),
```

Note: `STATE_SNAPSHOT` event already updates context with new players + roomDesk (already implemented in Phase 2.4). When server sends another snapshot after end, `applySnapshot` will set `yourCard: undefined` from snapshot (since `assignments` is empty server-side, `yourCard` field absent). But for the immediate `GAME_ENDED` transition we should clear it explicitly via `clearCard` to be safe — server might not send another snapshot if no state delta.

Actually re-examining: server's `endGame` does change players (ready states reset) and assignments. Should we broadcast a new STATE_SNAPSHOT? Let me check existing pattern.

**Current pattern**: server broadcasts diff events (`PLAYER_UPDATED`, `ROOM_DESK_UPDATED`), client applies them locally. We could:
- Option A: broadcast many small events (PLAYER_UPDATED ×N for ready reset)
- Option B: just broadcast `GAME_ENDED`, client clears local state, then on next reconnect a snapshot delivers full state
- Option C: broadcast `GAME_ENDED` + send fresh STATE_SNAPSHOT to all clients

**Best**: Option B — simplest. Client receives `GAME_ENDED`, state machine action resets local players' isReady to match server semantics (non-host false, host true) using `selfSessionId === hostSessionId` check. Or even simpler: server broadcasts `GAME_ENDED` AND a series of `PLAYER_UPDATED` for each reset player.

**Going with Option C variant**: server broadcasts `GAME_ENDED`, then `PLAYER_UPDATED` for each player whose state changed. This is cleaner — relies on the existing `PLAYER_UPDATED` handler to update player list. No new state machine logic for player resets.

Updated server handler:
```ts
private async handleEndGame(requesterId: SessionId): Promise<void> {
  if (this.lobby.hostSessionId !== requesterId) return;
  if (this.lobby.phase !== 'playing') return;

  const before = this.lobby.players;
  this.lobby = endGame(this.lobby);
  await this.persistState();
  await this.touchActivity();

  this.broadcastMessage({ type: 'GAME_ENDED' });

  // Broadcast each changed player so clients reset their UI
  for (const [sid, p] of this.lobby.players) {
    const prev = before.get(sid);
    if (prev && prev.isReady !== p.isReady) {
      this.broadcastMessage({ type: 'PLAYER_UPDATED', player: p });
    }
  }
}
```

Then state machine only needs:
```ts
playing: {
  on: {
    GAME_ENDED: {
      target: 'in_lobby',
      actions: 'clearCard',
    },
    PLAYER_UPDATED: { actions: 'upsertPlayer' },  // already exists for this state
  },
},
```

Wait — does `playing` state already handle `PLAYER_UPDATED`? Let me confirm from Phase 2.4 setup. Yes, Phase 2.4 added PLAYER_JOINED/UPDATED/LEFT handlers to `playing` state for late updates. So we're good.

But there's a race: GAME_ENDED arrives first, transitions to `in_lobby`. Then PLAYER_UPDATED events arrive in `in_lobby` state, where they're also handled. Good.

## Client useLobby

```ts
const endGame = useCallback(() => {
  const s = socketRef.current;
  if (s) sendMessage(s, { type: 'END_GAME' });
}, []);

actions: { setReady, kickPlayer, startGame, leave, setCardCount, endGame }
```

## Client PlayingScreen

Add "Kết thúc trận" button (host only) at bottom of the screen:

```tsx
{isHost && (
  <button
    type="button"
    onClick={onEndGame}
    className="mt-4 inline-flex items-center gap-1.5 bg-bg-surface border border-bg-surface-hi rounded-[10px] px-5 py-2.5 text-text-primary text-[13px] font-medium active:scale-95"
  >
    <Square size={14} aria-hidden /> Kết thúc trận
  </button>
)}
```

Icon: `Square` (lucide-react, suggesting "stop") or `Flag` (more semantic for "end game").

LobbyScreen passes `isHost` + `onEndGame` callback to PlayingScreen.

## Persistence

No schema change to SerializedState — `assignments` Map already round-trips (set to empty by reducer), `players` already round-trips (with new isReady values). Works for free.

## File tree changes

```
packages/
├── shared/src/messages.ts        MODIFY — add EndGame + GameEnded schemas
├── server/src/
│   ├── lobby/
│   │   ├── lobbyState.ts          MODIFY — add endGame reducer
│   │   └── lobbyState.test.ts     MODIFY — add ~5 tests for endGame
│   └── server.ts                  MODIFY — add END_GAME case + handleEndGame
└── client/src/
    ├── machines/lobbyMachine.ts   MODIFY — GAME_ENDED event + clearCard action
    ├── hooks/useLobby.ts          MODIFY — expose endGame action
    └── components/
        ├── game/PlayingScreen.tsx MODIFY — add "Kết thúc trận" button (host only)
        └── lobby/LobbyScreen.tsx  MODIFY — pass isHost + onEndGame to PlayingScreen
```

## Tests to add (server)

```ts
describe('endGame', () => {
  it('transitions phase from playing to lobby');
  it('clears assignments completely');
  it('preserves roomDesk unchanged');
  it('resets isReady to false for non-host players');
  it('keeps host isReady true');
});
```

5 tests → total 51.

## Privacy audit checklist (QA must verify)

- [ ] `GAME_ENDED` broadcast has NO card information (empty payload)
- [ ] `endGame` reducer clears assignments BEFORE any broadcast
- [ ] No card data in `PLAYER_UPDATED` events after end (player data only contains public fields)
- [ ] `STATE_SNAPSHOT` after end_game has no `yourCard` (correct — server uses `assignments.get(sessionId)` which is empty)

## Risks + mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Race: GAME_ENDED arrives before transition completes | Low | XState handles event ordering atomically |
| Player stuck on PlayingScreen if event missed | Low | Refresh → STATE_SNAPSHOT with phase: lobby → routes correctly via guard |
| Host accidentally ends game | Medium | User chose NO confirm dialog (Decision 3) — acceptable per their UX call |
| Assignments leak in PLAYER_UPDATED after end | Low | PublicPlayer schema doesn't include cardId; safe by type |
| RoomDesk accidentally cleared | Low | Reducer explicitly preserves roomDesk; tests assert this |

## Bundle impact

- Server: ~0.3 KB (reducer + handler)
- Client: ~0.5 KB gzipped (button + state machine event)
- Total: ~0.8 KB gzipped (within ≤1 KB target)
