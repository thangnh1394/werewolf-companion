# Phase 4 — GM Mode Implementation Plan

> All design decisions locked in `PHASE_4_DECISIONS.md`. This file breaks
> implementation into shippable sub-phases.

## Strategy

Phase 4 introduces 6 intertwined features (GM role, transfer, omniscient view,
turn tracking, death tracking, replay). Shipping them as one PR = risky review
+ painful rollback if anything regresses.

**Approach:** 4 sub-phases, each independently testable. Each merges into
`phase-4-gm-mode` branch. Final merge to `main` after all 4 land.

```
main
 └── phase-4-gm-mode
      ├── phase-4.1-gm-foundation       (rename + min=6 + GM excluded from deal)
      ├── phase-4.2-turn-tracking       (đêm/ngày state + advance buttons)
      ├── phase-4.3-omniscient-deaths   (GM view + death marking)
      └── phase-4.4-replay              (log + post-game replay modal)
```

Each sub-phase has its own BRIEF/PLAN/ACCEPTANCE/HANDOVER like Phase 2.x did
(but lighter — these are smaller).

---

## Sub-phase 4.1 — GM Foundation (~4 hours)

**Goal:** Rename "host" → "GM (Quản trò)" everywhere. Update min=6. Exclude GM
from card deal. GM transfer in lobby. No new game mechanics yet.

### Server changes
- `MIN_PLAYERS` constant: 5 → 6 in `packages/shared/src/constants.ts`
- Reducer `dealCards`:
  - Filter players: `playersToReceiveCard = players.filter(p => !p.isHost)`
  - Validate: `deckSize === playersToReceiveCard.length`
  - Shuffle + assign only to non-GM players
  - GM gets no `YOUR_CARD` message
- New message: `TransferGmMessage { type: 'TRANSFER_GM', targetSessionId }`
  - Validation: sender is current GM, target is in players list, phase === 'lobby'
  - Reducer: swap `isHost` flags + update `hostSessionId`
  - Broadcast: `PLAYER_UPDATED` for both old + new GM
- Server tests: 6 new tests
  - GM excluded from deal (5 cards for 6 players including GM)
  - Deal fails if non-GM count !== deck size
  - Transfer GM in lobby succeeds
  - Transfer GM during playing rejected
  - Transfer to non-existent player rejected
  - Old GM after transfer is regular player

### Client changes
- Rename UI text: "Quản trò" everywhere "Chủ phòng" appears
- Lobby:
  - Each player row gets a "Làm quản trò" button visible to current GM only
  - Tapping → `TransferGmConfirmDialog` → confirm → send `TRANSFER_GM`
  - GM transferred screen briefly shows "Bạn không còn là quản trò"
- Player count display: "X/6 đã sẵn sàng" reflects 6-min
- "Cần ít nhất 6 người chơi" message updated
- `canStartGame` logic uses `players.filter(p => !p.isHost).length`
- After dealCards, GM screen shows:
  - No card UI
  - Placeholder: "Bạn là quản trò. Hãy điều phối trận đấu."
  - (Omniscient view comes in 4.3)

### Acceptance
- 52+6 = 58 tests pass
- Manual: 6 contexts, host stays in lobby, deal cards, GM screen shows no card,
  5 players see cards, end game returns to lobby
- Manual: transfer GM in lobby works, transfer during playing button hidden

---

## Sub-phase 4.2 — Turn Tracking (~4 hours)

**Goal:** Auto-alternating đêm/ngày turn counter with "End turn" button for GM.

### Server changes
- New room state field: `currentTurn: { day: number, phase: 'night' | 'day' } | null`
- Initialize on `dealCards`: `{ day: 1, phase: 'night' }`
- Clear on `endGame`
- New message: `AdvanceTurnMessage { type: 'ADVANCE_TURN' }`
  - Validation: sender is GM, phase === 'playing', currentTurn !== null
  - Reducer: `night→day` same day; `day→night` next day
  - Broadcast: `TURN_ADVANCED { currentTurn }`
- Server tests: 5 new tests
  - Initial turn on deal = `{day:1, phase:'night'}`
  - Advance night → day same day
  - Advance day → night next day
  - Non-GM cannot advance
  - End game clears turn

### Client changes
- PlayingScreen for GM gets new section above end-game button:
  - Big turn indicator: "ĐÊM ngày 1" or "SÁNG ngày 1"
  - Button: "Kết thúc đêm" or "Kết thúc ngày"
  - On click → send `ADVANCE_TURN`
- PlayingScreen for non-GM:
  - Small read-only turn indicator at top of card view
  - "Đêm ngày 1 - Đang trong đêm"
- State machine handles `TURN_ADVANCED` event
- Hint copy: night = "Sói tỉnh dậy. GM gọi từng vai."; day = "Cả làng thảo luận và treo cổ."

### Acceptance
- 58+5 = 63 tests pass
- Manual: deal cards → night 1 visible on all 6, GM ends night → day 1, end day → night 2

---

## Sub-phase 4.3 — Omniscient View + Death Tracking (~5 hours)

**Goal:** GM sees all role assignments. GM can mark players dead. Dead players
see "Bạn đã chết" overlay.

### Server changes
- New message broadcast on `dealCards`: `GM_ASSIGNMENTS { assignments: { sessionId: cardId }[] }`
  - Sent ONLY to GM (private)
- New room state field: `deaths: { sessionId, day, phase, reason }[]`
- New message: `MarkDeathMessage { type: 'MARK_DEATH', sessionId, reason }`
  - Validation: sender is GM, phase === 'playing', target alive
  - Reducer: append to `deaths` array with current turn info
  - Broadcast: `PLAYER_DIED { sessionId, day, phase, reason }`
- New message: `UndoDeathMessage { type: 'UNDO_DEATH', sessionId }`
  - For misclicks. Removes most recent death of that player.
- Server tests: 7 new tests
  - GM_ASSIGNMENTS sent only to GM (not other players)
  - Mark death stores correct day+phase+reason
  - Non-GM cannot mark death
  - Mark death broadcasts to all
  - Cannot mark already-dead player
  - Undo death removes record
  - End game clears deaths

### Client changes
- GM PlayingScreen gets new tab/section: "Toàn cảnh"
  - List of all non-GM players with avatar + name + role assigned
  - Each row tappable → death dialog (preset reasons: "Sói cắn", "Treo cổ", "Bị giết", "Khác")
  - Already-dead players: dimmed + crossed-out + death reason shown
  - "Hoàn tác" button next to each dead player (small icon)
- Non-GM player who is alive: unchanged UX (card reveal works)
- Non-GM player who is dead:
  - Card reveal still works (they know their role)
  - Overlay banner at top: "Bạn đã chết. Vui lòng giữ im lặng và chờ trận kết thúc."
  - Background dimmed slightly
- All players (alive + dead + GM) see death events as toasts: "Bob đã chết (Sói cắn)"

### Acceptance
- 63+7 = 70 tests pass
- Manual: GM sees all 5 role assignments, marks 2 deaths, dead players see overlay, undo works

---

## Sub-phase 4.4 — Replay (~3 hours)

**Goal:** Capture turn log + deaths + notes during game. Show replay modal at
end. Session-only (no persistence).

### Server changes
- New room state: `gameLog: TurnLogEntry[]`
  - Each entry: `{ day, phase, notes: string, deathsThisTurn: Death[] }`
- Append entry on `ADVANCE_TURN` (capture state of current turn before advancing)
- Append final entry on `END_GAME` (last turn before game ended)
- New message: `UpdateTurnNotesMessage { type: 'UPDATE_TURN_NOTES', notes: string }`
  - Validation: sender is GM, currentTurn !== null
  - Reducer: store on `currentTurnNotes` field (not gameLog yet — only flushed on advance)
  - Broadcast: nothing (only GM cares while playing)
- On `END_GAME`: broadcast `GAME_ENDED_WITH_LOG { gameLog }` instead of plain `GAME_ENDED`
- Server tests: 4 new tests
  - Notes saved per turn
  - Notes flushed to log on advance
  - Final log includes all turns + deaths
  - Max 2000 chars enforced

### Client changes
- GM PlayingScreen: notes textarea in turn section
  - Debounced 500ms auto-save → `UPDATE_TURN_NOTES`
  - Read-only after advance
- On `GAME_ENDED_WITH_LOG`:
  - Modal: "Xem lại quá trình ván?"
  - Yes → ReplayScreen
  - No → back to lobby
- ReplayScreen:
  - Scrollable list of turn entries chronologically
  - Each entry: turn header + notes + deaths in that turn
  - "Đóng" button → return to lobby
- Replay is session-only: if user closes modal or refreshes, log lost

### Acceptance
- 70+4 = 74 tests pass
- Manual: full ván (5 turns, 2 deaths, 1 note), end game, replay shows all correctly
- Refresh during replay → lost, lands in lobby (acceptable)

---

## Out of Phase 4 (potential Phase 5)

- Voice integration (in-app announce instead of GM speaking)
- Game timer (each turn has soft countdown)
- Photo of phòng during game (record physical moment)
- Stats dashboard ("you've been Sói 3/10 ván")
- Auto-resolve win conditions (currently GM judges manually)
- Persistent replay history (currently session-only per Q3)

These are explicit non-goals to keep Phase 4 scoped.

---

## Order of operations

Code this in branch `phase-4-gm-mode`:

1. Sub-phase 4.1 → commit → manual smoke test
2. Sub-phase 4.2 → commit → manual smoke test
3. Sub-phase 4.3 → commit → manual smoke test
4. Sub-phase 4.4 → commit → full E2E manual run
5. Update E2E test suite for new flows (+ tests for GM scenarios)
6. PR `phase-4-gm-mode` → `main`

Total estimated effort: **~16 hours** across 4 sessions.
