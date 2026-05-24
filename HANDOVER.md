# Handover — Werewolf Companion Session 1

> Tài liệu này tóm tắt toàn bộ những gì đã thực hiện trong session deploy Phase 1.
> Dùng để bàn giao cho Claude trong session mới khi bắt đầu Phase 2.

---

## Trạng thái hiện tại

Phase 1 đã **deploy thành công** và test thủ công pass hầu hết acceptance criteria.

| Service | URL |
|---|---|
| PartyKit server (backend) | `https://werewolf-companion.thangnh1394.partykit.dev` |
| Cloudflare Pages (frontend) | `https://fa4bcf9b.werewolf-client.pages.dev` |
| GitHub repo | `https://github.com/thangnh1394/werewolf-companion` |

---

## Những thay đổi so với Phase 1 gốc

### 1. Migrate `packages/server/src/server.ts` — partyserver → partykit/server

**Vấn đề:** `partyserver@0.0.66` inject một virtual module `partykit-exposed-cloudflare-workers` mà partykit bundler không resolve được, gây lỗi cả khi dev local lẫn khi deploy:
```
Error: No such module "upload/partykit-exposed-cloudflare-workers"
```

**Fix:** Migrate toàn bộ `LobbyServer` từ `extends Server` (partyserver) sang `implements Party.Server` (partykit/server — API gốc của partykit, luôn hoạt động).

Những thay đổi API chính:
- `import { Server } from 'partyserver'` → `import type * as Party from 'partykit/server'`
- `extends Server` → `implements Party.Server` + thêm `constructor(readonly room: Party.Room)`
- `onMessage(conn, message)` → `onMessage(message, sender)` *(thứ tự tham số đảo ngược)*
- `this.ctx.storage` → `this.room.storage`
- `this.name` → `this.room.id`
- `this.getConnections()` → `this.room.getConnections()`
- Bỏ tất cả `override` keyword, bỏ `static override options`

### 2. Fix Bug — Host phải luôn sẵn sàng (`packages/server/src/lobby/lobbyState.ts`)

**Vấn đề:** Chủ phòng phải bấm "Sẵn sàng" mới bắt đầu được game.

**Fix 1 — Host auto-ready khi join:**
```typescript
// addPlayer(): isReady: false → isReady: claimsHost
const player: PublicPlayer = {
  ...
  isReady: claimsHost,  // host starts ready
  ...
};
```

**Fix 2 — canStartGame() bỏ host khỏi điều kiện ready:**
```typescript
const nonHostPlayers = players.filter((p) => p.sessionId !== state.hostSessionId);
if (!nonHostPlayers.every((p) => p.isReady)) return { ok: false, reason: 'not_all_ready' };
```

### 3. Fix Bug — Kicked player tự reconnect (`packages/client/src/hooks/useLobby.ts`)

**Vấn đề:** Khi host kick player, `PartySocket` tự reconnect sau 2-3 giây và gửi `JOIN` lại → player bị kick nhưng tự vào phòng lại mà không cần thao tác gì.

**Fix:** Thêm `isTerminatedRef` để ngăn gửi `JOIN` sau khi nhận `KICKED` hoặc `ROOM_CLOSED`:
```typescript
const isTerminatedRef = useRef(false);

// handleMessage: set flag khi nhận terminal message
if (msg.type === 'KICKED' || msg.type === 'ROOM_CLOSED') {
  isTerminatedRef.current = true;
}

// handleOpen: không gửi JOIN nếu đã bị terminate
if (isTerminatedRef.current) {
  socket.close();
  return;
}
```

---

## Deploy setup

### PartyKit server
```bash
cd packages/server
npx partykit login   # một lần duy nhất
npx partykit deploy
```
Config: `packages/server/partykit.json`

### Cloudflare Pages (client)
Deploy qua **Wrangler CLI** (không dùng GitHub auto-deploy vì Cloudflare Pages UI mới gây conflict với Workers):
```bash
cd packages/client
$env:VITE_PARTYKIT_HOST = "werewolf-companion.thangnh1394.partykit.dev"
npm run build
npx wrangler pages deploy dist --project-name=werewolf-client
```

> **Lưu ý:** `VITE_PARTYKIT_HOST` không có `https://` prefix.

Có một Worker riêng tên `werewolf-companion` trên Cloudflare (tạo nhầm lúc setup) — không cần quan tâm, không ảnh hưởng gì.

---

## Môi trường

- Node.js: v22.17.1
- npm: 10.9.2
- OS: Windows 11
- PartyKit local dev: **không hoạt động** (Miniflare incompatibility trên Windows + Node 22) — test trực tiếp trên cloud

---

## Test kết quả

| Test | Kết quả |
|---|---|
| Tạo phòng + join realtime | ✅ Pass |
| Ready toggle realtime | ✅ Pass |
| Host auto-ready | ✅ Pass (sau fix) |
| Start game với 5 người ready | ✅ Pass |
| Kick player | ✅ Pass (sau fix — không auto-reconnect) |
| Refresh restore session | ✅ Pass |

---

## Để bắt đầu Phase 2

Phase 2 scope ở `ROADMAP.md`. Các quyết định đã lock từ Phase 0 (xem `docs/PHASE_0_DECISIONS.md`):
- Card images bundled trong client (~10 roles: Sói, Dân, Tiên tri, Bảo vệ, Phù thủy, Thợ săn)
- Reveal: tap-and-hold để xem, release để úp lại (chống nhìn trộm)
- Chủ phòng nhận bài random như mọi người
- Server-side shuffle, private channel `YOUR_CARD` per session

Prompt gợi ý để bắt đầu Phase 2 trên Claude:
```
Tôi đang tiếp tục project werewolf-companion sau khi hoàn thành Phase 1.
Đọc HANDOVER.md để nắm context deploy, và ROADMAP.md để hiểu Phase 2 scope.
Foundation hiện tại: packages/shared (Zod schemas), packages/server (PartyKit LobbyServer), packages/client (React + XState).
Bắt đầu Phase 2: card dealing system.
```
