# BRIEF — Phase 2.3: Room Desk Editor

> **Agent:** Product Manager
> **Sub-phase:** 2.3 (Room Desk Editor)
> **Module:** Host-only UI to compose the deck of cards for next match
> **Parent decisions:** see `PHASE_2_DECISIONS.md`, `PHASE_0_DECISIONS.md`
> **Builds on:** Phase 2.1 card foundation (15 cards data + Main Desk display)

## Tool

Phase 2.3 adds the **Room Desk Editor** — a host-only UI letting the host pick which cards (and how many of each) will be in the next match. Everyone in the lobby sees a read-only preview of the deck the host has chosen. Server holds the authoritative state and syncs all clients in realtime.

## Users

- **Host** — composes the deck before the match (the only one who edits)
- **Players** — see what's in the deck so they know what they might be dealt

## Problem solved

Before Phase 2.3, the lobby has no deck — the "Bắt đầu chia bài" button leads to a placeholder. With this sub-phase, the host can actually build the deck (e.g. 2 Sói + 1 Tiên Tri + 1 Phù Thủy + 4 Dân = 8 cards for 8 players), and everyone sees what's queued up. Phase 2.4 will then deal those cards.

## Primary user journey

### Host flow

1. Host is in lobby. Sees a new "Sửa bộ bài" button (only visible to host) below the share-room card.
2. Tap "Sửa bộ bài" → Room Desk Editor opens (full-screen, similar layout to Main Desk).
3. Sees all 15 cards in 3 team sections, each with a counter chip showing current count (e.g. `0`, `1`, `2`).
4. **Tap a card cell** → counter increments by 1 (cycles 0 → 1 → 2 → ... → max).
5. **Long-press a card cell** → counter decrements by 1 (with light haptic feedback if supported).
6. Live counter at the top: "`{deckSize}` / `{playerCount}` thẻ" — colored:
   - **Amber** when `deckSize !== playerCount` (mismatch)
   - **Green** when `deckSize === playerCount` (ready)
7. Each card change broadcasts to server → all clients update.
8. Tap "Xong" / back arrow → return to lobby. State persists.

### Player flow

1. Player is in lobby. Sees a new "Bộ bài đêm nay" expandable card below the share-room card.
2. Tap to expand → sees a compact horizontal scrollable list of card chips (e.g. `2× Sói`, `1× Tiên Tri`, `1× Phù Thủy`, `4× Dân`).
3. Tap any chip → opens existing CardDetailDialog (from Phase 2.1).
4. Read-only: no edit controls; cannot change anything.
5. Display updates in realtime as host edits.

### Start game flow (extended from Phase 1)

1. When host taps "Bắt đầu chia bài":
   - **If** `deckSize !== playerCount` → show error toast: `Cần đúng {playerCount} thẻ trong bộ bài. Hiện tại có {deckSize}.`
   - **If** `deckSize === playerCount` → proceed to Phase 2 stub (Phase 2.4 will replace with real deal logic).

## In scope (Phase 2.3 deliverable)

### Server side
- Extend `LobbyState` with `roomDesk: Map<cardId, count>`
- Add WebSocket messages:
  - **Client → Server:** `SET_CARD_COUNT { cardId, count }` (host only)
  - **Server → Client:** `ROOM_DESK_UPDATED { deck: Record<cardId, count> }`
- Server validates: only host can edit, count must be ≥ 0 and ≤ MAX_PLAYERS (20)
- Room desk **persists** across:
  - Player joins/leaves
  - Host disconnect + reconnect (within 5 min)
  - DO eviction (snapshot to SQLite storage)
- Room desk **persists across end game** (Phase 0 decision — preserved for next round)
- Initial state: empty room desk `{}`
- Include `roomDesk` in `STATE_SNAPSHOT` so new clients get current state on join
- Extend Phase 1 unit tests with new reducers (`setCardCount`, validation rules)

### Client side
- **New component:** `RoomDeskEditor.tsx` — full-screen editor (host only)
- **New component:** `CardCellWithCounter.tsx` — variant of `CardCell` with counter chip + tap/long-press handlers
- **New component:** `RoomDeskPreview.tsx` — collapsible read-only chips in lobby (visible to ALL players)
- **Update `LobbyScreen.tsx`** — add "Sửa bộ bài" button (host only) + render `RoomDeskPreview`
- **Update `useLobby.ts`** — handle new server messages (`ROOM_DESK_UPDATED`), expose `setCardCount` action
- **Update `lobbyMachine.ts`** — add `roomDesk` to context, handle `ROOM_DESK_UPDATED` event
- **Update Start button logic** — disable + show error toast if `deckSize !== playerCount`

### Validation rules (server-enforced)
- Only `sessionId === hostSessionId` may emit `SET_CARD_COUNT`
- `count` must be integer ≥ 0 and ≤ `MAX_PLAYERS`
- Editing is rejected if `phase === 'playing'`
- Non-host clients sending `SET_CARD_COUNT` are silently ignored (don't kick — could be race condition after host transfer)

## Out of scope (NOT in Phase 2.3)

- ⏭ Quick presets (deferred — user said not needed)
- ⏭ Lock edit when host disconnect (rejected — natural behavior preferred)
- ⏭ Card dealing logic → Phase 2.4
- ⏭ "Bài của tôi" reveal → Phase 2.5
- ⏭ End game flow → Phase 2.6
- ⏭ Save deck as custom preset
- ⏭ Drag-and-drop reorder

## Improvements accepted (from PM intake)

1. ✅ **Counter chip with tap-to-cycle / long-press-to-decrement** — replaces "+" / "-" buttons for cleaner mobile UX
3. ✅ **Player can see room desk read-only** — fosters trust + lets players prepare

## Improvements rejected (from PM intake)

2. ❌ **Quick presets** — user prefers manual flexibility for now
4. ❌ **Lock edit when host disconnect** — user prefers natural behavior (pending edits lost on disconnect)

## Acceptance criteria

1. Given a lobby with host "Hoàng", when host taps "Sửa bộ bài", then Room Desk Editor opens showing 15 cards grouped by team with counter chips starting at 0.
2. Given host is on Editor screen, when host taps "Sói Thường" card, then counter increments to 1 within 200ms and broadcasts to all other clients.
3. Given host is on Editor screen, when host long-presses "Sói Thường" (with count = 2), then counter decrements to 1.
4. Given host has built deck of 6 cards, when player count is 8, then top counter shows "6 / 8 thẻ" in amber color (mismatch indicator).
5. Given host has built deck of 8 cards matching 8 players, then top counter shows "8 / 8 thẻ" in green.
6. Given any player in lobby, when host edits room desk, then player's "Bộ bài đêm nay" preview updates within 200ms.
7. Given a player (non-host) opens lobby, when they tap "Bộ bài đêm nay" to expand, then they see compact chips (e.g. `2× Sói`) — no edit controls visible.
8. Given player taps a card chip in preview, then existing CardDetailDialog opens showing role info.
9. Given host taps "Bắt đầu chia bài" with `deckSize !== playerCount`, then a toast error shows "Cần đúng N thẻ trong bộ bài. Hiện tại có M." and start is blocked.
10. Given host disconnects mid-edit, when host reconnects within 5 min, then room desk reflects last persisted state (in-flight edits not lost; server has them).
11. Given a DO eviction happens (server cold start), when state is rehydrated from SQLite, then `roomDesk` is preserved.
12. Given Phase 1 + Phase 2.1 features all still work (no regression): 25 existing tests pass + Main Desk + share room + ready toggle + kick + start placeholder.

## Constraints

- **No regression:** All Phase 1 tests (25) must still pass. Add new tests for state reducers.
- **Performance:** Each edit triggers exactly 1 server broadcast (no debounce — server is single-threaded, broadcasts are cheap)
- **Mobile-first:** Counter chip must be tappable with finger; long-press must work on touch + mouse (right-click as fallback for desktop testing)
- **Bundle size:** Adding ~3 components + 1 state extension shouldn't exceed +5 KB gzipped
- **Tech:** Continue Phase 2.1 stack (no new dependencies)

## Success signal

When a host opens the Editor on their phone for the first time and can compose a deck of 8 cards for 8 players in under 30 seconds — taps to add, long-presses to remove, sees the counter turn green when matched — and all 7 friends in the lobby see the deck building up live as the host taps. That's the Phase 2.3 win.

## Implementation order suggested

1. **Architect** — server state extension + new message schemas + state machine update
2. **Designer mockups** — Editor screen + counter chip states + RoomDeskPreview collapsed/expanded
3. **Developer (server first)** — state reducers + tests + server message handlers
4. **Developer (client)** — wire new actions through useLobby + state machine + components
5. **QA** — type-check + tests + build + smoke checklist
6. **PO** — accept against 12 criteria
