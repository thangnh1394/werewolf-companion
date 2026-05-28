# BRIEF — Phase 2.4: Card Dealing Logic

> **Agent:** Product Manager
> **Sub-phase:** 2.4 (Card Dealing Logic)
> **Module:** Server-side shuffle + private card assignment + room lock + refresh restore
> **Parent decisions:** see `PHASE_2_DECISIONS.md`
> **Builds on:** Phase 2.3 room desk (the deck composition is the dealing source)

## Tool

Phase 2.4 makes "Bắt đầu chia bài" actually deal cards. When the host starts the game, the server shuffles the room desk and assigns one card privately to each player. Each player receives ONLY their own card (never broadcast). The room locks (no new players). Players who refresh or briefly disconnect get their same card back.

This sub-phase is **logic only** — the "Bài của tôi" reveal screen (tap-and-hold UI) is Phase 2.5. For Phase 2.4, the dealt card can be shown in a simple placeholder so we can verify the dealing works end-to-end.

## Users

- **Host** — triggers the deal by starting the game
- **All players (including host)** — each receives one private card

## Problem solved

After Phase 2.3, the host can compose a deck but "Bắt đầu chia bài" only shows a placeholder modal. Phase 2.4 turns that button into a real deal: shuffle the deck, give everyone a secret role, lock the room.

## Primary user journey

1. Lobby has N players, all ready, deck has exactly N cards (validated in Phase 2.3).
2. Host taps "Bắt đầu chia bài".
3. Server:
   - Expands the room desk into a flat array of N cardIds (e.g. `{werewolf: 2, villager: 3}` → `[werewolf, werewolf, villager, villager, villager]`)
   - Shuffles with Fisher-Yates using `crypto.getRandomValues()`
   - Assigns shuffled[i] to players[i] → builds `Map<SessionId, cardId>`
   - Transitions phase `lobby → playing`
   - Sends each connection a private `YOUR_CARD { cardId }` message (NOT broadcast)
   - Broadcasts `GAME_STARTED` (phase change only, no card info)
4. Each client receives their `YOUR_CARD` → transitions to a "playing" screen showing their card (Phase 2.4 placeholder; Phase 2.5 makes it tap-and-hold).
5. Room is now locked: any brand-new player trying to join gets `room_in_progress` error.

### Refresh / reconnect during game

1. Player refreshes browser mid-game.
2. Client reconnects with same `sessionId` (from localStorage).
3. Server recognizes returning player (already in `players` map + has card assignment).
4. Server resends `STATE_SNAPSHOT` (with `phase: 'playing'`) + private `YOUR_CARD` again.
5. Client restores directly to the playing screen with their card.

## In scope (Phase 2.4 deliverable)

### Server side
- **New state field:** `assignments: Map<SessionId, cardId>` in `LobbyState`
- **New reducer:** `dealCards(state, shuffleFn)` — expands deck, shuffles, assigns; returns new state with `assignments` populated + `phase: 'playing'`
- **Shuffle utility:** Fisher-Yates using `crypto.getRandomValues()` (injectable for deterministic testing)
- **New WS messages:**
  - **Server → Client (private):** `YOUR_CARD { cardId }` — sent individually to each connection
  - **Server → Client (broadcast):** `GAME_STARTED` — replaces `GAME_STARTED_STUB`, signals phase change
- **Update `handleStartGame`:** after `canStartGame` passes, call `dealCards`, persist, send private cards, broadcast `GAME_STARTED`
- **Update `STATE_SNAPSHOT`:** include the requesting player's own card (`yourCard?: cardId`) so refresh restores it
- **Persistence:** `assignments` round-trips through SQLite (same Map pattern)
- **Room lock:** already handled by Phase 1 `addPlayer` (`room_in_progress` when `phase === 'playing'`) — verify still works
- **Assignments persist until END_GAME** (Phase 2.6) — not cleared on disconnect

### Client side
- **State machine:** add `playing` state, `yourCard` in context, handle `YOUR_CARD` + `GAME_STARTED` events
- **useLobby:** expose `yourCard` from context
- **New component:** `PlayingScreen.tsx` — Phase 2.4 placeholder showing the dealt card (name + image + team). Phase 2.5 will replace with tap-and-hold reveal.
- **Update `LobbyScreen`:** when phase transitions to `playing`, render `PlayingScreen` instead of the stub modal
- Remove the Phase 1 `GAME_STARTED_STUB` placeholder modal

### Shuffle correctness
- Each card in the deck assigned to exactly one player
- No card lost or duplicated beyond its deck count
- Deck size === player count guaranteed by Phase 2.3 validation (defense: assert in dealCards)

## Out of scope (NOT in Phase 2.4)

- ⏭ Tap-and-hold reveal animation → Phase 2.5 (Phase 2.4 shows card plainly)
- ⏭ End game / return to lobby → Phase 2.6
- ⏭ Night/day phase tracking, role actions → not in Phase 2 at all (this app is a dealer, not a game engine)
- ⏭ Spectator mode (rejected by user)
- ⏭ Re-deal / re-shuffle button

## Decisions locked (from PM intake)

1. ✅ **Shuffle:** `crypto.getRandomValues()` Fisher-Yates (fair, injectable for tests)
2. ✅ **Assignments lifetime:** persist until END_GAME (Phase 2.6) — survive disconnect/reconnect/refresh
3. ✅ **New players during game:** rejected with `room_in_progress`; no spectator mode

## Acceptance criteria

1. Given a lobby with 5 players all ready and a 5-card deck, when host taps "Bắt đầu chia bài", then each player receives exactly one `YOUR_CARD` message within 500ms.
2. Given cards are dealt, then the multiset of dealt cards exactly equals the room desk composition (e.g. 2 werewolf + 3 villager dealt iff deck was `{werewolf:2, villager:3}`).
3. Given cards are dealt, then no two players share the same card *instance* (counts respected; if deck has 2 werewolves, exactly 2 distinct players are werewolves).
4. Given a player receives `YOUR_CARD`, then their client shows the playing screen with the correct card name, image, and team.
5. Given the game has started (`phase: 'playing'`), when a brand-new player tries to join, then they receive `JOIN_ERROR` with `reason: 'room_in_progress'`.
6. Given a player refreshes mid-game, when they reconnect with the same sessionId, then they see their same card again (restored via STATE_SNAPSHOT yourCard).
7. Given the host is also a player, then the host also receives a card (host plays too — Phase 0 decision).
8. Given `GAME_STARTED` is broadcast, then no card information is included in the broadcast payload (cards only sent via private `YOUR_CARD`).
9. Given the shuffle uses `crypto.getRandomValues()`, then dealing is deterministic in tests via an injected shuffle function.
10. Given assignments exist, then they persist through DO eviction (SQLite round-trip) and player disconnect.
11. Given no regression: all 36 Phase 2.3 tests pass + lobby/desk/kick flows unchanged.
12. Given dealing completes, then `assignments.size === players.size` (everyone got exactly one card).

## Constraints

- **No regression:** 36 tests must pass. Add new tests for `dealCards` + shuffle.
- **Privacy:** `YOUR_CARD` sent via `sendTo(conn)` per connection, NEVER `broadcast`. Critical — a broadcast would leak everyone's roles.
- **Determinism in tests:** `dealCards` takes an injectable shuffle function so tests can pass identity/reverse shuffle.
- **Bundle:** +1 component + state extension, target ≤ +4 KB gzipped.
- **Tech:** No new deps. `crypto.getRandomValues()` is available in Cloudflare Workers + browsers.

## Success signal

When 5 friends in a room tap ready, the host taps "Bắt đầu chia bài", and within half a second each person's screen shows their own secret role (2 see "Sói", 3 see "Dân Làng") — and nobody can see anyone else's — that's the Phase 2.4 win. Bonus: someone refreshes their phone and their role comes right back.

## Implementation order suggested

1. **Architect** — state extension + shuffle utility + message schemas + dealing flow
2. **Designer mockup** — simple PlayingScreen placeholder (Phase 2.5 will redesign)
3. **Developer (server)** — dealCards reducer + shuffle + tests + handler + private send + persistence
4. **Developer (client)** — state machine playing state + PlayingScreen + integration
5. **QA** — type-check + tests + privacy audit (verify no card in broadcast) + build
6. **PO** — accept against 12 criteria
