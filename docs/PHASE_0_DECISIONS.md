# Phase 0 — Locked Decisions

> Quyết định đã chốt sau Phase 0 research + brainstorm. **KHÔNG được thay đổi** trong các phase sau trừ khi user yêu cầu lại explicitly.

## App Overview

- **Slug:** `werewolf-companion`
- **Display name:** TBD trong Phase 1 (gợi ý: "Ma Sói Companion", "Sói Đêm")
- **Loại app:** Digital card dealer cho game ma sói offline. Multi-device, cùng phòng vật lý.
- **UI language:** Tiếng Việt
- **Code language:** English-only identifiers (variables, functions, files, components, types, comments). UI strings là tiếng Việt.
- **Target device:** Mobile web (browser trên điện thoại)
- **Min/Max players/room:** 5-20

## Tech Stack (locked)

| Layer | Choice |
|---|---|
| Frontend framework | Vite 6 + React 18 + TypeScript |
| Styling | Tailwind CSS |
| Icons | lucide-react |
| Realtime backend | PartyKit (cloud-prem, deploy vào Cloudflare account của user) |
| Client realtime lib | `partysocket` + `usePartySocket` hook |
| Backend lang | PartyServer (TypeScript) — 1 room = 1 Durable Object |
| State machine | XState cho game phases |
| Message validation | Zod schemas dùng chung client + server |
| Hosting FE | Cloudflare Pages |
| Hosting BE | Cloudflare Workers (qua PartyKit cloud-prem) |
| Estimated cost | $0/năm (free tier dư ~10,000x) |

## Game Rules (locked)

### Home page
- 2 nút: "Tạo phòng" và "Nhập code phòng"
- KHÔNG có public listing
- KHÔNG có authentication

### Tạo phòng
- Chủ phòng nhập:
  - Tên hiển thị
  - Code 6 số tự đặt (password phòng)
- Cho phép trùng tên với người khác (không validate)

### Vào phòng
- Nhập code 6 số
- Nhập tên hiển thị
- Cho phép trùng tên

### Trong lobby
- Danh sách user hiện tại
- Mỗi user có nút "Sẵn sàng" toggle
- Chủ phòng có thêm:
  - Nút "Bắt đầu" (chỉ enable khi TẤT CẢ user sẵn sàng)
  - Editor room desk (Phase 2)
  - Nút kick user (with confirm dialog)

### Room desk
- Chủ phòng customize bằng cách add/remove card từ main desk
- Cho phép duplicate (ví dụ 2 sói, 2 dân)
- Validate trước start: `số card === số người trong phòng`. Lỗi → force chủ phòng chỉnh lại.

### Khi start game
- Random chia 1 card/người (bao gồm chủ phòng)
- Mỗi user thấy màn "Bài của tôi"
- **Hiển thị bài: úp ngược, tap giữ để xem, thả tay úp lại** (chống lộ bài cho người ngồi bên cạnh)
- Chủ phòng nhận bài ngẫu nhiên như player thường, KHÔNG biết bài người khác
- Chủ phòng có thêm nút "Kết thúc trận"
- LOCK phòng: user mới vào sẽ thấy "Trận đấu đang diễn ra, vui lòng chờ"

### Khi end game
- Mọi người về lobby
- Người mới có thể join lại
- Room desk được giữ nguyên (không reset)

### Edge cases
- **Chủ phòng disconnect giữa game:** chờ 5 phút, sau đó tự động đóng phòng (tất cả disconnect)
- **User refresh giữa ván:** restore bài đã chia qua sessionId trong localStorage
- **Code phòng trùng:** server generate unique check khi tạo
- **Phòng zombie:** TTL 2 giờ idle → auto-cleanup (DO alarm)

## Phase Breakdown

### Phase 1 — Foundation & Lobby System
Scope: Home, tạo/nhập phòng, lobby, sẵn sàng, kick, realtime sync. KHÔNG có chia bài.

### Phase 2 — Card System & Game Loop
Scope: Main desk seed, room desk editor, validate, chia bài random, "Bài của tôi" (tap-hold), end game, lock phòng.

### Phase 3 — Polish & Edge Cases
Scope: Reconnect handling, animation chia bài, mobile UX polish, accessibility.

### Future (not MVP)
- Lịch sử ván chơi
- Custom card user-defined
- Bộ bài presets
- Sound effects
- PWA install
- Chế độ "Chủ phòng = quản trò thuần"

## Assets

- Team source ảnh placeholder đẹp từ Unsplash/illustrations free
- Bundled trong source code (không cần CDN/storage riêng)

## Reference

- PartyKit docs: https://docs.partykit.io
- Durable Objects pricing: https://developers.cloudflare.com/durable-objects/platform/pricing
- Cloudflare Pages: https://pages.cloudflare.com
