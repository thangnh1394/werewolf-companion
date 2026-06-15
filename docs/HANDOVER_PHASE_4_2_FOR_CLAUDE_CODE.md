# Handover: Sub-phase 4.2 — Turn Tracking

> **For:** Claude Code CLI
> **Branch:** `phase-4-gm-mode` (continues from 4.1 — 4.1 already shipped)
> **Reference docs in repo:** `docs/PHASE_4_DECISIONS.md`, `docs/PHASE_4_PLAN.md`, `docs/PHASE_4.2_BRIEF.md`, `docs/PHASE_4.2_PLAN.md`
> **Estimated effort:** ~5 hours
> **Baseline before changes:** 58/58 server tests passing, type-check clean

---

## TL;DR for Claude Code

Implement Sub-phase 4.2 (Turn Tracking) on the `phase-4-gm-mode` branch.

**This sub-phase = đêm/ngày turn counter only:**
1. Add `currentTurn: { day: number, phase: 'night' | 'day' } | null` to room state
2. Initialize on `dealCards` to `{ day: 1, phase: 'night' }`
3. Clear on `endGame` back to `null`
4. New client→server message `ADVANCE_TURN`, GM-only
5. New server→client broadcast `TURN_ADVANCED`
6. Include `currentTurn` in state snapshot so reconnect mid-game works
7. New `TurnIndicator` component (compact for non-GM, large for GM)
8. GM PlayingScreen: replace placeholder with turn indicator + "Kết thúc đêm/ngày" button + atmospheric hint
9. Non-GM PlayingScreen: small turn pill at top of card view
10. 5 new server tests → 63 total

**Result:**
- 63/63 server tests passing
- Manual smoke (6 contexts) verifies: turn advances on all 6 clients, refresh mid-game preserves turn, end game clears it

**Do NOT include in this sub-phase:**
- Omniscient view (GM seeing role assignments) → Sub-phase 4.3
- Death marking → Sub-phase 4.3
- Notes per turn / replay → Sub-phase 4.4

---

## Pre-flight checks

Run these and STOP if any fails:

```bash
cd ~/projects/werewolf-companion
git status                          # must be clean
git checkout phase-4-gm-mode
git pull origin phase-4-gm-mode

# Baseline MUST be green before any changes
npm test                            # MUST show 58/58 passing
npm run type-check                  # MUST be clean
npm run build                       # MUST succeed
```

If `npm test` shows anything other than 58/58, STOP and investigate.

---

## Implementation order (mandatory)

Follow this exact order so partial states always compile + test:

### 1. Shared package (~30 min)

**`packages/shared/src/types.ts`**

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

**`packages/shared/src/index.ts`**

Export `CurrentTurn` (find where other types are re-exported, add it there).

**`packages/shared/src/messages.ts`**

Add the new schemas. Place near `TransferGmMessageSchema` for locality:

```ts
// Client → server: GM requests turn advance
export const AdvanceTurnMessageSchema = z.object({
  type: z.literal('ADVANCE_TURN'),
});
export type AdvanceTurnMessage = z.infer<typeof AdvanceTurnMessageSchema>;

// Shared schema for the turn shape (also used in StateSnapshot)
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

**`packages/shared/src/messages.ts` — update StateSnapshot**

Find `StateSnapshotMessageSchema`. Add field:

```ts
export const StateSnapshotMessageSchema = z.object({
  type: z.literal('STATE_SNAPSHOT'),
  // ...existing fields...
  currentTurn: CurrentTurnSchema.nullable(),  // NEW — null in lobby
});
```

This is critical — without it, refresh during game would lose turn state.

### 2. Server reducer + tests (~1.5h)

**`packages/server/src/lobby/lobbyState.ts`**

Add `currentTurn` to the `LobbyState` interface:

```ts
export interface LobbyState {
  // ...existing fields...
  /**
   * Current game-flow turn. Initialized on dealCards to {day:1, phase:'night'},
   * mutated by advanceTurn, cleared back to null on endGame.
   * Phase 4.2 feature.
   */
  currentTurn: CurrentTurn | null;
}
```

Update `createEmptyLobby` to initialize `currentTurn: null`.

**Modify `dealCards` reducer:**

In the success branch, set `currentTurn: { day: 1, phase: 'night' as const }` on the new state. Don't change the existing logic — just add this field.

**Modify `endGame` reducer:**

Set `currentTurn: null` on the new state.

**Add new pure function `advanceTurn`:**

```ts
export interface AdvanceTurnResult {
  ok: boolean;
  reason?: 'not_gm' | 'not_playing' | 'no_active_turn';
  newState?: LobbyState;
  newTurn?: CurrentTurn;
}

/**
 * GM advances the turn. Cycles: night → day (same day#) → night (day+1).
 * Phase 4.2 feature.
 */
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

**`packages/server/src/lobby/lobbyState.test.ts`**

Add 5+ tests. Use existing test style (look at existing tests for helpers like `setupLobby`, `setupPlayingState`, etc.):

```ts
describe('advanceTurn', () => {
  test('night → day same day number', () => {
    // setup playing state with currentTurn = {day:1, phase:'night'}
    // call advanceTurn
    // expect ok = true, newTurn = {day:1, phase:'day'}
  });

  test('day → night increments day', () => {
    // setup with {day:1, phase:'day'}
    // expect newTurn = {day:2, phase:'night'}
  });

  test('non-GM cannot advance', () => {
    // setup with playing state
    // call advanceTurn with non-host sessionId
    // expect ok = false, reason = 'not_gm'
  });

  test('cannot advance during lobby phase', () => {
    // setup empty lobby
    // expect ok = false, reason = 'not_playing'
  });

  test('dealCards initializes currentTurn to night day 1', () => {
    // setup ready lobby (6 players, 5 cards)
    // call dealCards
    // expect newState.currentTurn = {day:1, phase:'night'}
  });

  test('endGame clears currentTurn back to null', () => {
    // setup playing state with some advanced turn (e.g. day 3 day)
    // call endGame
    // expect newState.currentTurn = null
  });
});
```

**Also add ONE snapshot test** to verify reconnect works:

```ts
test('snapshot during playing phase serializes currentTurn', () => {
  // setup playing state with {day:2, phase:'day'}
  // serialize via whatever snapshot function exists
  // expect serialized.currentTurn = {day:2, phase:'day'}
});
```

Look at existing `lobbyState.ts` for the serializer function name (likely `getPublicState` or similar). Update it to include `currentTurn` in its output.

**Verify: `npm test` shows 63+/63+ before continuing.**

### 3. Server handler (~30 min)

**`packages/server/src/server.ts`**

Add to the message switch (near where `TRANSFER_GM` is handled):

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
    // Silent reject (mirrors existing handleEndGame / handleTransferGm patterns)
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

Also update wherever snapshots are sent (find `STATE_SNAPSHOT` in server.ts) — make sure `currentTurn` is included. The serializer change in step 2 should make this automatic, but double-check.

### 4. Client state machine (~30 min)

**`packages/client/src/state/...` (find the connection machine)**

Look at the existing machine; you should see `TRANSFER_GM` action wired up. Add similar plumbing for advance turn:

**Add `currentTurn` to context type:**

```ts
context: {
  // ...existing...
  currentTurn: CurrentTurn | null;
}
```

Initialize as `null`.

**Update the `STATE_SNAPSHOT` event handler** to assign `currentTurn` from snapshot.

**Add new event handler for `TURN_ADVANCED`:**

```ts
on: {
  TURN_ADVANCED: {
    actions: assign({
      currentTurn: ({ event }) => event.currentTurn,
    }),
  },
  // ...
}
```

**Update `GAME_ENDED` handler** to clear `currentTurn`:

```ts
GAME_ENDED: {
  actions: assign({
    // ...existing assignments...
    currentTurn: () => null,
  }),
}
```

**Add new action `sendAdvanceTurn`:**

```ts
sendAdvanceTurn: ({ context }) => {
  context.ws.send(JSON.stringify({ type: 'ADVANCE_TURN' }));
},
```

Expose it through whatever hook is used (likely `useLobby.ts` or similar). Look at how `transferGm` is exposed and mirror that pattern.

### 5. Client UI (~1.5h)

**`packages/client/src/components/game/TurnIndicator.tsx` (NEW FILE)**

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

**`packages/client/src/components/game/PlayingScreen.tsx`**

Find the GM branch (added in 4.1, currently a static placeholder). Replace its body with:

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
    </div>
  );
}
```

Update the non-GM branch (the existing card reveal screen): add a compact turn indicator at the top of the body content:

```tsx
// Near top of non-GM body, above the card UI:
{currentTurn && (
  <div className="flex justify-center mb-3">
    <TurnIndicator turn={currentTurn} variant="compact" />
  </div>
)}
```

**Wire props through to PlayingScreen:**

Add new props:
- `currentTurn: CurrentTurn | null`
- `onAdvanceTurn: () => void`

Wire from the parent component (likely a route component that mounts PlayingScreen) by reading from the state machine. Look at how `onEndGame` is wired and mirror.

### 6. Vietnamese rename pass

This sub-phase introduces these strings — make sure they're consistent:
- "Kết thúc đêm" / "Kết thúc ngày" — buttons
- "ĐÊM" / "SÁNG" — large indicator label
- "Đêm ngày X" / "Sáng ngày X" — compact pill text
- Hint copy:
  - Night: "Sói tỉnh dậy. Hãy gọi từng vai trò thức dậy theo thứ tự."
  - Day: "Cả làng tỉnh giấc. Bắt đầu thảo luận và bỏ phiếu treo cổ."

Search for any other "Bạn là quản trò" placeholder text from 4.1 that needs removal (the static placeholder is replaced by the turn UI now).

### 7. E2E test addition (~1h)

Add to existing `tests/G.gm.spec.ts` (created in 4.1):

```ts
test('G4: GM advances turn, all clients update', async ({ browser }) => {
  // Setup: 6 contexts (1 GM + 5 non-GM)
  // Use the same helper as the existing 4.1 tests
  //
  // Deal 5 cards (1 wolf + 4 villagers)
  // All 5 non-GM ready up
  // GM starts game
  // Wait for transition to clear (~9s)
  //
  // Assert all 6 see "Đêm ngày 1" / "ĐÊM" indicator (with role-appropriate variant)
  // GM clicks "Kết thúc đêm"
  // Wait ~500ms for broadcast
  // Assert all 6 now see "Sáng ngày 1" / "SÁNG"
  // GM clicks "Kết thúc ngày"
  // Assert all see "Đêm ngày 2"
  // GM ends game
  // Assert lobby (no turn indicator visible)
});
```

Look at G3 (the privacy/GM-exclusion test from 4.1) for the helper patterns to reuse.

---

## Commit strategy

Each commit must leave the repo green. Use conventional commit prefixes:

1. **`chore: add CurrentTurn type, ADVANCE_TURN + TURN_ADVANCED schemas`**
   - shared/types.ts, shared/index.ts, shared/messages.ts
   - StateSnapshot updated with currentTurn

2. **`feat(server): advanceTurn reducer + dealCards/endGame integration + 5 tests`**
   - lobbyState.ts: state field, dealCards mod, endGame mod, advanceTurn function
   - lobbyState.test.ts: 5 new test cases + 1 snapshot test
   - Result: 63+/63+ tests passing

3. **`feat(server): wire ADVANCE_TURN handler + snapshot includes currentTurn`**
   - server.ts

4. **`feat(client): state machine handles TURN_ADVANCED, exposes sendAdvanceTurn`**
   - state machine + hook (useLobby or equivalent)

5. **`feat(client): TurnIndicator component (compact + large variants)`**
   - New file: components/game/TurnIndicator.tsx

6. **`feat(client): GM turn UI + non-GM compact indicator on PlayingScreen`**
   - PlayingScreen.tsx + parent route wiring

7. **`test(e2e): add G4 turn advance test`**
   - tests/G.gm.spec.ts

8. **`docs: mark Sub-phase 4.2 complete in PHASE_4_PLAN.md`**

Push to `origin/phase-4-gm-mode`.

---

## Acceptance criteria

Sub-phase 4.2 is done when ALL of these pass:

### Automated
- [ ] `npm run type-check` clean
- [ ] `npm test` shows 63+/63+ passing
- [ ] `npm run build` succeeds with no warnings
- [ ] G4 e2e test passes

### Manual smoke test (6 contexts on local)

Run `npm run dev` and open 6 tabs:

1. **Tab 1 (GM):** create room
2. **Tabs 2-6:** join with 6-digit code
3. **Tab 1:** deck editor → add 1 Sói Thường + 4 Dân Làng (total 5 cards = 5 non-GM)
4. **Tabs 2-6:** ready up
5. **Tab 1:** start game
6. **After transition completes:**
   - Tab 1 (GM): sees large "ĐÊM ngày 1" + Moon icon + hint text + "Kết thúc đêm" button
   - Tabs 2-6: see compact pill "Đêm ngày 1" at top of card reveal screen
7. **Tab 1:** tap "Kết thúc đêm"
8. **Within ~500ms:**
   - Tab 1: shows "SÁNG ngày 1" + Sun icon + new hint + "Kết thúc ngày" button
   - Tabs 2-6: pill updates to "Sáng ngày 1"
9. **Tab 1:** tap "Kết thúc ngày"
10. **All 6 update to "ĐÊM ngày 2"** (day counter incremented)
11. **Refresh Tab 1 in browser** while at "ĐÊM ngày 2"
12. **Tab 1 reconnects and shows "ĐÊM ngày 2"** (NOT back to ngày 1)
13. **Tab 1:** end game → all 6 back to lobby, no turn indicator visible
14. **Repeat 3-6** with same deck → turn starts fresh at "ĐÊM ngày 1"

### Edge cases to verify

- [ ] During lobby phase, no turn indicator anywhere (only visible during game)
- [ ] Non-GM cannot trigger advance (no button visible, server would reject if forced)
- [ ] Tabs 2-6 never see the GM's large indicator (compact only)
- [ ] GM tab never sees the non-GM card reveal UI (only the turn UI)
- [ ] Turn data NOT in `GAME_STARTED` message (only in `TURN_ADVANCED` after game starts) — verify in DevTools Network → WS

---

## When to stop and ask

Pause and ask the user (don't guess) if:

- Baseline 58/58 not passing before starting
- After step 2, more than 2-3 existing tests fail and the fix isn't a trivial schema update
- The serializer in step 2 doesn't have an obvious location — ask user where snapshots are built
- Step 4 state machine looks different from your expectations (e.g. uses a different library than XState)
- Step 5 finds no existing `<Button>` component to reuse for the advance button
- The hint text wording in Vietnamese sounds awkward — ask user to validate native phrasing

Better to pause and confirm than diverge.

---

## Reference docs already in repo

After this handover loads, these exist on the `phase-4-gm-mode` branch:

- `docs/PHASE_4_DECISIONS.md` — locked design decisions
- `docs/PHASE_4_PLAN.md` — overall Phase 4 broken into sub-phases
- `docs/PHASE_4.1_BRIEF.md` + `docs/PHASE_4.1_PLAN.md` — completed reference
- `docs/PHASE_4.2_BRIEF.md` — this sub-phase's "what & why"
- `docs/PHASE_4.2_PLAN.md` — this sub-phase's detailed file-by-file plan

If contradictions: DECISIONS.md > PLAN.md > BRIEF.md > this handover.

---

## Communication style

User is Vietnamese, technical, direct. Prefers:
- **Vietnamese in chat**, **English in code identifiers/comments**
- **Targeted edits over full file rewrites** (save tokens)
- **PO sign-off earned**, not rubber-stamped — be rigorous about manual smoke validation

---

## Final report template

After all commits land, report:

```
✅ Sub-phase 4.2 complete on phase-4-gm-mode branch.

Tests: 63+/63+ server, G4 e2e added and passing.
Build: clean, no warnings.

Commits pushed to origin/phase-4-gm-mode:
  <sha> chore: add CurrentTurn type, ADVANCE_TURN + TURN_ADVANCED schemas
  <sha> feat(server): advanceTurn reducer + dealCards/endGame integration + 5 tests
  <sha> feat(server): wire ADVANCE_TURN handler + snapshot includes currentTurn
  <sha> feat(client): state machine handles TURN_ADVANCED, exposes sendAdvanceTurn
  <sha> feat(client): TurnIndicator component (compact + large variants)
  <sha> feat(client): GM turn UI + non-GM compact indicator on PlayingScreen
  <sha> test(e2e): add G4 turn advance test
  <sha> docs: mark Sub-phase 4.2 complete in PHASE_4_PLAN.md

Acceptance checklist:
- [✓] type-check clean
- [✓] 63+/63+ server tests
- [✓] build succeeds
- [✓] G4 e2e passes
- [ ] manual smoke (pending user run with 6 tabs)

When you run the smoke test (see PHASE_4.2_BRIEF.md "Acceptance criteria"), report
back any issues and we'll iterate before moving to Sub-phase 4.3.
```
