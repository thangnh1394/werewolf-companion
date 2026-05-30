# Handover — Werewolf Companion Phase 2.6 (Phase 2 COMPLETE)

> Phase 2.6 (End Game Flow) đã build xong. Đây là **sub-phase CUỐI** của Phase 2.
> Sau khi deploy + verify, **Phase 2 hoàn tất** — app có full gameplay loop.

## Trạng thái sau Phase 2.6

| Item | Status |
|---|---|
| Code | ✅ Type-check clean, 52/52 tests pass, build OK |
| Bundle | 364 KB JS (110.6 KB gzipped) — +0.2 KB so với Phase 2.5 |
| Privacy audit | ✅ PASSED — no card info in any broadcast after end |
| Deploy | GitHub Actions auto-deploy on push to main |
| Phase 2 status | ✅ COMPLETE (after deploy + verify) |

## Decisions locked (từ PM intake)

1. ✅ **isReady reset:** Non-host → false; Host → true (match initial behavior)
2. ✅ **Assignments:** Clear ngay (clean reset)
3. ✅ **KHÔNG confirm dialog** (tap là end)

## Những thay đổi so với baseline Phase 2.5

### New files (3 docs only)

```
docs/
├── BRIEF_PHASE_2_6.md
├── PLAN_PHASE_2_6.md
└── ACCEPTANCE_PHASE_2_6.md
```

### Modified files (6)

```
packages/shared/src/messages.ts
  + EndGameMessage (client→server)
  + GameEndedMessage (server→client, no payload)
  + Both registered in discriminated unions

packages/server/src/lobby/lobbyState.ts
  + endGame(state) reducer
    - phase: playing → lobby
    - assignments: cleared
    - isReady: non-host=false, host=true
    - roomDesk: PRESERVED

packages/server/src/lobby/lobbyState.test.ts
  + 6 new tests for endGame
  + Total: 52 tests (was 46)

packages/server/src/server.ts
  + END_GAME case in onMessage dispatch
  + handleEndGame: validates host + phase, applies reducer,
    broadcasts GAME_ENDED + PLAYER_UPDATEDs for each player whose isReady changed

packages/client/src/machines/lobbyMachine.ts
  + GAME_ENDED event in LobbyEvent type
  + clearCard action (sets yourCard = null)
  + playing.on.GAME_ENDED → in_lobby + clearCard

packages/client/src/hooks/useLobby.ts
  + endGame() action exposed

packages/client/src/components/game/PlayingScreen.tsx
  + isHost + onEndGame props
  + "Kết thúc trận" button (host only) at bottom

packages/client/src/components/lobby/LobbyScreen.tsx
  + Pass viewerIsHost + actions.endGame to PlayingScreen
```

## Cách hoạt động (End Game flow)

1. Host trên PlayingScreen → tap "Kết thúc trận" button
2. Client gửi `END_GAME` message
3. Server `handleEndGame`:
   - Validate: chỉ host được end + chỉ trong playing phase
   - Apply `endGame(state)`: clear assignments, reset isReady non-host, KEEP roomDesk
   - Persist to SQLite
   - Broadcast `GAME_ENDED` (no payload)
   - Broadcast `PLAYER_UPDATED` cho mỗi player có isReady đổi
4. Client nhận `GAME_ENDED` → state machine `playing → in_lobby` + `clearCard` action (yourCard = null)
5. Client nhận `PLAYER_UPDATED` events → cập nhật player list (ready states reset)
6. LobbyScreen re-render: roomDesk preview vẫn show same deck, host vẫn ready, non-host chưa ready

### Privacy

- `GAME_ENDED` broadcast KHÔNG có cardId / assignments — chỉ phase change signal
- Reducer clear assignments TRƯỚC khi handler broadcast → guarantee không leak
- `PLAYER_UPDATED` chỉ chứa `PublicPlayer` (no cardId field)

### Refresh during transition

Không cần special handling:
- Server đã chuyển sang `phase: 'lobby'` + empty assignments
- Client refresh → STATE_SNAPSHOT trả `phase: 'lobby'` + no yourCard
- State machine guard `snapshotIsPlaying = false` → routes to `in_lobby`
- Player thấy lobby bình thường

## 📝 Việc user cần làm

### Deploy

```bash
cd ~/projects/werewolf-companion
# Merge code Phase 2.6 từ zip
npm install
npm run type-check     # clean
npm test               # 52/52

git add .
git commit -m "Phase 2.6 — End Game Flow (Phase 2 COMPLETE)"
git push origin main   # GitHub Actions auto-deploys
```

## Smoke test priorities

1. **End game basic:** Host tap "Kết thúc trận" → tất cả về lobby <500ms
2. **Deck preserved:** Lobby sau end vẫn show same deck composition
3. **Ready states:** Host ready=true (sẵn sàng), non-host ready=false (Đang nghĩ...)
4. **Re-deal:** Players ready lại → host Start → cards dealt mới (cùng deck, shuffle khác)
5. **Edit deck between rounds:** Host có thể sửa deck giữa các ván
6. **Non-host không thấy nút End**
7. **Refresh during transition:** Reconnect về lobby OK

## 🎉 Phase 2 — COMPLETE

Sau Phase 2.6, app có full gameplay loop:

```
Lobby (compose deck)
  ↓ host start
Deal cards
  ↓ players reveal
Playing (tap-and-hold reveal)
  ↓ host end
Lobby (deck preserved, isReady reset)
  ↓ loop ← back to start
```

### Phase 2 sub-phases summary

| Sub-phase | Feature | Status |
|---|---|---|
| 2.1 | Card Foundation (15 roles + Main Desk + Card Detail Dialog) | ✅ Deployed |
| 2.3 | Room Desk Editor (host compose deck + player preview) | ✅ Deployed (Phase 2.2 merged into 2.3) |
| 2.4 | Card Dealing Logic (crypto shuffle + private YOUR_CARD) | ✅ Deployed |
| 2.5 | Tap-and-hold Reveal (RevealCard + AI card back) | ✅ Deployed |
| 2.6 | End Game Flow | 🟡 Ready for deploy |

### Final stats sau Phase 2

- **Tests:** 52/52 pass
- **JS Bundle:** 110.6 KB gzipped
- **15 role cards + 1 card back** (all AI-generated)
- **WebSocket messages:** 7 client→server + 11 server→client (private + broadcast separation maintained)
- **State machine:** 7 states (connecting / in_lobby / playing / disconnected / kicked / room_closed / joining_error)
- **Server reducers:** 10+ pure functions
- **Persistence:** Full state round-trip via SQLite DO storage

## 🎯 Beyond Phase 2 — Future ideas (NOT planned)

Nếu sau này muốn extend app:

### Phase 3 ideas (rough)
- **Quick presets** for common deck setups (5/8/10 players)
- **Card back theme variants** (multiple card backs to choose from)
- **Round history** (view past N rounds + roles)
- **Player ready timeout** (auto-ready after N seconds)
- **Spectator mode** for late joiners

### Phase 4+ (game logic, not just dealing)
- Tracking night/day phases
- Vote tally feature
- Eliminated player view
- Win condition tracking

Nhưng đây là expansion scope — current Phase 2 đã đủ cho production use as digital card dealer.

## Prompt cho session sau (optional improvements)

```
Werewolf companion app đã hoàn thành Phase 2 (full gameplay loop).
Sync: https://github.com/thangnh1394/werewolf-companion
Đọc: HANDOVER_PHASE_2_6.md, docs/PHASE_2_DECISIONS.md

App có 52 tests pass, 110.6 KB bundle, full lobby → deal → reveal → end loop.

Tôi muốn [add specific feature / fix specific issue / start Phase 3 with X].
```
