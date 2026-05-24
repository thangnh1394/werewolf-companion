# Roadmap

## Phase 1 — Foundation & Lobby System ✅ COMPLETE

Delivered: Home, Create room, Join room (incl. `?code=` URL pre-fill), Lobby with realtime sync, Ready toggle, Host kick with confirm, QR + link share, localStorage name + session restore, host 5-min disconnect timeout, 2-hour idle TTL, max 20 / min 5 player validation, "Bắt đầu chia bài" placeholder.

**Key files:**
- `packages/server/src/lobby/lobbyState.ts` — Pure state reducers (25 unit tests pass)
- `packages/server/src/server.ts` — LobbyServer Durable Object with Hibernation
- `packages/client/src/components/lobby/LobbyScreen.tsx` — Main lobby UI

## Phase 2 — Card System & Game Loop (NEXT)

### Scope

- **Main desk** — Seed cards as static JSON + bundled images. Initial roles:
  - Sói (Werewolf)
  - Dân thường (Villager)
  - Tiên tri (Seer)
  - Bảo vệ (Bodyguard)
  - Phù thủy (Witch)
  - Thợ săn (Hunter)
- **Room desk editor** — Host-only UI to add/remove cards from main desk; allows duplicates (e.g. 2 wolves, 3 villagers); shows running count
- **Pre-start validation** — Card count must equal player count; helpful error message when mismatched
- **Random card assignment** — Server-side shuffle on `START_GAME`; each player receives one card via private channel (server sends `YOUR_CARD` to each connection individually, not via broadcast)
- **"Bài của tôi" screen** — Tap-and-hold to reveal; release to flip back face-down (designed in Phase 0 to prevent over-shoulder peek)
- **Room lock during play** — New joiners see "Trận đấu đang diễn ra, vui lòng chờ" and are rejected at JOIN time
- **End game flow** — Host "Kết thúc trận" button → all return to lobby; room desk preserved for next round

### Design questions for Phase 2 (deferred from Phase 0)

- Card back design: simple lantern + geometric pattern, or fully custom illustration?
- Card-reveal animation: opacity fade + scale, or 3D flip?
- Role illustrations: one cohesive Unsplash/illustrations set, or commission a small custom set?

### State machine extension

Lobby machine adds a `playing` state and `IN_GAME` substates. Card state held server-side in a new `roundState` separate from `lobbyState` (clean separation lets us reset rounds without touching lobby).

## Phase 3 — Polish & Edge Cases

- Reconnect UX: "Đang kết nối lại..." toast that auto-dismisses on reconnect
- Animation: card-dealing motion ("rút bài"), button press feedback, fade transitions between screens
- Connection status indicator (small dot in header: green/amber/red)
- Empty / loading / error states for every async boundary
- Mobile UX: haptic feedback on iOS, larger tap targets where needed, safe-area inset polish
- Accessibility audit:
  - All buttons have visible focus states
  - Screen reader announces player joins/leaves via `aria-live="polite"`
  - Color contrast verified for all states (already AAA for primary text per design tokens)
  - Keyboard nav full coverage
- Performance: code-split routes, lazy-load QR code lib, prefetch lobby on home page hover

## Future (post-MVP)

- **Match history** — store recent rounds locally in IndexedDB (no server-side, keeps privacy)
- **Custom user-defined roles** — host adds new card with name + description + image
- **Preset decks** — "Cơ bản 8 người", "Cao cấp 12 người", "Hỗn loạn 15 người"
- **Sound effects** — toggle in settings; ambient night sounds + dramatic stings on reveal
- **PWA install** — Web App Manifest + service worker for offline shell
- **Narrator mode** — Host opt-in: doesn't receive a card, sees everyone's role (for game master use)
- **Voice rooms** — integrate with a WebRTC sidecar (e.g. peer-to-peer) so geographically separated players can also play

Not all "Future" items will ship — they're a wishlist. Phase 1 + Phase 2 cover the core problem; Phase 3 makes it production-quality.
