# Handover — Werewolf Companion Phase 2.3

> Phase 2.3 (Room Desk Editor) đã build xong. Doc này tổng hợp những gì đã làm + hướng dẫn deploy.

---

## Trạng thái sau Phase 2.3

| Item | Status |
|---|---|
| Code | ✅ Type-check clean, 36/36 tests pass, production build OK |
| Bundle size | 355 KB JS (109 KB gzipped) — +3 KB so với Phase 2.1 |
| Deploy method | GitHub Actions auto-deploy on push to main |
| Auto-deploy workflow | ✅ Đã setup ở commit `ef87e75` |

## Những thay đổi so với baseline Phase 2.1

### New files (8 files)

```
docs/
├── BRIEF_PHASE_2_3.md         Scope + 12 acceptance criteria
├── PLAN_PHASE_2_3.md          Architect plan
└── ACCEPTANCE_PHASE_2_3.md    PO checklist

packages/client/src/lib/
└── cards.ts                   isValidCardId helper

packages/client/src/components/
├── cards/
│   ├── CardCellWithCounter.tsx   Card với counter chip + tap/long-press
│   └── RoomDeskEditor.tsx        Full-screen host editor
├── lobby/
│   └── RoomDeskPreview.tsx       Collapsible chips (visible to all)
└── ui/
    └── Toast.tsx                 Coral red toast cho deck-mismatch
```

### Modified files (6 files)

```
packages/shared/src/messages.ts
  + RoomDeskSchema (record cardId → count 1..MAX_PLAYERS)
  + SetCardCountMessage (client→server)
  + RoomDeskUpdatedMessage (server→client)
  + roomDesk field in STATE_SNAPSHOT
  + RoomDeskUpdatedMessageSchema in ServerMessage union

packages/server/src/lobby/lobbyState.ts
  + roomDesk: Map<string, number> in LobbyState
  + createEmptyLobby returns roomDesk: new Map()
  + setCardCount, getDeckSize, deckAsRecord reducers
  + canStartGame extended với deck_mismatch reason (expected/actual)

packages/server/src/lobby/lobbyState.test.ts
  + 11 new tests (setCardCount, getDeckSize, deckAsRecord, deck validation)
  + Total: 36 tests (was 25)

packages/server/src/server.ts
  + SET_CARD_COUNT case in onMessage
  + handleSetCardCount handler (host-only, lobby-phase-only, card-validation)
  + deckAsRecord in STATE_SNAPSHOT broadcast
  + roomDesk in SerializedState với ?? [] backward compat

packages/client/src/machines/lobbyMachine.ts
  + roomDesk: Record<string, number> in LobbyContext
  + applyRoomDesk action
  + ROOM_DESK_UPDATED event in in_lobby + disconnected states
  + roomDesk in STATE_SNAPSHOT event payload

packages/client/src/hooks/useLobby.ts
  + setCardCount(cardId, count) action

packages/client/src/components/lobby/LobbyScreen.tsx
  + Render RoomDeskPreview after ShareRoom
  + handleIncrement / handleDecrement handlers
  + Render RoomDeskEditor modal when showRoomDeskEditor && viewerIsHost
  + Render Toast for deck-mismatch error
  + Updated Start button to use handleStartGame (validates deck before sending)
```

## Tính năng đã build

### 1. Room Desk Editor (host-only)
- Truy cập: Lobby → tap "Sửa" trong "Bộ bài đêm nay" card
- 15 cards grouped by team (Sói / Dân / Trung Lập) — reuse pattern Phase 2.1
- **Tap card cell:** count + 1 (cycle 0 → 1 → 2 → ... → MAX_PLAYERS)
- **Long-press 500ms:** count - 1 (haptic vibration if supported)
- Sticky deck counter: amber (mismatch) / green (match)
- Mismatch badge: "Thiếu N thẻ" / "Thừa N thẻ" / "Đủ thẻ"
- Per-team subtotal in section headers

### 2. Room Desk Preview (visible to all)
- Vị trí: Lobby, ngay sau ShareRoom card, trước player list
- Collapsible — default expanded khi có cards, collapsed khi empty
- Chips compact: thumbnail ô vuông màu team + ×N + tên card
- Tap chip → CardDetailDialog (reuse Phase 2.1)
- Host thấy nút "Sửa" — player không
- Empty state có hint khác cho host vs player

### 3. Start game validation
- Click "Bắt đầu chia bài":
  - Nếu `deckSize !== playerCount` → coral red Toast slide-in top
  - Message: "Cần đúng N thẻ trong bộ bài. Hiện tại có M."
  - Toast auto-dismiss 4s + có nút X close manual
- Helper text dưới button cũng update khi deck mismatch

### 4. Server persistence
- `roomDesk` round-trip qua SQLite DO storage
- Sống qua: player join/leave, host disconnect+reconnect, DO eviction
- Backward compat: rooms tạo trước Phase 2.3 → `?? []` fallback → empty deck OK

## Server protocol changes

### Client → Server (new)

```ts
{ type: 'SET_CARD_COUNT', cardId: string, count: 0..20 }
```

Validation server-side:
- Only `hostSessionId === requesterId` may emit (silently ignored otherwise)
- Phase must be `'lobby'`
- `cardId` must be in CARDS list (defense in depth)
- Count auto-capped at MAX_PLAYERS
- Count === 0 removes card from desk entirely

### Server → Client (new)

```ts
{ type: 'ROOM_DESK_UPDATED', deck: Record<cardId, count> }
```

Broadcast to ALL connections (including the sender). No event-sourcing — full deck state every time.

### Extended

```ts
STATE_SNAPSHOT now includes: roomDesk: Record<cardId, count>
```

## 📝 Việc user cần làm để deploy

### Bước 1: Pull code session này

Nếu bạn dùng GitHub workflow (recommended):

```bash
cd ~/projects/werewolf-companion
git pull origin main      # nếu Phase 2.1 đã push
# Merge code Phase 2.3 từ zip handover này
```

### Bước 2: Verify local

```bash
npm install                         # nếu deps đổi (Phase 2.3 không thêm dep mới)
npm run type-check                  # phải clean
npm test                            # phải 36/36 pass
npm run build --workspace=@werewolf/client   # phải build OK
```

### Bước 3: Deploy

GitHub Actions auto-deploy (đã setup ở commit `ef87e75`):

```bash
git add .
git commit -m "Phase 2.3 — Room Desk Editor"
git push origin main
```

→ GitHub Actions chạy 2 jobs:
- `deploy-server` → PartyKit deploy
- `deploy-client` → Cloudflare Pages

Check workflow run: https://github.com/thangnh1394/werewolf-companion/actions

### Bước 4: Test trên điện thoại

5 manual smoke tests trong `docs/ACCEPTANCE_PHASE_2_3.md` section "Manual smoke test plan".

Quick checklist:
1. ✅ Host edit flow: tap → +1, long-press → -1, counter green/amber
2. ✅ Realtime sync: player thấy chips update <200ms
3. ✅ Deck validation: tap Start với deck mismatch → coral red toast
4. ✅ Persistence: refresh → deck restored
5. ✅ Non-host: thấy preview nhưng KHÔNG có nút "Sửa"

## ⚠️ Risk + edge cases noted

1. **iOS Safari 3D-Touch** — Đã prevent `contextmenu` + dùng `pointerdown`/`pointerup` thay vì `click`. Cần test trên iPhone thật.

2. **Tap spam** — Server DO single-threaded, broadcasts cheap. Không debounce client side.

3. **Race: host transfer mid-edit** — Phase 0 đã reject host transfer feature. Edit khi host disconnect → server silently ignores (vì hostSessionId vẫn là disconnected host). Không phải issue.

4. **Pre-2.3 saved DO state** — `?? []` fallback đảm bảo rooms cũ vẫn rehydrate được với empty deck. Không cần migration.

5. **Backward compat client side** — Old clients (Phase 2.1) connecting to new server: server vẫn gửi `roomDesk` trong STATE_SNAPSHOT, old client Zod parser sẽ reject (vì roomDesk required ở schema mới). → Old clients cần update để xài server mới. (Acceptable vì user controls cả 2 sides via deploy.)

## 🎯 Phase tiếp theo

### Phase 2.4 — Card Dealing Logic

**Scope:**
- Server-side Fisher-Yates shuffle khi host tap Start
- Send private `YOUR_CARD` message to each connection (NOT broadcast)
- Transition `phase: 'lobby'` → `'playing'`
- Lock room: new joiners receive `JOIN_ERROR` with `reason: 'room_in_progress'`
- Refresh restore: player refreshes mid-game → receives same card again
- Existing `roomDesk` state used as source for dealing

**Key technical decisions:**
- Card assignments stored server-side per session: `Map<SessionId, cardId>`
- Persistence: same SQLite pattern
- Each connection's `YOUR_CARD` sent ONLY to that connection (use `sendTo` not `broadcast`)
- New WS message: `YOUR_CARD { cardId }` (server→client, private)
- Possibly: `GAME_STARTED` replaces `GAME_STARTED_STUB`

## Prompt gợi ý cho session mới (Phase 2.4)

```
Tôi đang tiếp tục project werewolf-companion sau Phase 2.3.

Đọc các file sau để nắm context:
- docs/PHASE_2_DECISIONS.md — toàn bộ quyết định Phase 2
- docs/ACCEPTANCE_PHASE_2_3.md — những gì Phase 2.3 đã ship
- HANDOVER_PHASE_2_3.md — chi tiết deploy + sub-phase tiếp theo

Foundation hiện tại:
- packages/server có roomDesk + setCardCount/canStartGame extended
- packages/client có RoomDeskEditor + RoomDeskPreview + Toast
- 36 unit tests pass

Bắt đầu Phase 2.4: Card Dealing Logic.
Trước khi bắt đầu, sync với github repo của tôi: https://github.com/thangnh1394/werewolf-companion
```
