# Handover — Werewolf Companion Phase 2.4

> Phase 2.4 (Card Dealing Logic) đã build xong. Doc này tổng hợp + hướng dẫn deploy.

## Trạng thái sau Phase 2.4

| Item | Status |
|---|---|
| Code | ✅ Type-check clean, 46/46 tests pass, build OK |
| Bundle | 359 KB JS (109 KB gzipped) — +4 KB JS so với Phase 2.3 |
| Privacy audit | ✅ PASSED — card không leak qua broadcast |
| Deploy | GitHub Actions auto-deploy on push to main |

## Những thay đổi so với baseline Phase 2.3

### New files (4)

```
docs/
├── BRIEF_PHASE_2_4.md
├── PLAN_PHASE_2_4.md
└── ACCEPTANCE_PHASE_2_4.md

packages/server/src/lobby/
└── shuffle.ts                    Fisher-Yates crypto shuffle + ShuffleFn type

packages/client/src/components/game/
└── PlayingScreen.tsx             Dealt-card display (full info)
```

### Modified files (6)

```
packages/shared/src/messages.ts
  - GAME_STARTED_STUB → GAME_STARTED (broadcast, no card)
  + YOUR_CARD (private, cardId)
  + yourCard? in STATE_SNAPSHOT

packages/server/src/lobby/lobbyState.ts
  + assignments: Map<SessionId, cardId> in LobbyState
  + createEmptyLobby inits assignments
  - startGame stub → dealCards(state, shuffleFn) reducer

packages/server/src/lobby/lobbyState.test.ts
  + 10 new tests (cryptoShuffle ×3, dealCards ×7)
  + Total: 46 tests

packages/server/src/server.ts
  + dealCards import (replaces startGame)
  + handleStartGame: deal + private YOUR_CARD per conn + broadcast GAME_STARTED
  + STATE_SNAPSHOT includes yourCard for requester
  + assignments in serialize/deserialize (?? [] backward compat)

packages/client/src/machines/lobbyMachine.ts
  + yourCard in context
  + applyCard action
  + snapshotIsPlaying guard
  + playing state (replaces game_starting final state)
  + YOUR_CARD + GAME_STARTED events
  + guarded STATE_SNAPSHOT (→ playing if phase playing, for refresh restore)

packages/client/src/hooks/useLobby.ts
  + phase type 'playing' (was 'game_starting')

packages/client/src/components/lobby/LobbyScreen.tsx
  + render PlayingScreen when phase === 'playing'
  - removed GAME_STARTED_STUB stub Dialog + showStartStub state + useEffect
```

## Cách hoạt động

### Dealing flow

1. Host tap "Bắt đầu chia bài"
2. Client validate deck === player count (Phase 2.3) → gửi START_GAME
3. Server `handleStartGame`:
   - `canStartGame` check (host, ready, deck match)
   - `dealCards(lobby)` — expand deck → crypto shuffle → assign per player → phase: playing
   - Loop connections: gửi PRIVATE `YOUR_CARD { cardId }` cho từng người
   - Broadcast `GAME_STARTED` (KHÔNG có card info)
4. Client nhận YOUR_CARD → `applyCard` → state vào `playing` → render PlayingScreen

### Refresh restore

1. Player refresh → reconnect cùng sessionId
2. Server `handleJoin` → rejoin (đã có trong players) → STATE_SNAPSHOT có `yourCard`
3. Client guard `snapshotIsPlaying` → vào thẳng `playing` state với card cũ

### Privacy (CRITICAL)

- `YOUR_CARD` CHỈ qua `sendTo(conn)` — không bao giờ broadcast
- `GAME_STARTED` broadcast KHÔNG chứa card
- Mỗi người chỉ thấy card của chính mình

## 📝 Deploy

```bash
cd ~/projects/werewolf-companion
# Merge code Phase 2.4 từ zip
npm install
npm run type-check        # clean
npm test                  # 46/46
npm run build --workspace=@werewolf/client   # OK

git add .
git commit -m "Phase 2.4 — Card Dealing Logic"
git push origin main      # GitHub Actions auto-deploys
```

## Smoke test priorities

1. **Deal:** 5 players ready + 5-card deck → tap Start → mỗi người thấy role riêng <0.5s
2. **Privacy:** không ai thấy card người khác
3. **Counts:** 2 Sói + 3 Dân → đúng 2 người Sói, 3 người Dân
4. **Refresh:** refresh giữa ván → card cũ trở lại
5. **Lock:** người mới join giữa ván → "Trận đấu đang diễn ra"
6. **Host plays:** host cũng có card

## ⚠️ Lưu ý quan trọng

- **PlayingScreen hiện card PLAIN (chưa giấu)** — Phase 2.5 mới thêm tap-and-hold. Khi test nhiều người, đừng để lộ màn hình.
- **Chưa có nút End Game** — sau khi vào playing, để về lobby phải: host tap LogOut (đóng phòng) hoặc tất cả disconnect. Phase 2.6 thêm end-game flow đúng cách.

## 🎯 Phase tiếp theo

### Phase 2.5 — "Bài của tôi" Screen (tap-and-hold reveal)
- Replace PlayingScreen plain display với tap-and-hold mechanism
- Card úp mặc định, giữ để xem, thả để úp lại
- Animation flip (CSS transform)
- Chống nhìn trộm qua vai

### Phase 2.6 — End Game Flow
- Host "Kết thúc trận" button
- Transition playing → lobby
- Clear assignments
- Giữ room desk cho ván sau
- Reset ready states

## Prompt cho session mới (Phase 2.5)

```
Tiếp tục werewolf-companion sau Phase 2.4.
Sync github: https://github.com/thangnh1394/werewolf-companion
Đọc: HANDOVER_PHASE_2_4.md, docs/ACCEPTANCE_PHASE_2_4.md, docs/PHASE_2_DECISIONS.md

Foundation:
- Server deals cards (dealCards + assignments + private YOUR_CARD)
- Client có PlayingScreen (plain card display) + playing state
- 46 tests pass

Bắt đầu Phase 2.5: "Bài của tôi" tap-and-hold reveal.
```
