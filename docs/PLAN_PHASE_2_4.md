# PLAN — Phase 2.4: Card Dealing Logic

> **Agent:** Architect
> **Sub-phase:** 2.4
> **Builds on:** Phase 2.3 roomDesk + Phase 1 room-lock/rejoin foundation

## Architecture overview

Dealing is a pure transformation: `roomDesk (Map<cardId,count>) + players (ordered) + shuffleFn → assignments (Map<sessionId, cardId>)`. The reducer `dealCards` is pure and takes an injectable shuffle function so tests are deterministic. The real shuffle uses `crypto.getRandomValues()`.

The critical privacy invariant: each player's card travels via `sendTo(connection)`, never `broadcast`. The `GAME_STARTED` broadcast carries only the phase change. On refresh, the server re-sends the player's own card inside their `STATE_SNAPSHOT` (`yourCard` field), so a reconnecting client restores straight to the playing screen.

Room locking and rejoin already work from Phase 1 (`addPlayer` returns `room_in_progress` when `phase === 'playing'` for brand-new sessions, but lets existing sessions rejoin). We only need to make sure a rejoining player gets their card back — which the `STATE_SNAPSHOT.yourCard` handles.

Assignments live in `LobbyState.assignments` and persist through SQLite exactly like `players` and `roomDesk`. They are NOT cleared on disconnect; they clear only at END_GAME (Phase 2.6, not built yet).

## State extension

```ts
export interface LobbyState {
  // ... existing (roomCode, phase, players, hostSessionId, hostDisconnectedAt, roomDesk)
  assignments: Map<SessionId, string>;  // NEW: sessionId → cardId
}
```

`createEmptyLobby` adds `assignments: new Map()`.

## Shuffle utility

New file `packages/server/src/lobby/shuffle.ts`:

```ts
/** Fisher-Yates shuffle using crypto.getRandomValues for fair randomness. */
export function cryptoShuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randomInt(maxExclusive: number): number {
  // Rejection sampling to avoid modulo bias
  const max = Math.floor(0xffffffff / maxExclusive) * maxExclusive;
  const buf = new Uint32Array(1);
  let x: number;
  do {
    crypto.getRandomValues(buf);
    x = buf[0]!;
  } while (x >= max);
  return x % maxExclusive;
}

export type ShuffleFn = <T>(arr: T[]) => T[];
```

`dealCards` accepts a `ShuffleFn` param (defaults to `cryptoShuffle`); tests inject identity or reverse.

## New reducer: dealCards

```ts
export function dealCards(
  state: LobbyState,
  shuffle: ShuffleFn = cryptoShuffle,
): LobbyState {
  // Expand deck into flat array of cardIds
  const flat: string[] = [];
  for (const [cardId, count] of state.roomDesk) {
    for (let i = 0; i < count; i++) flat.push(cardId);
  }

  const players = getPlayersList(state); // ordered by joinedAt
  // Defense: deck size must equal player count (Phase 2.3 validated this already)
  if (flat.length !== players.length) {
    // Don't deal a malformed game; return unchanged (caller already checked canStartGame)
    return state;
  }

  const shuffled = shuffle(flat);
  const assignments = new Map<SessionId, string>();
  players.forEach((p, i) => {
    assignments.set(p.sessionId, shuffled[i]!);
  });

  return { ...state, phase: 'playing', assignments };
}
```

Note: `dealCards` replaces the Phase 1 `startGame` reducer's job. We keep `startGame` for backward-compat or remove it (Developer decides — likely inline into dealCards).

## New Zod messages (shared)

### Server → Client (private)

```ts
export const YourCardMessageSchema = z.object({
  type: z.literal('YOUR_CARD'),
  cardId: z.string(),
});
```

### Server → Client (broadcast) — replaces GAME_STARTED_STUB

```ts
export const GameStartedMessageSchema = z.object({
  type: z.literal('GAME_STARTED'),
  // no card info — privacy
});
```

Keep `GameStartedStubMessageSchema`? → Remove it; replace all usages with `GAME_STARTED`. Both client + server controlled by us.

### Extend STATE_SNAPSHOT

```ts
export const StateSnapshotMessageSchema = z.object({
  // ... existing fields
  roomDesk: RoomDeskSchema,
  yourCard: z.string().optional(),  // NEW: present if game is playing AND this player has a card
});
```

Add both new messages to `ServerMessageSchema` union; remove `GameStartedStubMessageSchema`.

## Server handler changes

### handleStartGame

```ts
private async handleStartGame(requesterId: SessionId): Promise<void> {
  const check = canStartGame(this.lobby, requesterId);
  if (!check.ok) return;

  this.lobby = dealCards(this.lobby);  // shuffle + assign + phase: playing
  await this.persistState();
  await this.touchActivity();

  // Send each player their private card
  for (const conn of this.room.getConnections()) {
    const d = this.getConnData(conn);
    if (!d) continue;
    const cardId = this.lobby.assignments.get(d.sessionId);
    if (cardId) this.sendTo(conn, { type: 'YOUR_CARD', cardId });
  }

  // Broadcast phase change (no card info)
  this.broadcastMessage({ type: 'GAME_STARTED' });
}
```

### STATE_SNAPSHOT (in handleJoin) — include yourCard

```ts
const yourCard = this.lobby.assignments.get(sessionId);
this.sendTo(conn, {
  type: 'STATE_SNAPSHOT',
  roomCode: this.lobby.roomCode,
  phase: this.lobby.phase,
  players: getPlayersList(this.lobby),
  selfSessionId: sessionId,
  roomDesk: deckAsRecord(this.lobby),
  ...(yourCard ? { yourCard } : {}),
});
```

This makes refresh-restore automatic: a rejoining player in a playing room gets their card in the snapshot.

### Persistence

```ts
interface SerializedState {
  // ... existing
  roomDesk?: Array<[string, number]>;
  assignments?: Array<[string, string]>;  // NEW
}

// serialize:
assignments: Array.from(state.assignments.entries()),

// deserialize:
assignments: new Map((s.assignments ?? []) as Array<[SessionId, string]>),
```

`?? []` fallback for pre-2.4 saved rooms.

## Client state machine changes

```ts
export interface LobbyContext {
  // ... existing
  roomDesk: Record<string, number>;
  yourCard: string | null;  // NEW
}

export type LobbyEvent =
  // ... existing
  | { type: 'YOUR_CARD'; cardId: string }
  | { type: 'GAME_STARTED' }  // replaces GAME_STARTED_STUB
  | { type: 'STATE_SNAPSHOT'; ...; yourCard?: string };
```

New `playing` state:

```ts
states: {
  // ... connecting, in_lobby, disconnected, etc.
  in_lobby: {
    on: {
      // ... existing
      GAME_STARTED: 'playing',         // replaces GAME_STARTED_STUB → game_starting
      YOUR_CARD: { actions: 'applyCard' },
    },
  },
  playing: {
    on: {
      YOUR_CARD: { actions: 'applyCard' },
      STATE_SNAPSHOT: { actions: 'applySnapshot' },
      ROOM_CLOSED: { target: 'room_closed', actions: 'setClosedReason' },
      KICKED: 'kicked',
      CONNECTION_LOST: 'disconnected',
    },
  },
}
```

`applySnapshot` extended to also set `yourCard` from snapshot. New `applyCard` action sets `yourCard` from `YOUR_CARD` event.

Also: `connecting` and `disconnected` states must handle `YOUR_CARD` (arrives right after STATE_SNAPSHOT on reconnect) and transition to `playing` if a snapshot says phase is playing. Cleanest: when `STATE_SNAPSHOT` has `phase: 'playing'`, target `playing` state instead of `in_lobby`.

This needs a guard:
```ts
connecting: {
  on: {
    STATE_SNAPSHOT: [
      { target: 'playing', guard: 'snapshotIsPlaying', actions: 'applySnapshot' },
      { target: 'in_lobby', actions: 'applySnapshot' },
    ],
    // ...
  },
},
```

Same guarded transition in `disconnected`.

## Client useLobby

Expose `yourCard` (already in context, just surface it). No new action needed — dealing is host-triggered via existing `startGame`.

## New client component: PlayingScreen

`packages/client/src/components/game/PlayingScreen.tsx` (new `game/` folder):

Phase 2.4 placeholder — shows the dealt card plainly:
- Card image (large)
- Card name + team badge
- Ability text (reuse from CARDS)
- A note: "Phase 2.5 sẽ thêm hiệu ứng tap-and-hold"

Phase 2.5 will replace this with tap-and-hold reveal.

`LobbyScreen` change: when `phase === 'playing'`, render `<PlayingScreen card={...} />` instead of the stub Dialog. Remove the `showStartStub` Dialog entirely.

## File tree changes

```
packages/
├── shared/src/messages.ts          MODIFY — YourCard + GameStarted msgs, extend STATE_SNAPSHOT, remove Stub
├── server/src/lobby/
│   ├── shuffle.ts                   NEW — cryptoShuffle + ShuffleFn type
│   ├── lobbyState.ts                MODIFY — assignments field + dealCards reducer
│   └── lobbyState.test.ts           MODIFY — dealCards tests (deterministic shuffle)
├── server/src/server.ts             MODIFY — handleStartGame deals + private send, STATE_SNAPSHOT yourCard, persist assignments
└── client/src/
    ├── machines/lobbyMachine.ts     MODIFY — playing state + yourCard + applyCard + guards
    ├── hooks/useLobby.ts            MODIFY — surface yourCard
    └── components/game/
        └── PlayingScreen.tsx        NEW — placeholder card display
    └── components/lobby/LobbyScreen.tsx  MODIFY — render PlayingScreen when playing
```

## Tests to add (server)

```ts
describe('cryptoShuffle', () => {
  it('returns array of same length');
  it('returns same multiset (no elements lost/added)');
  it('does not mutate input');
});

describe('dealCards', () => {
  it('assigns one card to each player');
  it('dealt multiset equals deck composition');     // with identity shuffle
  it('respects card counts (2 werewolves → 2 players)');
  it('transitions phase to playing');
  it('uses injected shuffle deterministically');     // reverse shuffle → predictable
  it('assignments.size === players.size');
  it('returns unchanged if deck size != player count'); // defense
});
```

~10 new tests → total ~46.

## Privacy audit checklist (QA must verify)

- [ ] `YOUR_CARD` only ever sent via `sendTo(conn)`, never in any `broadcastMessage` call
- [ ] `GAME_STARTED` broadcast payload has NO cardId / assignments
- [ ] `STATE_SNAPSHOT.yourCard` only contains the requesting player's own card (uses `assignments.get(sessionId)`)
- [ ] No assignments map ever serialized into a client-bound message except per-player card

## Risks + mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Card leaked via broadcast | Critical if it happens | Privacy audit; grep for `assignments` in broadcast paths |
| Reconnect doesn't restore card | Medium | STATE_SNAPSHOT.yourCard covers it; test manually |
| Shuffle bias | Low | Rejection sampling in randomInt avoids modulo bias |
| Phase machine stuck (playing with no card) | Low | applyCard + snapshot both set yourCard; guard handles reconnect |
| Old GAME_STARTED_STUB references break | Low | Remove schema + grep all usages, replace with GAME_STARTED |

## Bundle impact

- shuffle.ts: ~0.5 KB
- PlayingScreen: ~1.5 KB
- state machine + messages: ~1 KB
- Total: ~3 KB gzipped (within ≤4 KB budget)
