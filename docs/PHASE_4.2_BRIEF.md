# Sub-phase 4.2 — BRIEF: Turn Tracking

> **Purpose:** Highest-level "what & why". Read this first.
> **Sibling docs:** `PHASE_4.2_PLAN.md` (file-by-file), `PHASE_4_DECISIONS.md`
> **Depends on:** Sub-phase 4.1 (GM role established, GM excluded from deal)

## Why this sub-phase

After 4.1, the GM exists as a role but has nothing meaningful to do during a game — they just sit on the "Bạn là quản trò" placeholder while players reveal cards. This sub-phase gives the GM their first real game-flow control: a turn counter that alternates đêm/ngày, with the GM advancing it via an explicit "Kết thúc đêm/ngày" button.

This is the **second of four sub-phases** in Phase 4. After 4.2:
- GM screen has real content (turn indicator + advance button)
- All players see what turn it is (read-only for non-GM)
- 4.3 will add the omniscient view + death marking, which use this turn data
- 4.4 will add notes + replay, which capture turn snapshots

**Critical principle:** Turn tracking is purely additive. The dealCards/endGame contract from earlier phases stays exactly the same. We only add a new field to the state and a new message type. Privacy invariant: `currentTurn` is broadcast to everyone (it's not secret).

## What ships

### Server changes
1. **New state field:** `currentTurn: { day: number, phase: 'night' | 'day' } | null`
2. **Initialized on game start:** `{ day: 1, phase: 'night' }`
3. **Cleared on game end:** set back to `null`
4. **New message `ADVANCE_TURN`:**
   - `night → day` (same day number)
   - `day → night` (day number + 1)
5. **5 new server tests** → 63 total

### User-visible changes
1. **GM during game:** sees a prominent turn indicator + an action button
   - "ĐÊM ngày 1" with button "Kết thúc đêm"
   - "SÁNG ngày 1" with button "Kết thúc ngày"
2. **Non-GM during game:** sees a small read-only turn indicator at top of card screen
   - "Đêm ngày 1" / "Sáng ngày 1"
3. **Atmospheric hint copy** under the indicator (GM view only):
   - Night: "Sói tỉnh dậy. Hãy gọi từng vai trò thức dậy theo thứ tự."
   - Day: "Cả làng tỉnh giấc. Bắt đầu thảo luận và bỏ phiếu treo cổ."

### What's explicitly NOT in this sub-phase

- Omniscient view (GM seeing all role assignments) → 4.3
- Death marking → 4.3
- Notes per turn → 4.4
- Replay screen → 4.4
- Auto-night-progression (waking up roles in order) → potentially Phase 5

## Why this scope is correct

**It's the minimum useful turn primitive.** The GM needs *something* to do mid-game; this is the simplest mechanic that adds value. Without it, the GM placeholder from 4.1 stays static — every other Phase 4 feature (deaths in 4.3, notes in 4.4) needs to know what turn it is.

**It's testable in isolation.** No dependency on death/notes/replay state. Pure CRUD on a single state field.

**It cleanly precedes 4.3.** Death events in 4.3 need to record "which turn the death happened in" — that requires turn tracking to exist first.

## Risks + mitigations

| Risk | Mitigation |
|---|---|
| Turn state desync if a player joins mid-game | Joining mid-game already blocked; `currentTurn` is part of the snapshot sent on join, so reconnect re-syncs |
| GM accidentally advances twice (double-click) | Server-side: rapid advances OK (no debounce needed — game logic tolerates). Client: button briefly disables after click to avoid double-fire |
| Non-GM somehow sends `ADVANCE_TURN` | Server validates `senderSessionId === hostSessionId`, returns error otherwise |
| Refresh mid-game loses local turn state | Server is source of truth; snapshot on reconnect includes `currentTurn` |
| Turn data leaks during transition video | `GAME_STARTED` doesn't carry turn info; client initializes from snapshot AFTER transition |

## Acceptance criteria (definition of done)

**Code:**
- [ ] All TypeScript strict-compiles
- [ ] 58 baseline tests still pass
- [ ] 5 new server tests added → 63 total, all green
- [ ] No new ESLint warnings
- [ ] Snapshot includes `currentTurn` (so reconnect works)

**Behavior (manual smoke):**
- [ ] 6 contexts: 1 GM + 5 players. Deal 5 cards. Start game.
- [ ] After transition, GM screen shows: "ĐÊM ngày 1" + button "Kết thúc đêm"
- [ ] Non-GM screens show small "Đêm ngày 1" indicator at top
- [ ] GM taps "Kết thúc đêm" → all 6 screens update to "SÁNG ngày 1" / "Kết thúc ngày" within ~500ms
- [ ] GM taps "Kết thúc ngày" → all update to "ĐÊM ngày 2" / "Kết thúc đêm"
- [ ] GM ends game → return to lobby, turn cleared
- [ ] Re-deal: turn starts fresh at "ĐÊM ngày 1"
- [ ] Refresh GM tab mid-game (at "SÁNG ngày 3"): reconnects to same turn state

**Edge cases:**
- [ ] Non-GM cannot trigger advance (server rejects, client doesn't show button)
- [ ] If host transfer happened before game (4.1), new GM can advance turns
- [ ] Advance turn while phase=lobby → server rejects (no-op)

## Approval gate

Before coding starts, review this BRIEF + companion PLAN. After all commits land, run the manual smoke list. Only then merge into `phase-4-gm-mode`.
