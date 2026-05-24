# PLAN — `werewolf-companion` Phase 1: Foundation & Lobby

> **Agent:** Architect
> **Phase:** 2–3 (Analysis + Plan)
> **Path:** [ ] Artifact MVP   [x] **Full Repo (mandatory — multi-user realtime)**
> **Module:** Foundation & Lobby System

## Architecture overview

Two-process architecture deployed entirely on Cloudflare's edge.

**Client (Cloudflare Pages):** A Vite + React + TypeScript SPA. Communicates with the server exclusively over WebSocket via `partysocket`. Holds no authoritative state — everything important (who's in the room, ready state, etc.) is mirrored from the server. Local state stores only UI concerns (form inputs, pending optimistic updates) and the `sessionId` in `localStorage` for reconnection identity.

**Server (PartyKit on Cloudflare Workers / Durable Objects):** A single `LobbyServer` class extending PartyServer. Each room ID maps to one Durable Object instance, which is the single source of truth for that room's state. The DO handles WebSocket connections, broadcasts player list updates, manages the host disconnection timer (5 min), and uses DO alarms for the 2-hour idle TTL. Messages between client and server are typed via Zod schemas shared between both sides.

The lobby flow: client opens WebSocket to `wss://<host>/parties/main/<roomCode>`. On connect, client identifies itself with a Zod-validated `JOIN` message containing `{ sessionId, displayName }`. Server replies with a `STATE_SNAPSHOT` containing the full lobby state. Subsequent state changes are pushed via discrete `PLAYER_JOINED`, `PLAYER_LEFT`, `PLAYER_READY_CHANGED`, `PLAYER_KICKED`, `HOST_CHANGED`, `ROOM_CLOSED` messages. Client uses XState to model its connection + lobby phase, which prevents impossible UI states during transitions.

## Artifact-suitability analysis

| Question | Answer | Evidence |
|---|---|---|
| Pure frontend logic? | **NO** | State must sync across 5-20 devices in real-time |
| Single-file React or HTML feasible? | **NO** | Requires a server process |
| Persistent state needed? | **YES** | Per-room state must survive across requests and be visible to all clients in the room |
| If yes, can `window.storage` handle it? | **NO** | `window.storage` is per-conversation/per-user, not shared |
| Auth required? | NO | 6-digit code is a join secret, not authentication |
| **Real-time / multi-user?** | **YES** ⛔ | Core requirement; WebSocket sync between 5-20 clients per room |
| Server-side secrets needed? | NO | No third-party API keys |
| External API CORS-friendly from browser? | N/A | No external APIs |

**Verdict:** Artifact path **REJECTED** — multi-user real-time requirement triggers hard rejection rule. Repo path is the only viable option.

## Tech stack

| Choice | Why this, not the alternative |
|---|---|
| **Language:** TypeScript (strict mode) | Shared types between client and server prevent contract drift; matches user's standard from previous projects |
| **Frontend framework:** React 18 + Vite 6 | Vite 6 is required for Cloudflare Pages (verified in Phase 0). React is the user's known stack. |
| **Styling:** Tailwind CSS v4 | Utility-first matches small mobile screens; Vietnamese diacritics render correctly with Inter/Be Vietnam Pro |
| **Build tool:** Vite 6 | Cloudflare Pages requires ≥6.0; Vite is the React ecosystem standard |
| **Realtime backend:** PartyKit (`partyserver` npm pkg) | Locked in Phase 0. Same Cloudflare DO underneath as raw, but ~80% less boilerplate. `partysocket` client handles reconnect automatically. |
| **Backend storage:** Durable Object in-memory + `state.storage` (SQLite) for snapshot persistence | DO is single-threaded → no race conditions on lobby state. SQLite snapshot lets the DO survive eviction without losing room state. |
| **Client storage:** `localStorage` for `sessionId` + `displayName` | Simple, mobile-friendly, no opt-in popups. Cleared only if user explicitly clears site data. |
| **State machine:** XState v5 (client only) | Lobby has clear phases (CONNECTING / JOINING / IN_LOBBY / KICKED / ROOM_CLOSED) that benefit from explicit modeling vs. nested booleans |
| **Message validation:** Zod | Schemas live in shared package; both client and server parse incoming WS messages through Zod — catches malformed payloads before logic runs |
| **Icons:** `lucide-react` | Locked in Phase 0; verified Vietnamese-safe via standard font rendering (icons are glyph-agnostic) |
| **QR code:** `qrcode.react` | Pure SVG component, no runtime deps, ~5KB gzipped |
| **Routing:** `react-router-dom` v6 | Need `/` (home) and `/?code=NNNNNN` (auto-join). React Router is the standard. |
| **Form state:** React `useState` + manual validation | Forms have ≤3 fields; full form lib (RHF, Formik) is overkill |

**Why not alternatives:**
- *Why not Next.js?* Server components don't help a WebSocket-heavy app; Cloudflare Pages with plain Vite is simpler and free.
- *Why not Socket.io?* Requires sticky sessions and a stateful server you'd have to host. PartyKit gives this for free on the edge.
- *Why not Redux/Zustand?* XState models the lobby's discrete phases better; everything else is local to small components.
- *Why not Tailwind v3?* v4 is current default; performance and DX improvements; no breaking config for our usage.

## Hosting recommendation

**Recommended:** Cloudflare Pages (FE) + PartyKit cloud-prem deploy (BE) into user's own Cloudflare account.

**Why:**
- Both run on Cloudflare edge → ~50ms latency for Vietnamese users
- **$0/month** for the user's traffic volume (verified Phase 0): 5 sessions × 10 players × ~200 msgs/session = ~10K msgs/month, ~99.99% under the free tier ceilings
- Single provider → one dashboard, one DNS, one auth context
- PartyKit cloud-prem is officially free; only DO/Worker usage is billed (and that's under free tier)

**Free-tier details (verified May 2026):**
- Cloudflare Pages: unlimited bandwidth, unlimited requests, 500 builds/month
- Cloudflare Workers: 100K req/day free (well above our usage)
- Durable Objects: 100K req/day free + 13K GB-s/day free + SQLite storage free in 2026
- WebSocket Hibernation API: outgoing messages free; incoming billed 20:1 (so 200 client messages = 10 billed requests)

**Why not Vercel:** Hobby tier bans commercial use; per-seat pricing if collaborators added; no DO equivalent (would need separate WS provider).

**Why not Fly.io / Railway:** No real free tier in 2026; both moved to usage-based trial models. Cost would be $5+/month even idle.

## File tree

```
werewolf-companion/
├── README.md
├── ROADMAP.md
├── DEPLOY.md
├── .gitignore
├── package.json                   # Root workspace (uses npm workspaces)
├── tsconfig.base.json             # Shared TS config
│
├── packages/
│   ├── shared/                    # Zod schemas + types shared between client and server
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts           # Barrel for shared package only (acceptable boundary)
│   │       ├── messages.ts        # Zod schemas: JOIN, STATE_SNAPSHOT, PLAYER_*, etc.
│   │       ├── room.ts            # Room state types
│   │       └── constants.ts       # MIN_PLAYERS=5, MAX_PLAYERS=20, HOST_TIMEOUT_MS, etc.
│   │
│   ├── server/                    # PartyKit server
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── partykit.json          # PartyKit config (room mapping)
│   │   ├── wrangler.toml          # Cloudflare Wrangler config
│   │   └── src/
│   │       ├── server.ts          # LobbyServer class (entry point)
│   │       ├── lobby/
│   │       │   ├── lobbyState.ts  # Pure state reducers (joinPlayer, kickPlayer, etc.)
│   │       │   ├── lobbyState.test.ts  # Unit tests for state transitions
│   │       │   └── codeGenerator.ts    # 6-digit room code generation + collision check
│   │       └── lib/
│   │           ├── broadcast.ts   # Send-to-all helper
│   │           └── alarms.ts      # DO alarm helpers (host timeout, idle cleanup)
│   │
│   └── client/                    # React app
│       ├── package.json
│       ├── tsconfig.json
│       ├── tsconfig.node.json
│       ├── vite.config.ts
│       ├── tailwind.config.ts
│       ├── postcss.config.js
│       ├── index.html
│       └── src/
│           ├── App.tsx            # Router + top-level layout
│           ├── main.tsx           # React entry
│           ├── index.css          # Tailwind imports + global resets
│           │
│           ├── lib/
│           │   ├── ws.ts          # PartySocket wrapper (typed send/receive)
│           │   ├── storage.ts     # localStorage helpers (sessionId, displayName)
│           │   └── format.ts      # formatRoomCode("482915") → "482 915"
│           │
│           ├── hooks/
│           │   ├── useLobby.ts    # Wires PartySocket + XState machine
│           │   └── usePersistedName.ts
│           │
│           ├── machines/
│           │   └── lobbyMachine.ts  # XState machine for lobby phases
│           │
│           ├── components/
│           │   ├── ui/             # Shared atoms
│           │   │   ├── Button.tsx
│           │   │   ├── TextInput.tsx
│           │   │   ├── CodeInput.tsx       # 6-digit segmented input
│           │   │   ├── Dialog.tsx          # Custom confirm dialog (no window.confirm)
│           │   │   └── Toast.tsx
│           │   │
│           │   ├── home/
│           │   │   ├── HomeScreen.tsx
│           │   │   ├── CreateRoomForm.tsx
│           │   │   └── JoinRoomForm.tsx
│           │   │
│           │   └── lobby/
│           │       ├── LobbyScreen.tsx     # Lobby root
│           │       ├── PlayerList.tsx
│           │       ├── PlayerCard.tsx      # One row: name, ready badge, kick button (host only)
│           │       ├── ShareRoom.tsx       # QR + link + copy button
│           │       ├── ReadyButton.tsx
│           │       ├── StartButton.tsx     # Host only; Phase 1 just shows placeholder
│           │       └── KickConfirmDialog.tsx
│           │
│           └── styles/
│               └── tokens.ts       # Color tokens (after Designer picks direction)
│
└── .github/
    └── workflows/
        ├── ci.yml                  # Lint + test + build on PR
        └── deploy.yml              # Auto-deploy to Cloudflare Pages on main
```

**Splitting rationale:**
- `shared` package is the only place Zod schemas live → contract is enforced both sides at compile time
- `server` and `client` each have their own tsconfig, build, and dev script
- Inside `client/`: `lib/` is pure utilities (no React), `hooks/` is React-aware, `components/` grouped by feature folder (home, lobby) not by type
- Tests live next to source (`.test.ts` colocated) — easier to find, easier to delete with the code
- `App.tsx` stays a thin router shell; lobby state lives in `useLobby` hook → consumed by `LobbyScreen`

## Dependencies

### Client (`packages/client/package.json`)

| Package | Version | Purpose |
|---|---|---|
| react | ^18.3.0 | UI |
| react-dom | ^18.3.0 | DOM renderer |
| react-router-dom | ^6.26.0 | Routes: `/`, `/lobby/:code` |
| partysocket | ^1.0.0 | WebSocket client with auto-reconnect |
| xstate | ^5.18.0 | Lobby state machine |
| @xstate/react | ^5.0.0 | React bindings |
| zod | ^3.23.0 | Message validation (imported from `@werewolf/shared`) |
| qrcode.react | ^3.2.0 | QR code SVG |
| lucide-react | ^0.460.0 | Icons |
| **dev:** | | |
| vite | ^6.0.0 | Build (Cloudflare Pages requirement) |
| @vitejs/plugin-react | ^4.3.0 | React plugin |
| typescript | ^5.6.0 | Type checker |
| tailwindcss | ^4.0.0 | Styling |
| @tailwindcss/vite | ^4.0.0 | Tailwind v4 Vite plugin |
| @types/react | ^18.3.0 | Types |
| @types/react-dom | ^18.3.0 | Types |
| eslint | ^9.0.0 | Linting |
| @typescript-eslint/parser | ^8.0.0 | TS lint parser |

### Server (`packages/server/package.json`)

| Package | Version | Purpose |
|---|---|---|
| partyserver | ^0.5.6 | PartyKit server base class |
| zod | ^3.23.0 | Message validation |
| **dev:** | | |
| wrangler | ^4.0.0 | Cloudflare deployment CLI |
| partykit | ^0.0.114 | PartyKit CLI for dev/deploy |
| typescript | ^5.6.0 | Type checker |
| @cloudflare/workers-types | ^4.0.0 | Types for DO API |
| vitest | ^2.0.0 | Unit tests for lobby state reducers |

### Shared (`packages/shared/package.json`)

| Package | Version | Purpose |
|---|---|---|
| zod | ^3.23.0 | Schema library |

## MVP scope (build this in Phase 1)

- [ ] **Home screen** with Tạo phòng + Nhập code CTAs (no listing)
- [ ] **Create room flow** — host name + 6-digit code → DO created → lobby
- [ ] **Join room flow** — code + name (with localStorage pre-fill) → lobby
- [ ] **URL-based auto-join** — `/?code=NNNNNN` pre-fills code on Join form
- [ ] **Lobby state sync** — realtime player list, ready toggle, host badge
- [ ] **Share UX** — QR code + copyable link
- [ ] **Host kick** with custom confirm dialog
- [ ] **Session restore** — refresh-safe via sessionId in localStorage
- [ ] **Host disconnect → 5 min timeout → room closes**
- [ ] **Idle TTL** — 2-hour DO alarm cleanup
- [ ] **Player count enforcement** — 5 min start, 20 max
- [ ] **"Bắt đầu" placeholder** — shows "Phase 2 sẽ chia bài ở đây" stub

## Roadmap stub (for ROADMAP.md)

**Phase 2 — Next:**
- Main desk seed (Sói, Dân, Tiên tri, Bảo vệ, Phù thủy, Thợ săn cards with images)
- Room desk editor (add/remove cards, allow duplicates)
- Card count validation (must equal player count)
- Random card dealing
- "Bài của tôi" screen with tap-and-hold to reveal
- Lock room when match is in progress
- End match → return to lobby

**Phase 3 — Later:**
- Animation: card-dealing motion ("rút bài")
- Connection status indicator
- Better empty / loading / error states
- Mobile UX polish (safe-area insets, haptic feedback)
- Accessibility audit (ARIA, focus management, keyboard nav)

**Future (after MVP):**
- Match history
- Custom user-defined roles
- Preset decks ("Cơ bản 8 người", "Cao cấp 12 người")
- Sound effects
- PWA install
- Narrator-only mode (host doesn't get a card, sees everyone's role)

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Mobile Safari WebSocket reconnect quirks (iOS backgrounds tab) | Medium | partysocket handles reconnect; we surface clear "Đang kết nối lại" UI. Add visibilitychange listener to force-reconnect on tab focus. |
| Vietnamese diacritics break in chosen font | Low | Designer phase verifies font (Be Vietnam Pro / Bricolage Grotesque are pre-validated). Tested with `ấ ợ ự ẵ` at design checkpoint. |
| Two devices submit same room code at the same instant | Very Low | DO is single-threaded; collision check is serialized. Server returns error if code exists, client retries with new code. |
| Host's tab going to sleep on phone (iOS aggressive backgrounding) | Medium | 5-min host timeout is the design accommodation. Phase 3 may add a service-worker keep-alive if needed. |
| Cloudflare DO eviction loses in-memory state mid-session | Low | `state.storage` snapshot persists across evictions; on cold start, server rehydrates from SQLite. |
| User opens 2 tabs (same session) | Medium | Treat as 2 separate connections from same sessionId; broadcast to both but count as 1 player in roster. Document edge case for QA. |
| 6-digit code guessing attack | Very Low | 10^6 = 1M codes; brute force is impractical at WS rate limits. We don't store sensitive data. Acceptable. |

## Sandbox Limitations

**Not applicable — Repo path.** All browser APIs (custom dialogs, localStorage, full CSS, etc.) work normally outside the artifact sandbox. The "always use custom dialog" rule still applies as a UX choice (browser `confirm()` is ugly on mobile), but it's no longer a blocker.

## Graduation Notes

**Not applicable — directly born as a repo.** No artifact-to-repo migration needed.

## Open architectural questions (none blocking Phase 1)

- *In Phase 2:* should the room desk live entirely on the server (single source of truth) or be host-edited locally with optimistic broadcast? **Tentative answer:** server-side. The host's edits go through the same WS message pipeline as any other action; consistent with everything else.
- *In Phase 2:* card images bundled in client or fetched from server? **Tentative answer:** bundled in client (small set, ~10 cards). Server only sends `cardId`; client renders the image.

These are noted here so the Architect agent in Phase 2 doesn't relitigate them from scratch.
