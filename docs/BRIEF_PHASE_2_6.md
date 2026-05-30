# BRIEF — Phase 2.6: End Game Flow

> **Agent:** Product Manager
> **Sub-phase:** 2.6 (LAST sub-phase of Phase 2)
> **Module:** Host ends the game → all players transition back to lobby for next round
> **Parent decisions:** see `PHASE_2_DECISIONS.md`
> **Builds on:** Phase 2.4 dealing + Phase 2.5 reveal

## Tool

Phase 2.6 adds the "Kết thúc trận" button on PlayingScreen (host-only). When tapped:
- Server clears card assignments
- Resets `isReady` for non-host players (host stays ready)
- KEEPS the `roomDesk` so the next round uses the same deck composition
- Transitions phase `playing → lobby` for everyone
- Broadcasts `GAME_ENDED` event

Players return to lobby, can tap Ready again, host can start a new round with the same deck (or edit it via "Sửa bộ bài"). Completes the full gameplay loop.

## Users

- **Host** — only one who can end the game
- **All players** — see the transition back to lobby

## Problem solved

After Phase 2.5, players can play a round (lobby → deal → reveal). But there's no way to start a SECOND round without leaving the room and creating a new one. Phase 2.6 closes the loop — host taps end → everyone back to lobby → ready → start again. App becomes a usable repeatable game tool.

## Primary user journey

### Host ends the game

1. Game has been playing. Players have revealed their cards, role-played the night/day phases manually, and the game has reached a natural conclusion (host decides — app doesn't track win conditions, it's just a dealer).
2. Host (on PlayingScreen) taps "Kết thúc trận" button at the bottom of the screen.
3. Server receives `END_GAME`, validates host, applies reducer `endGame(state)`:
   - `phase: 'playing' → 'lobby'`
   - `assignments: new Map()` (clear)
   - For each player, `isReady = (sessionId === hostSessionId)` (host stays ready, others reset)
   - `roomDesk` UNCHANGED (preserved for next round)
4. Server broadcasts `GAME_ENDED`.
5. All clients (including host):
   - Receive `GAME_ENDED` → state machine transitions `playing → in_lobby`
   - Clear local `yourCard` from context
   - LobbyScreen renders again — players see lobby, roomDesk preview still showing same deck, ready states reset (only host is ready)

### Player ends round (NOT possible)

Only host can end the game. Non-host tapping any "end" UI does nothing (no UI shown to non-host).

### Disconnect / refresh during transition

1. If a player is mid-refresh when END_GAME arrives, their reconnect STATE_SNAPSHOT will have:
   - `phase: 'lobby'`
   - `yourCard: undefined` (assignments cleared)
2. State machine's guarded transition sends them to `in_lobby` (since snapshotIsPlaying = false now).
3. Player sees lobby — same as everyone else.

## Decisions locked (from PM intake)

1. ✅ **isReady reset:** Non-host → false; Host → true (matches initial room creation behavior)
2. ✅ **Assignments:** Clear immediately (clean reset, no "view past round" feature)
3. ✅ **Confirm dialog:** None — host taps "Kết thúc trận" → ends immediately (simpler UX)

## In scope (Phase 2.6 deliverable)

### Server side
- **New reducer:** `endGame(state, hostSessionId)` — clears assignments, resets non-host ready, transitions to lobby, KEEPS roomDesk
- **New WS message:** `END_GAME` (client → server, host only)
- **New WS message:** `GAME_ENDED` (server → client, broadcast)
- **New handler:** `handleEndGame` — validates host, applies reducer, persists, broadcasts
- **Persistence:** assignments cleared in serialized state; roomDesk preserved
- **Validation:** Only host can end; only during `playing` phase (no-op if already lobby)

### Client side
- **State machine:** add `GAME_ENDED` event in `playing` state → transition to `in_lobby` + clear yourCard
- **useLobby:** expose `endGame()` action
- **PlayingScreen:** add "Kết thúc trận" button at bottom (host only). Style: prominent but not destructive-red (it's a normal action, not "kick"). Reuse Button primary style with amber.
- **No changes** to LobbyScreen — when phase returns to `in_lobby`, existing render works (roomDesk preview still shows the deck).

## Out of scope (NOT in Phase 2.6)

- ⏭ Win/lose tracking — app is a dealer, not a game engine
- ⏭ Round history / score tracking
- ⏭ "Re-deal same deck" shortcut (host can just tap Start with same deck — already works)
- ⏭ Player request to end (mutiny against host)
- ⏭ Auto-end after N minutes

## Acceptance criteria

1. Given game is playing, when host taps "Kết thúc trận", then within 500ms all clients transition to lobby screen.
2. Given END_GAME succeeds, then `assignments` map is empty.
3. Given END_GAME succeeds, then `roomDesk` is unchanged (same cards + counts as before the round).
4. Given END_GAME succeeds, then non-host players have `isReady = false`.
5. Given END_GAME succeeds, then host has `isReady = true` (unchanged from before).
6. Given END_GAME succeeds, then `phase = 'lobby'`.
7. Given a non-host attempts to send END_GAME, then it's silently ignored (no state change, no broadcast).
8. Given END_GAME is sent during lobby phase (game not started), then it's silently ignored (no-op).
9. Given a player refreshes during the playing → lobby transition, then STATE_SNAPSHOT delivers `phase: 'lobby'` and they restore to lobby (no card).
10. Given DO eviction after END_GAME, then SQLite-rehydrated state has empty assignments + preserved roomDesk.
11. Given host taps "Kết thúc trận", then host's screen ALSO transitions to lobby (host doesn't stay on PlayingScreen).
12. No regression: 46 tests pass + all Phase 2.1–2.5 features unchanged.

## Constraints

- **No regression:** 46 server tests + Phase 2.1–2.5 client features must all work
- **Persistence:** End-game state must survive DO eviction
- **Atomic operation:** assignments cleared + phase changed + ready reset must happen in single reducer (no half-applied state)
- **Bundle:** ~+1 KB gzipped (small addition)
- **Tests:** Add ~5 new reducer tests (endGame edge cases)

## Success signal

When a group of friends finishes a round of Sói Đêm, the host taps "Kết thúc trận", everyone's phone snaps back to the lobby with the same deck composition still listed, players tap "Sẵn sàng", host taps "Bắt đầu chia bài" again, new cards dealt — that's the full gameplay loop, and that's the Phase 2 win.

## Implementation order

1. **Architect** — endGame reducer + END_GAME / GAME_ENDED message schemas + state machine update
2. **Designer mockup** — PlayingScreen with "Kết thúc trận" button (host only)
3. **Developer (server first)** — reducer + tests + handler
4. **Developer (client)** — state machine + useLobby + PlayingScreen integration
5. **QA** — type-check + tests + privacy audit (assignments cleared in broadcast)
6. **PO** — accept against 12 criteria
