# Sub-phase 4.2 — PLAN: Turn Tracking Implementation

> **Read BRIEF first** (`PHASE_4.2_BRIEF.md`) for the "what & why".
> **Branch:** `phase-4-gm-mode` (continues from 4.1)

## Pre-flight

```bash
cd ~/projects/werewolf-companion
git checkout phase-4-gm-mode
git pull origin phase-4-gm-mode
git status                            # clean
npm test                              # 58/58 baseline
```

## Implementation order

1. Shared schema (state field + message)
2. Server reducer + 5 tests
3. Server handler wiring
4. Client state machine wiring
5. Client UI (GM view with advance button + non-GM indicator)
6. E2E test (G4)

---

## Step 1 — Shared package

### `packages/shared/src/types.ts`

Add `CurrentTurn` type:

```ts
/**
 * Game-flow turn state. Created when the game starts (always begins with
 * night ngày 1) and advanced explicitly by the GM via ADVANCE_TURN. Cleared
 * when the game ends. Null in lobby phase.
 * Phase 4.2 feature.
 */
export interface CurrentTurn {
  day: number;                 // starts at 1
  phase: 'night' | 'day';      // starts with 'night'
}
```

Export from `packages/shared/src/index.ts` along with existing exports.

### `packages/shared/src/messages.ts`

Add to `messages.ts`:

```ts
// New client → server message
export const AdvanceTurnMessageSchema = z.object({
  type: z.literal('ADVANCE_TURN'),
});
export type AdvanceTurnMessage = z.infer<typeof AdvanceTurnMessageSchema>;

// Shared schema for the turn shape (used in StateSnapshot + TurnAdvanced)
export const CurrentTurnSchema = z.object({
  day: z.number().int().min(1),
  phase: z.enum(['night', 'day']),
});

// Server → all clients: broadcast new turn
export const TurnAdvancedMessageSchema = z.object({
  type: z.literal('TURN_ADVANCED'),
  currentTurn: CurrentTurnSchema,
});
export type TurnAdvancedMessage = z.infer<typeof TurnAdvancedMessageSchema>;
```

Then add to both discriminated unions:
- `ClientMessageSchema` union: add `AdvanceTurnMessageSchema`
- `ServerMessageSchema` union: add `TurnAdvancedMessageSchema`

### `packages/shared/src/messages.ts` — update StateSnapshot

Find `StateSnapshotMessageSchema` and add the `currentTurn` field:

```ts
export const StateSnapshotMessageSchema = z.object({
  type: z.literal('STATE_SNAPSHOT'),
  // ...existing fields...
  currentTurn: CurrentTurnSchema.nullable(),  // NEW — null in lobby
});
```

This is what enables reconnect-during-game to restore turn state.

---

## Step 2 — Server reducer + tests

### `packages/server/src/lobby/lobbyState.ts`

Add field to `LobbyState`:

```ts
export interface LobbyState {
  // ...existing fields...
  /**
   * Current game-flow turn. Initialized on dealCards to { day: 1, phase: 'night' },
   * mutated by advanceTurn, cleared back to null on endGame.
   * Phase 4.2 feature.
   */
  currentTurn: CurrentTurn | null;
}
```

Update `createEmptyLobby` to initialize `currentTurn: null`.

### `packages/server/src/lobby/lobbyState.ts` — dealCards modification

Find `dealCards()` reducer. After successful card assignment, set:

```ts
return {
  // ...existing return shape...
  currentTurn: { day: 1, phase: 'night' as const },
};
```

### `packages/server/src/lobby/lobbyState.ts` — new advanceTurn reducer

Add new pure function:

```ts
export interface AdvanceTurnResult {
  ok: boolean;
  reason?: 'not_gm' | 'not_playing' | 'no_active_turn';
  newState?: LobbyState;
  newTurn?: CurrentTurn;
}

export function advanceTurn(
  state: LobbyState,
  requesterId: SessionId,
): AdvanceTurnResult {
  if (state.hostSessionId !== requesterId) {
    return { ok: false, reason: 'not_gm' };
  }
  if (state.phase !== 'playing') {
    return { ok: false, reason: 'not_playing' };
  }
  if (!state.currentTurn) {
    return { ok: false, reason: 'no_active_turn' };
  }

  const newTurn: CurrentTurn = state.currentTurn.phase === 'night'
    ? { day: state.currentTurn.day, phase: 'day' }
    : { day: state.currentTurn.day + 1, phase: 'night' };

  return {
    ok: true,
    newState: { ...state, currentTurn: newTurn },
    newTurn,
  };
}
```

### `packages/server/src/lobby/lobbyState.ts` — endGame modification

Find `endGame()` reducer. Add `currentTurn: null` to its returned state.

### `packages/server/src/lobby/lobbyState.ts` — snapshot serializer

Find the function that produces the snapshot for clients (likely `getPublicState` or `serializeForSnapshot`). Add `currentTurn` to its output:

```ts
return {
  // ...existing fields...
  currentTurn: state.currentTurn,
};
```

### `packages/server/src/lobby/lobbyState.test.ts`

Add 5+ new tests (use existing test style, builders, helpers):

```ts
describe('advanceTurn', () => {
  test('night → day same day number', () => {
    const state = setupPlayingStateWithTurn({ day: 1, phase: 'night' });
    const result = advanceTurn(state, GM_SESSION_ID);
    expect(result.ok).toBe(true);
    expect(result.newTurn).toEqual({ day: 1, phase: 'day' });
  });

  test('day → night increments day', () => {
    const state = setupPlayingStateWithTurn({ day: 1, phase: 'day' });
    const result = advanceTurn(state, GM_SESSION_ID);
    expect(result.ok).toBe(true);
    expect(result.newTurn).toEqual({ day: 2, phase: 'night' });
  });

  test('non-GM cannot advance', () => {
    const state = setupPlayingStateWithTurn({ day: 1, phase: 'night' });
    const result = advanceTurn(state, NON_GM_SESSION_ID);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('not_gm');
  });

  test('cannot advance during lobby phase', () => {
    const state = setupLobbyState();  // phase = 'lobby', currentTurn = null
    const result = advanceTurn(state, GM_SESSION_ID);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('not_playing');
  });

  test('dealCards initializes currentTurn to night day 1', () => {
    const state = setupReadyLobbyState();
    const dealt = dealCards(state, GM_SESSION_ID);
    expect(dealt.ok).toBe(true);
    expect(dealt.newState!.currentTurn).toEqual({ day: 1, phase: 'night' });
  });

  test('endGame clears currentTurn back to null', () => {
    const state = setupPlayingStateWithTurn({ day: 3, phase: 'day' });
    const ended = endGame(state, GM_SESSION_ID);
    expect(ended.ok).toBe(true);
    expect(ended.newState!.currentTurn).toBeNull();
  });

  test('snapshot during playing phase serializes currentTurn', () => {
    const state = setupPlayingStateWithTurn({ day: 2, phase: 'day' });
    const snapshot = getPublicState(state);
    expect(snapshot.currentTurn).toEqual({ day: 2, phase: 'day' });
  });
});
```

**After step 2: `npm test` should show ≥63 passing.**

---

## Step 3 — Server handler

### `packages/server/src/server.ts`

Add message handler case (near `TRANSFER_GM`):

```ts
case 'ADVANCE_TURN':
  if (!data) {
    sender.close(1008, 'not_joined');
    return;
  }
  await this.handleAdvanceTurn(data.sessionId);
  return;
```

Add the handler method (mirror style of `handleEndGame`):

```ts
private async handleAdvanceTurn(requesterId: SessionId): Promise<void> {
  const result = advanceTurn(this.lobby, requesterId);
  if (!result.ok) {
    // Silent reject (mirrors handleEndGame pattern — no error feedback to client)
    return;
  }
  this.lobby = result.newState!;
  await this.persistState();
  // Broadcast to ALL connections (turn is public info)
  this.broadcast({
    type: 'TURN_ADVANCED',
    currentTurn: result.newTurn!,
  });
}
```

Verify snapshots sent on join now include `currentTurn` (should be automatic if step 2's serializer was updated).

---

## Step 4 — Client state machine

Find the connection machine file (likely `packages/client/src/state/connection.machine.ts` or similar). Look at how `TRANSFER_GM` is handled in 4.1 — mirror that for advance turn.

**Add `currentTurn` to context type:**

```ts
context: {
  // ...existing fields...
  currentTurn: CurrentTurn | null,
}
```

**Update the `STATE_SNAPSHOT` event handler** to assign `currentTurn` from the snapshot.

**Add new event handler for `TURN_ADVANCED`:**

```ts
on: {
  TURN_ADVANCED: {
    actions: assign({
      currentTurn: ({ event }) => event.currentTurn,
    }),
  },
}
```

**Update `GAME_ENDED` handler** to clear:

```ts
GAME_ENDED: {
  actions: assign({
    // ...existing...
    currentTurn: () => null,
  }),
}
```

**Add new context action `sendAdvanceTurn`:**

```ts
sendAdvanceTurn: ({ context }) => {
  context.ws.send(JSON.stringify({ type: 'ADVANCE_TURN' }));
}
```

Expose it through the hook (likely `useLobby.ts`) following the same pattern as `transferGm` from 4.1.

---

## Step 5 — Client UI

### `packages/client/src/components/game/TurnIndicator.tsx` (NEW)

```tsx
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
```

### `packages/client/src/components/game/PlayingScreen.tsx` — GM branch

Replace the static "Bạn là quản trò" placeholder block from 4.1 with this richer GM view (keep the end-game button at bottom):

```tsx
if (viewerIsGm) {
  const isNight = currentTurn?.phase === 'night';
  const advanceLabel = isNight ? 'Kết thúc đêm' : 'Kết thúc ngày';
  const hintText = isNight
    ? 'Sói tỉnh dậy. Hãy gọi từng vai trò thức dậy theo thứ tự.'
    : 'Cả làng tỉnh giấc. Bắt đầu thảo luận và bỏ phiếu treo cổ.';

  return (
    <div className="flex-1 flex flex-col min-h-0 px-4 pt-5 pb-7 animate-fade-in">
      {/* Keep existing header (room code + status badge) */}

      <div className="flex-1 flex flex-col items-center justify-start text-center px-6 pt-4">
        {currentTurn && (
          <>
            <TurnIndicator turn={currentTurn} variant="large" />
            <p className="text-text-secondary text-sm leading-relaxed max-w-[280px] mt-2 mb-6">
              {hintText}
            </p>
            <Button
              fullWidth
              variant="primary"
              onClick={onAdvanceTurn}
              aria-label={advanceLabel}
            >
              {advanceLabel}
            </Button>
          </>
        )}
      </div>

      {/* Keep existing end game button at bottom */}
      <div className="shrink-0 mt-4 pt-3 border-t border-bg-surface">
        <button onClick={onEndGame}>Kết thúc trận</button>
      </div>
    </div>
  );
}
```

### `packages/client/src/components/game/PlayingScreen.tsx` — non-GM branch

Add a compact turn indicator at the top of the existing card reveal UI:

```tsx
// Inside the non-GM branch, near the top of the body content:
{currentTurn && (
  <div className="flex justify-center mb-3">
    <TurnIndicator turn={currentTurn} variant="compact" />
  </div>
)}
```

### Wire props through PlayingScreen

Add to PlayingScreen props:
- `currentTurn: CurrentTurn | null`
- `onAdvanceTurn: () => void`

Wire from the parent (likely a route component that mounts PlayingScreen) by reading from the state machine context.

---

## Step 6 — E2E test

Add G4 to `tests/G.gm.spec.ts`:

```ts
test('G4: GM advances turn, all clients update', async ({ browser }) => {
  // Setup: 6 contexts (1 GM + 5 non-GM)
  // Use same helpers as existing G1-G3 tests
  //
  // Deal 5 cards (1 wolf + 4 villagers)
  // All 5 non-GM ready up
  // GM starts game
  // Wait ~9s for transition to clear
  //
  // Assert all 6 see "Đêm ngày 1" indicator (GM sees large, others compact)
  // GM clicks "Kết thúc đêm"
  // Wait ~500ms for broadcast
  // Assert all 6 now see "Sáng ngày 1"
  // GM clicks "Kết thúc ngày"
  // Assert all see "Đêm ngày 2"
  // GM ends game
  // Assert lobby (no turn indicator)
});
```

---

## Commit strategy

Each commit must leave the repo green:

1. **`chore: add CurrentTurn type, ADVANCE_TURN + TURN_ADVANCED schemas`**
   - shared/types.ts, shared/messages.ts, shared/index.ts
   - StateSnapshotSchema updated with currentTurn

2. **`feat(server): advanceTurn reducer + dealCards/endGame integration + 6 tests`**
   - lobbyState.ts changes + snapshot serializer
   - All new tests added → 64+ passing

3. **`feat(server): wire ADVANCE_TURN handler in server.ts`**
   - server.ts changes

4. **`feat(client): state machine handles TURN_ADVANCED, sends ADVANCE_TURN`**
   - connection.machine.ts + useLobby.ts (or equivalent)

5. **`feat(client): TurnIndicator component (compact + large variants)`**
   - TurnIndicator.tsx (new file)

6. **`feat(client): GM turn UI + non-GM compact indicator on PlayingScreen`**
   - PlayingScreen.tsx changes + parent route wiring

7. **`test(e2e): add G4 GM advance turn test`**
   - tests/G.gm.spec.ts

8. **`docs: mark Sub-phase 4.2 complete in PHASE_4_PLAN.md`**

Push to `origin/phase-4-gm-mode`.

---

## Smoke test (after all commits)

```bash
npm test                 # expect ≥63 passing
npm run type-check       # clean
npm run build            # clean
```

Manual (6 contexts on `npm run dev`):

1. 1 GM + 5 players in lobby
2. Deal 5 cards, start game
3. After transition:
   - GM sees "ĐÊM ngày 1" + "Kết thúc đêm" button + atmospheric hint
   - Non-GM tabs see small "Đêm ngày 1" pill at top of card screen
4. GM taps "Kết thúc đêm" → all 6 update to "SÁNG ngày 1" / "Kết thúc ngày"
5. GM taps "Kết thúc ngày" → all update to "ĐÊM ngày 2"
6. Refresh GM tab → reconnects to ĐÊM ngày 2 (not back to ngày 1)
7. GM ends game → lobby, turn cleared
8. Start again → fresh "ĐÊM ngày 1"

## Estimated effort

- Step 1 (shared): ~30 min
- Step 2 (server + tests): ~1.5h
- Step 3 (server handler): ~30 min
- Step 4 (client machine): ~30 min
- Step 5 (UI): ~1.5h
- Step 6 (e2e + smoke): ~1h

**Total: ~5 hours.**
