# PLAN — Phase 2.3: Room Desk Editor

> **Agent:** Architect
> **Sub-phase:** 2.3
> **Builds on:** Phase 1 (lobby state + WS messages) + Phase 2.1 (cards data)

## Architecture overview

The room desk is **server-authoritative state** held in the `LobbyServer` Durable Object alongside the existing player roster. The state extension is small (one new field, `roomDesk: Map<cardId, number>`), but the touch points are spread across all 4 packages:

- `shared` — Zod schemas for new WS messages + extension of existing `STATE_SNAPSHOT`
- `server` — state field + reducer + handler + persistence
- `client` — state machine context extension + new actions + 3 new components
- `client lobby` — integration (host edit button, player read-only preview)

The deck is a `Map<cardId, count>` server-side and serialized as `Record<cardId, count>` over the wire. Empty deck = `{}`. Cards with `count === 0` are pruned (no `{ "werewolf": 0 }` noise).

Editing flow: host taps a card in the editor → client sends `SET_CARD_COUNT { cardId, count }` → server validates (host check + count bounds + phase) → server applies + persists + broadcasts `ROOM_DESK_UPDATED` to everyone → all clients update XState context → React rerenders. No optimistic update on client — we trust the server roundtrip (~50ms on edge). If the user spams taps, the server processes them in order (DO is single-threaded), and broadcasts each one. Counter shown on host UI reflects what the server confirmed, not what they tapped (prevents desync after race conditions, e.g., kicked mid-edit).

Start-game validation gets one new check: `deckSize === playerCount` before transitioning. The check lives in `canStartGame` (already exists), so we just extend the result type with a new error reason.

Persistence requires updating `serializeState`/`deserializeState` to round-trip the new field. The `Map<string, number>` serializes naturally as `Array<[string, number]>` (same pattern as `players`).

## State extension

### `LobbyState` (server)

```ts
export interface LobbyState {
  roomCode: string;
  phase: RoomPhase;
  players: Map<SessionId, PublicPlayer>;
  hostSessionId: SessionId | null;
  hostDisconnectedAt: number | null;
  // NEW
  roomDesk: Map<string, number>;  // cardId -> count (count > 0 only; 0 is pruned)
}
```

`createEmptyLobby` initializes `roomDesk: new Map()`.

### `LobbyContext` (client XState)

```ts
export interface LobbyContext {
  roomCode: string;
  selfSessionId: SessionId | null;
  players: PublicPlayer[];
  joinError: JoinErrorReason | null;
  closedReason: RoomClosedReason | null;
  // NEW
  roomDesk: Record<string, number>;  // cardId -> count
}
```

## New Zod schemas (shared)

### Client → Server

```ts
export const SetCardCountMessageSchema = z.object({
  type: z.literal('SET_CARD_COUNT'),
  cardId: z.string(),
  count: z.number().int().min(0).max(MAX_PLAYERS),
});
export type SetCardCountMessage = z.infer<typeof SetCardCountMessageSchema>;
```

Added to `ClientMessageSchema` discriminated union.

### Server → Client

```ts
export const RoomDeskUpdatedMessageSchema = z.object({
  type: z.literal('ROOM_DESK_UPDATED'),
  deck: z.record(z.string(), z.number().int().min(1).max(MAX_PLAYERS)),
});
export type RoomDeskUpdatedMessage = z.infer<typeof RoomDeskUpdatedMessageSchema>;
```

Added to `ServerMessageSchema` union.

### Extension of `STATE_SNAPSHOT`

```ts
// Existing:
export const StateSnapshotMessageSchema = z.object({
  type: z.literal('STATE_SNAPSHOT'),
  roomCode: z.string(),
  phase: RoomPhaseSchema,
  players: z.array(PublicPlayerSchema),
  selfSessionId: SessionIdSchema,
  // NEW field
  roomDesk: z.record(z.string(), z.number().int().min(1).max(MAX_PLAYERS)),
});
```

## New canStartGame error reason

```ts
export type CanStartResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | 'not_host'
        | 'not_enough_players'
        | 'not_all_ready'
        | 'already_playing'
        | 'deck_mismatch';  // NEW
    };
```

When `deck_mismatch`, the validator also returns `expected` and `actual` counts so the client can build the error toast: `Cần đúng {expected} thẻ, hiện có {actual}.`

Refined signature:
```ts
export type CanStartResult =
  | { ok: true }
  | { ok: false; reason: 'not_host' | 'not_enough_players' | 'not_all_ready' | 'already_playing' }
  | { ok: false; reason: 'deck_mismatch'; expected: number; actual: number };
```

## New state reducer

```ts
// lobbyState.ts
export function setCardCount(
  state: LobbyState,
  cardId: string,
  count: number,
): LobbyState {
  const roomDesk = new Map(state.roomDesk);
  if (count <= 0) {
    roomDesk.delete(cardId);
  } else {
    roomDesk.set(cardId, Math.min(count, MAX_PLAYERS));
  }
  return { ...state, roomDesk };
}

export function getDeckSize(state: LobbyState): number {
  let total = 0;
  for (const count of state.roomDesk.values()) total += count;
  return total;
}

export function deckAsRecord(state: LobbyState): Record<string, number> {
  return Object.fromEntries(state.roomDesk);
}
```

`canStartGame` extension:
```ts
const deckSize = getDeckSize(state);
const playerCount = state.players.size;
if (deckSize !== playerCount) {
  return { ok: false, reason: 'deck_mismatch', expected: playerCount, actual: deckSize };
}
```

## Server handler

```ts
// server.ts
case 'SET_CARD_COUNT':
  if (!data) { conn.close(1008, 'not_joined'); return; }
  await this.handleSetCardCount(data.sessionId, msg.cardId, msg.count);
  return;

private async handleSetCardCount(
  requesterId: SessionId,
  cardId: string,
  count: number,
): Promise<void> {
  // Validate host
  if (this.lobby.hostSessionId !== requesterId) return;  // silent ignore
  // Validate phase
  if (this.lobby.phase !== 'lobby') return;
  // Validate card exists (defense in depth — client should only send valid IDs)
  if (!isValidCardId(cardId)) return;

  this.lobby = setCardCount(this.lobby, cardId, count);
  await this.persistState();
  await this.touchActivity();
  this.broadcastMessage({
    type: 'ROOM_DESK_UPDATED',
    deck: deckAsRecord(this.lobby),
  });
}
```

`isValidCardId` checks against `CARDS` array from `@werewolf/shared`.

## State machine update

Add `ROOM_DESK_UPDATED` event handler in `in_lobby` state. Also update `STATE_SNAPSHOT` handler to apply `roomDesk`.

```ts
in_lobby: {
  on: {
    STATE_SNAPSHOT: { actions: 'applySnapshot' },  // existing — now also writes roomDesk
    ROOM_DESK_UPDATED: { actions: 'applyRoomDesk' },  // NEW
    // ... existing handlers
  },
},
```

Also handle `ROOM_DESK_UPDATED` in `disconnected` state (player might receive a late update during reconnect).

## New `useLobby` action

```ts
const setCardCount = useCallback((cardId: string, count: number) => {
  const s = socketRef.current;
  if (s) sendMessage(s, { type: 'SET_CARD_COUNT', cardId, count });
}, []);

// Add to returned actions:
actions: { setReady, kickPlayer, startGame, leave, setCardCount }
```

## File tree changes

```
packages/
├── shared/src/
│   ├── messages.ts          MODIFY — add SET_CARD_COUNT + ROOM_DESK_UPDATED + extend STATE_SNAPSHOT
│   └── room.ts              MODIFY — extend JoinErrorReason (no change needed — already covers)
│
├── server/src/
│   ├── lobby/
│   │   ├── lobbyState.ts     MODIFY — add roomDesk field + reducer + getDeckSize + extend canStartGame
│   │   └── lobbyState.test.ts MODIFY — add ~10 new test cases
│   └── server.ts             MODIFY — add SET_CARD_COUNT handler + extend serialize/deserialize + include roomDesk in snapshot + extend handleStartGame error toast
│
└── client/src/
    ├── lib/
    │   └── cards.ts          ADD (new helper) — isValidCardId(id)
    ├── machines/
    │   └── lobbyMachine.ts   MODIFY — extend context with roomDesk + add ROOM_DESK_UPDATED event
    ├── hooks/
    │   └── useLobby.ts       MODIFY — expose setCardCount action
    └── components/
        ├── cards/
        │   ├── CardCellWithCounter.tsx   NEW — variant of CardCell with counter chip
        │   └── RoomDeskEditor.tsx        NEW — full-screen host editor
        ├── lobby/
        │   ├── RoomDeskPreview.tsx       NEW — read-only collapsible chips
        │   └── LobbyScreen.tsx           MODIFY — wire editor + preview + start-button validation toast
        └── ui/
            └── Toast.tsx                 NEW — simple toast component (used for deck_mismatch error)
```

**Component reuse from Phase 2.1:**
- `RoomDeskEditor` reuses `TeamSection` layout (3 sections, same grouping) but with `CardCellWithCounter` instead of `CardCell`
- `RoomDeskPreview` reuses `CardDetailDialog` for chip tap-to-view

## Persistence

`serializeState` / `deserializeState` need to round-trip `roomDesk`:

```ts
interface SerializedState {
  roomCode: string;
  phase: 'lobby' | 'playing';
  players: Array<[string, ReturnType<typeof JSON.parse>]>;
  hostSessionId: string | null;
  hostDisconnectedAt: number | null;
  roomDesk: Array<[string, number]>;  // NEW
}

function serializeState(state: LobbyState): SerializedState {
  return {
    // ... existing
    roomDesk: Array.from(state.roomDesk.entries()),
  };
}

function deserializeState(s: SerializedState): LobbyState {
  return {
    // ... existing
    roomDesk: new Map(s.roomDesk ?? []),  // ?? [] for backward compat with pre-2.3 saved state
  };
}
```

The `?? []` fallback means a room created in Phase 2.1 (and evicted) can still rehydrate into Phase 2.3 with an empty deck — no migration script needed.

## Tests to add (server)

In `lobbyState.test.ts`:

```ts
describe('setCardCount', () => {
  it('adds a card with count 1');
  it('updates existing card count');
  it('removes card when count is 0');
  it('caps count at MAX_PLAYERS');
});

describe('getDeckSize', () => {
  it('returns 0 for empty deck');
  it('returns sum across all cards');
});

describe('canStartGame with deck validation', () => {
  it('rejects when deckSize !== playerCount with deck_mismatch reason');
  it('allows start when deckSize === playerCount with all ready');
  it('includes expected/actual in deck_mismatch result');
});
```

Total: ~9 new tests. Combined with existing 25 → 34 tests.

## Risks + mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Tap spam → 20 rapid `SET_CARD_COUNT` messages | High during dev/testing | DO single-threaded processes serially. Broadcast costs are tiny. Acceptable. |
| Long-press conflicts with browser context menu | Medium (esp. desktop) | `preventDefault` on `contextmenu` + use `pointerdown`/`pointerup` with 500ms threshold. Test on iOS Safari (3D-Touch tradition). |
| Stale `roomDesk` after page refresh | Low | `STATE_SNAPSHOT` includes `roomDesk` — fresh on every connect. |
| Race: host disconnects mid-edit + tap arrives | Low | Host is still in state (just disconnected); edit applies normally. If host kicked/timed out, edit ignored (not_host). |
| Player sees room desk preview during `phase === 'playing'` (Phase 2.5 issue) | N/A Phase 2.3 | Will revisit in Phase 2.5 — for now `roomDesk` always visible in preview. |
| Backward compat: room created pre-2.3 (no roomDesk field in stored state) | Low | `?? new Map()` fallback in deserialize. |

## Out of scope

- No optimistic UI updates (client waits for server confirm)
- No "undo" feature
- No bulk operations (clear all, fill all)
- No drag-and-drop reorder
- No save deck as preset

These are all addressable in future phases if user wants.

## Estimated bundle size impact

- New components: ~6 KB raw → ~2 KB gzipped
- New Zod schemas: ~0.5 KB gzipped
- State machine extensions: ~0.3 KB gzipped
- Total: ~3 KB gzipped (well under +5 KB budget)
