# Sub-phase 4.1 — BRIEF: GM Foundation

> **Purpose:** Highest-level "what & why". Read this first.
> **Sibling docs:** `PHASE_4.1_PLAN.md` (how, file-by-file), `PHASE_4_DECISIONS.md`
> (locked design decisions for entire Phase 4)

## Why this sub-phase

Phase 4 introduces GM Mode — a major shift from "card dealer" to "card dealer + game state tracker". Doing it as one commit would mix 6 different concerns in 1 PR, untestable in isolation.

This sub-phase establishes the **foundation**: rename host → GM, change min players to 6, and ensure GM is excluded from card dealing. No new game mechanics yet. Once this lands, sub-phases 4.2-4.4 add features (turn tracking, deaths, replay) on top.

**Critical principle:** This sub-phase must NOT regress any existing behavior except the rename + min count change + GM-excluded-from-deal. Specifically:
- All existing 52 tests must still pass (potentially modified to reflect new rules)
- All 18 E2E tests must still pass (with minor selector updates for renamed UI)
- App functionality on production stays identical for non-GM players

## What ships

### User-visible changes

1. **"Chủ phòng" → "Quản trò" everywhere in UI**
   - Player row badge
   - Tooltips
   - Error/info messages
   - Lobby summary text
2. **Minimum players: 5 → 6**
   - Start button disabled until 6 players
   - Message "Cần ít nhất 6 người chơi"
   - Deck size validation: `nonGmPlayers.length === deckSize`
3. **GM doesn't get dealt a card**
   - On `dealCards`, only non-GM players receive `YOUR_CARD`
   - GM's PlayingScreen shows placeholder: "Bạn là quản trò. Hãy điều phối trận đấu."
   - (Omniscient view comes in 4.3, not here)
4. **GM transfer button in lobby**
   - Each non-GM player row shows "Làm quản trò" button (visible only to current GM)
   - Tap → confirm dialog → swap GM role
   - Only available in `phase === 'lobby'`. Hidden during playing.

### What's explicitly NOT in this sub-phase

- Turn tracking (đêm/ngày counter) → 4.2
- Omniscient view (GM sees all assignments) → 4.3
- Death marking → 4.3
- Notes + replay → 4.4
- Voice/timer/stats → Phase 5

## Why this scope is correct

**It's the minimum viable foundation.** Each later sub-phase depends on:
- 4.2 turn tracking needs the "GM concept" already in code (host = GM is the simplest correct first step)
- 4.3 omniscient view needs `playersWhoGetCards` filter (added here)
- 4.4 replay needs the GM role to exist as the message originator

If we tried to add turn tracking before this, we'd have to write throwaway code that uses "host" then refactor it. Doing the rename + filter once at the start saves cycles.

**It's testable in isolation.** After this sub-phase:
- 6 players join lobby
- GM transfer works → role transfers across both clients
- Start game → 5 players get cards, GM doesn't
- End game → return to lobby with GM still GM

All of this can be tested without 4.2/4.3/4.4 features existing.

## Risks + mitigations

| Risk | Mitigation |
|---|---|
| Renaming breaks existing E2E test selectors | Update selectors in same commit; tests run in CI |
| MIN_PLAYERS change breaks existing playtests | Communicate to user — they'll need 6 friends now |
| GM not getting a card surprises players | Placeholder screen explicitly explains GM role |
| Transfer mid-game breaks state | Server-side validation rejects with clear error |
| Old "Chủ phòng" text in storage / userMemories | One-off concern, no impact (we don't store role labels) |

## Acceptance criteria (definition of done)

**Code:**
- [ ] All TypeScript compiles strict
- [ ] All 52 existing server tests pass (potentially adapted to new rules)
- [ ] 6 new server tests added (see PLAN), all pass → 58 total
- [ ] No new ESLint warnings

**Behavior (manual smoke):**
- [ ] Create room as host. Lobby shows "Quản trò" badge on host row.
- [ ] Open 5 more browser contexts, join → 6 players visible in lobby.
- [ ] "Start" button disabled until 6th player joins.
- [ ] Host taps "Làm quản trò" on another player → confirm dialog → role swaps. Original host loses badge, new player has it.
- [ ] Host (new GM) opens deck editor, adds 5 cards (matching 5 non-GM players).
- [ ] All 5 non-GM ready up.
- [ ] GM starts game → 5 players see card reveal screens, GM sees "Bạn là quản trò" placeholder.
- [ ] GM ends game → all 6 back to lobby, GM still GM.

**Tests:**
- [ ] E2E suite passes after selector updates (Quản trò labels)

**Deployment:**
- [ ] Branch `phase-4-gm-mode` builds in CI
- [ ] Manual deploy to staging environment if available, OR clear note "merged but not deployed to main yet"

## Approval gate

Before coding starts, user reviews this BRIEF + the companion PLAN doc. Any "wait, what about X?" must be resolved before commits begin.

After coding, user runs the acceptance manual smoke list above. Only then merge to `phase-4-gm-mode` branch.
