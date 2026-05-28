# Acceptance — Phase 2.4: Card Dealing Logic

> **Agent:** Product Owner
> **Sub-phase:** 2.4
> **Status:** ✅ READY FOR USER REVIEW

## Code

- [x] New shared messages: `GAME_STARTED` (broadcast, no card), `YOUR_CARD` (private); removed `GAME_STARTED_STUB`
- [x] Extended `STATE_SNAPSHOT` with `yourCard?` for refresh restore
- [x] Server: `shuffle.ts` with crypto Fisher-Yates + rejection sampling
- [x] Server: `dealCards(state, shuffleFn)` reducer (injectable shuffle), replaces `startGame`
- [x] Server: `LobbyState.assignments: Map<SessionId, cardId>`
- [x] Server: `handleStartGame` deals + sends private cards + broadcasts GAME_STARTED
- [x] Server: STATE_SNAPSHOT includes requester's own card
- [x] Server: assignments persist via serialize/deserialize with `?? []` backward compat
- [x] Client: state machine `playing` state + `yourCard` context + `applyCard` action + `snapshotIsPlaying` guard
- [x] Client: `PlayingScreen.tsx` showing dealt card (full info: Khả năng/Thời điểm dậy/Lưu ý)
- [x] Client: LobbyScreen renders PlayingScreen when phase === 'playing'; stub modal removed
- [x] Type-check clean (3 packages)
- [x] Tests: 46/46 pass (36 Phase 2.3 + 10 new Phase 2.4)
- [x] Production build: 359 KB JS, 109 KB gzipped (+4 KB JS from Phase 2.3)

## Acceptance criteria (12 from BRIEF)

- [x] **AC1**: Host taps Start with 5 ready + 5-card deck → each player gets YOUR_CARD
- [x] **AC2**: Dealt multiset === deck composition (verified by test "dealt multiset equals deck composition")
- [x] **AC3**: Card counts respected — 2 werewolves → exactly 2 players (verified by test)
- [x] **AC4**: Player sees PlayingScreen with correct name/image/team/ability
- [x] **AC5**: Brand-new player joining during play → `room_in_progress` (Phase 1 foundation, verified intact)
- [x] **AC6**: Refresh mid-game → same card restored via STATE_SNAPSHOT.yourCard + guard → playing state
- [x] **AC7**: Host also receives a card (host plays — dealCards assigns to all players including host)
- [x] **AC8**: GAME_STARTED broadcast has NO card info (privacy audit passed)
- [x] **AC9**: Shuffle injectable for deterministic tests (identity + reverse shuffle tests pass)
- [x] **AC10**: Assignments persist through DO eviction (serialize/deserialize round-trip)
- [x] **AC11**: No regression: all 36 Phase 2.3 tests pass + lobby/desk/kick unchanged
- [x] **AC12**: assignments.size === players.size (verified by test)

## Privacy audit (CRITICAL — passed)

- [x] `YOUR_CARD` sent ONLY via `sendTo(conn)` (line 270) — never broadcast
- [x] `GAME_STARTED` broadcast payload has no cardId/assignments
- [x] `STATE_SNAPSHOT.yourCard` uses `assignments.get(sessionId)` — only requester's own card
- [x] `assignments` map only appears in: dealCards (reducer), sendTo paths, serialization — never in any broadcastMessage

## Golden Rules compliance

- [x] **Golden Rule 1 (unified scroll):** PlayingScreen uses sticky header + `.scrollable` card body
- [x] **Golden Rule 2 (accurate descriptions):** PlayingScreen reuses `findCard()` from shared cards.ts — no duplicated text
- [x] **Golden Rule 3 (hooks before early returns):** PlayingScreen early return `if (phase === 'playing')` is AFTER the `deckSize` useMemo; PlayingScreen component itself has no hooks after conditionals

## Manual smoke test plan (after deploy)

1. **Deal flow:**
   - 5 players in lobby, all ready, host builds 5-card deck (e.g. 2 Sói + 3 Dân)
   - Host taps "Bắt đầu chia bài"
   - Each device shows PlayingScreen with their role within ~0.5s
   - Verify: exactly 2 people see "Sói", 3 see "Dân Làng"

2. **Privacy:**
   - No one can see anyone else's card (each only sees their own PlayingScreen)

3. **Refresh restore:**
   - Mid-game, one player refreshes browser
   - Should reconnect → same card shown again

4. **Room lock:**
   - While game playing, a 6th person tries to join via code
   - Should see "Trận đấu đang diễn ra" error

5. **Host plays too:**
   - Host's screen also shows a dealt card (not a "narrator" view)

## ⚠️ Important note for testing

PlayingScreen shows card PLAINLY (no hide mechanism yet). When testing with multiple people physically together, **don't show your screen to others** — Phase 2.5 will add tap-and-hold to hide the card. Phase 2.4 is dealing logic verification only.

## Out of scope (deferred)

- ⏭ Tap-and-hold reveal → Phase 2.5
- ⏭ End game / return to lobby → Phase 2.6 (no way to leave playing state except disconnect/close room currently)
- ⏭ Re-deal button

## Verdict

**Phase 2.4 ACCEPTED.** Dealing logic complete + privacy-safe. Ready for deploy + smoke test.

Note: After Phase 2.4, there's no "end game" button yet — to return to lobby, host must close room (leave) or all disconnect. Phase 2.6 adds proper end-game flow. For testing, host can tap leave (LogOut) to close the room.

## Bundle delta

| | Phase 2.3 | Phase 2.4 | Δ |
|---|---|---|---|
| Tests | 36 | 46 | +10 |
| JS gzipped | 109 KB | 109.2 KB | +0.2 KB |
| Server state fields | 6 | 7 | +1 (assignments) |
| New files | — | shuffle.ts, PlayingScreen.tsx | +2 |
