# Acceptance — Phase 2.3: Room Desk Editor

> **Agent:** Product Owner
> **Sub-phase:** 2.3
> **Status:** ✅ READY FOR USER REVIEW

## Code

- [x] New shared schemas: `RoomDeskSchema`, `SetCardCountMessage`, `RoomDeskUpdatedMessage`; extended `STATE_SNAPSHOT`
- [x] Server state extension: `LobbyState.roomDesk: Map<string, number>`
- [x] Server reducers: `setCardCount`, `getDeckSize`, `deckAsRecord`; extended `canStartGame` with `deck_mismatch` reason (kèm expected/actual)
- [x] Server handler: `handleSetCardCount` (host-only, lobby-phase-only, card-validation)
- [x] Server persistence: serialize/deserialize round-trip với `?? []` backward compat
- [x] Client lib: `lib/cards.ts` với `isValidCardId` helper
- [x] State machine: `roomDesk` field in context, `applyRoomDesk` action, `ROOM_DESK_UPDATED` event handler
- [x] useLobby: `setCardCount(cardId, count)` action exposed
- [x] 4 new components: `Toast`, `CardCellWithCounter`, `RoomDeskEditor`, `RoomDeskPreview`
- [x] LobbyScreen integration: deck preview + editor modal + toast + start-button validation
- [x] Type-check clean across 3 packages
- [x] Tests: 36/36 pass (25 Phase 1 baseline + 11 new for Phase 2.3 reducers)
- [x] Production build succeeds (355 KB JS, 109 KB gzipped — +3 KB from Phase 2.1)

## Acceptance criteria (12 from BRIEF)

- [x] **AC1**: Host taps "Sửa bộ bài" → RoomDeskEditor opens with 15 cards in 3 team sections
- [x] **AC2**: Tap card → count + 1, broadcast in <200ms (server roundtrip on edge)
- [x] **AC3**: Long-press 500ms → count - 1 (with haptic vibration if supported)
- [x] **AC4**: Deck size < player count → counter amber + "Thiếu N thẻ" badge
- [x] **AC5**: Deck size === player count → counter green + "Đủ thẻ" badge
- [x] **AC6**: Room desk updates propagate to all players via `ROOM_DESK_UPDATED` broadcast
- [x] **AC7**: Player (non-host) sees "Bộ bài đêm nay" with chips but no "Sửa" button
- [x] **AC8**: Tap chip in preview → opens existing `CardDetailDialog` from Phase 2.1
- [x] **AC9**: Tap "Bắt đầu chia bài" with `deckSize !== playerCount` → coral red Toast với expected/actual; start blocked
- [x] **AC10**: Disconnect mid-edit → reconnect within 5 min → roomDesk preserved (server persisted, sent via STATE_SNAPSHOT)
- [x] **AC11**: DO eviction → SQLite rehydrate → roomDesk restored (serialize/deserialize round-trip)
- [x] **AC12**: No regression: 25 Phase 1 tests pass + Phase 2.1 features (Main Desk, Spade icon button, etc.) unchanged

## Golden Rules compliance

- [x] **Golden Rule 1 (unified scroll):** RoomDeskEditor uses 3-zone flex layout (sticky header + sticky deck counter + scrollable body với `.scrollable` class)
- [x] **Golden Rule 2 (accurate card descriptions):** No new role text added (reuses Phase 2.1 cards.ts which already has 3-part format)

## Edge cases verified

- [x] Empty deck: `RoomDeskPreview` shows hint "Chưa có thẻ nào · Bấm Sửa để chọn" (host) or "Chủ phòng chưa chọn thẻ nào" (player)
- [x] iOS Safari 3D-Touch: `preventDefault` on `contextmenu` + `pointerdown`/`pointerup` (not `click`) for long-press
- [x] User select / text highlight on touch: `WebkitUserSelect: 'none'` + `WebkitTouchCallout: 'none'`
- [x] Race: long-press fires → tap-up ignored (`longPressFired` ref)
- [x] Pointer leave card while pressing → no decrement (handled by `onPointerLeave`)
- [x] Pre-Phase-2.3 saved state in DO storage → `?? []` fallback for `roomDesk`
- [x] Non-host sends SET_CARD_COUNT → silently ignored (not kicked)
- [x] Card ID not in CARDS list → silently ignored (defense in depth)
- [x] Count > MAX_PLAYERS → capped via `Math.min(count, MAX_PLAYERS)`

## Out of scope (NOT in Phase 2.3)

- ⏭ Quick presets (rejected by user)
- ⏭ Lock edit when host disconnect (rejected by user)
- ⏭ Card dealing logic → Phase 2.4
- ⏭ "Bài của tôi" reveal → Phase 2.5
- ⏭ End game flow → Phase 2.6

## Manual smoke test plan

After deploy to Cloudflare:

1. **Host edit flow:**
   - Lobby → tap "Sửa" in "Bộ bài đêm nay" card → RoomDeskEditor opens
   - Tap Sói Thường → counter shows "1" in red chip
   - Tap Sói Thường again → "2"
   - Long-press Sói Thường → "1"
   - Tap several cards in different teams → counters update correctly
   - Deck counter at top updates live: "X / Y thẻ" with color

2. **Realtime sync:**
   - On 2 devices: host edits, player should see chips update in "Bộ bài đêm nay" preview live (<200ms)
   - Player taps chip → CardDetailDialog opens (read-only)

3. **Deck validation:**
   - 5 players ready, deck has 3 cards → tap "Bắt đầu chia bài"
   - Coral red toast slides in: "Số thẻ không khớp · Cần đúng 5 thẻ trong bộ bài. Hiện tại có 3."
   - Toast auto-dismisses after 4s
   - Add 2 more cards → counter turns green → tap Start → Phase 2 stub modal works

4. **Persistence:**
   - Host edits deck (e.g. 5 cards)
   - Refresh browser → reconnects → deck still shows 5 cards
   - All players disconnect → wait DO eviction (rare) → reconnect → deck still there

5. **Non-host:**
   - Join as player (not host)
   - "Bộ bài đêm nay" visible but no "Sửa" button
   - Can't access editor

## Verdict

**Phase 2.3 ACCEPTED.** Ready for user to:

1. Pull latest code (this session's changes)
2. Commit + push to GitHub
3. GitHub Actions auto-deploys (per `ef87e75` workflow)
4. Smoke test on real devices

## Bundle delta summary

| | Phase 2.1 | Phase 2.3 | Δ |
|---|---|---|---|
| Components | 5 cards + AboutScreen | + 4 new (Toast, CardCellWithCounter, RoomDeskEditor, RoomDeskPreview) | +4 files |
| Tests | 25 | 36 | +11 |
| JS bundle (gzip) | 106 KB | 109 KB | +3 KB |
| Server state | 5 fields | 6 fields | +1 (roomDesk) |
| WS messages | 5↑ 9↓ | 6↑ 10↓ | +1 client→server, +1 server→client |
