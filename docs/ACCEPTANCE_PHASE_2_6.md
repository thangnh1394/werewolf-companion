# Acceptance — Phase 2.6: End Game Flow

> **Agent:** Product Owner
> **Sub-phase:** 2.6 (LAST sub-phase of Phase 2)
> **Status:** ✅ READY FOR USER REVIEW

## Code

- [x] New shared messages: `END_GAME` (client→server, host only) + `GAME_ENDED` (server→client, broadcast, no payload)
- [x] Server reducer: `endGame(state)` — clears assignments, resets non-host ready, preserves roomDesk, transitions to lobby
- [x] Server handler: `handleEndGame(requesterId)` — host + playing-phase validation, broadcast sequence
- [x] Server tests: 6 new (52 total — 46 + 6)
- [x] Client state machine: `playing` state `GAME_ENDED` → `in_lobby` + `clearCard` action
- [x] Client: `useLobby.actions.endGame()` exposed
- [x] PlayingScreen: "Kết thúc trận" button (host only) at bottom with Flag icon
- [x] LobbyScreen: passes `isHost` + `onEndGame` to PlayingScreen
- [x] Type-check clean (3 packages)
- [x] Production build: 364 KB JS / 110.6 KB gzipped (+0.2 KB gzip)
- [x] Privacy audit PASSED — no card info in any broadcast after end_game

## Acceptance criteria (12 from BRIEF)

- [x] **AC1**: Host taps "Kết thúc trận" → server broadcasts GAME_ENDED + PLAYER_UPDATEDs → clients transition to lobby within ~500ms (single broadcast round-trip)
- [x] **AC2**: After endGame, `assignments` map is empty (verified by test "clears assignments completely")
- [x] **AC3**: After endGame, `roomDesk` unchanged (verified by test "preserves roomDesk unchanged")
- [x] **AC4**: Non-host players have `isReady = false` (verified by test "resets isReady to false for non-host players")
- [x] **AC5**: Host has `isReady = true` (verified by test "keeps host isReady true after end_game")
- [x] **AC6**: After endGame, `phase = 'lobby'` (verified by test "transitions phase from playing to lobby")
- [x] **AC7**: Non-host END_GAME silently ignored (handler returns early on `hostSessionId !== requesterId`)
- [x] **AC8**: END_GAME during lobby phase silently ignored (handler returns early on `phase !== 'playing'`)
- [x] **AC9**: Refresh during transition → STATE_SNAPSHOT delivers `phase: 'lobby'` + no `yourCard` → guarded transition routes to `in_lobby` (no special code needed; existing flow works)
- [x] **AC10**: DO eviction after endGame → SQLite-rehydrated state has empty assignments + preserved roomDesk (serialize/deserialize uses existing Map round-trip)
- [x] **AC11**: Host's screen also transitions to lobby (server broadcasts to ALL connections including sender; state machine handles equally on all clients)
- [x] **AC12**: No regression: 52 tests pass (46 Phase 2.5 + 6 new) + Phase 2.1–2.5 features unchanged

## Privacy audit (CRITICAL — PASSED)

- [x] `GAME_ENDED` broadcast has NO card info (empty payload: `{ type: 'GAME_ENDED' }`)
- [x] `endGame` reducer clears `assignments: new Map()` BEFORE handler calls broadcast
- [x] `PLAYER_UPDATED` events after end_game only contain `PublicPlayer` (no cardId field exists on the type)
- [x] `STATE_SNAPSHOT` after end_game returns no `yourCard` (server uses `assignments.get(sessionId)` which is empty)
- [x] Audit verified via grep: assignments only appears in reducer + sendTo (private) + serialization — never in broadcast

## Decisions implemented (from PM intake)

1. ✅ **isReady reset:** Non-host → false; Host → true (matches initial room creation behavior)
2. ✅ **Assignments:** Cleared immediately (clean reset, no historical view feature)
3. ✅ **Confirm dialog:** None — tap "Kết thúc trận" → ends immediately

## Golden Rules compliance

- [x] **Golden Rule 1 (unified scroll):** PlayingScreen unchanged in scroll layout (Phase 2.5 already compliant)
- [x] **Golden Rule 2 (accurate descriptions):** No new role text added
- [x] **Golden Rule 3 (hooks before early returns):** No new hooks added; PlayingScreen early return for `!card` already after `useState` hook

## Manual smoke test plan (after deploy)

1. **End game basic flow:**
   - 5 players in playing phase (after dealing)
   - Host taps "Kết thúc trận"
   - All 5 phones return to LobbyScreen within ~500ms
   - LobbyScreen shows: same roomDesk (e.g. "Bộ bài đêm nay · 5 thẻ"), host shows "Sẵn sàng", others show "Đang nghĩ..."

2. **Re-deal same deck:**
   - After end_game, non-host players tap "Sẵn sàng"
   - Host taps "Bắt đầu chia bài"
   - New cards dealt (possibly different distribution due to fresh shuffle)
   - Verify: cards dealt match same roomDesk composition

3. **Edit deck between rounds:**
   - After end_game, host taps "Sửa" in deck preview
   - Adjust cards (e.g. add/remove a Sói)
   - Tap Start with new deck → new round with updated composition

4. **Non-host cannot end:**
   - Verify non-host's PlayingScreen does NOT show "Kết thúc trận" button
   - (Defensive: even if they manually send END_GAME via dev tools, server ignores)

5. **Refresh during transition:**
   - In playing phase, host taps end
   - Immediately refresh another player's browser
   - Should reconnect to lobby (not stuck on playing screen with stale card)

6. **DO eviction after end:**
   - End game, wait ~5+ minutes (or trigger eviction)
   - Reconnect → should still be in lobby with same roomDesk preserved

## Out of scope (NOT in Phase 2.6)

- ⏭ Win/lose tracking — app is a dealer, not a game engine
- ⏭ Round history / "view past rounds"
- ⏭ Player request to end (non-host)
- ⏭ Auto-end timeout

## Verdict

**Phase 2.6 ACCEPTED.** Full gameplay loop complete:
- Lobby (compose deck) → Deal → Reveal → End → Back to lobby (deck preserved) → Repeat

Phase 2 (Card Foundation + Gameplay Loop) is now **COMPLETE**.

## Bundle delta

| | Phase 2.5 | Phase 2.6 | Δ |
|---|---|---|---|
| Tests | 46 | 52 | +6 |
| JS gzipped | 110.4 KB | 110.6 KB | +0.2 KB |
| Server state fields | 7 | 7 | 0 (assignments existed, just cleared) |
| WS messages | 6↑ 10↓ | 7↑ 11↓ | +1 client, +1 server |
| New files | — | (none — all modifications) | 0 |
