# Sói Đêm (Werewolf Companion)

> Digital card dealer for in-person Vietnamese ma sói game sessions.
> Multi-device, realtime, runs entirely on Cloudflare's free tier.

## Status

**Production-ready.** Phases 1–3 complete. Phase 4 (GM Mode) planned in
separate branch — see `docs/PHASE_4_DECISIONS.md`.

## What it does

5–20 friends in the same room each open the app on their phone. One person
creates a room with a 6-digit code, shares a QR / link with the others, and
everyone joins their own player slot. The host composes a deck (choosing which
roles and how many of each), then deals — each player gets a private card
visible only on their own phone via tap-and-hold reveal. After the in-person
game finishes, the host ends the round and the deck is preserved for the next
ván.

Features:
- 15 role cards with AI-generated artwork
- 20 avatar set + customizable profile (name + avatar)
- QR code share with expand-on-tap for physical scanning
- Cinematic game-start transitions (3 random variants)
- Card back tap-and-hold reveal with tilt animation
- Full reconnect / refresh support
- Privacy: card assignments never broadcast, only sent privately to the
  assigned player

## Stack

| Layer | Tech | Why |
|---|---|---|
| Frontend | Vite 6, React 18, TypeScript strict, Tailwind v4 | Mobile-first SPA |
| Realtime | PartyKit + partysocket (Cloudflare Durable Objects) | 1 room = 1 DO |
| State machine | XState 5 | Connection + game phases |
| Validation | Zod | Shared schemas client ↔ server |
| Hosting | Cloudflare Pages (FE) + PartyKit cloud (BE) | $0/year free tier |

## Project structure

```
werewolf-companion/
├── .github/                       CI workflows
├── docs/                          Architecture decisions + design reference
├── packages/
│   ├── shared/                    Zod schemas + types (used by both sides)
│   ├── server/                    PartyKit LobbyServer + state reducers + tests
│   └── client/                    React app + card/avatar/transition assets
└── package.json                   workspace root
```

## Local development

```bash
# Install all workspace deps
npm install

# Start the server (PartyKit dev — runs Miniflare locally on port 1999)
npm run dev:server

# In another terminal, start the client (Vite on port 5173)
npm run dev:client
```

The client looks for the PartyKit host at `localhost:1999` by default. To point
at a deployed server, set `VITE_PARTYKIT_HOST` in `packages/client/.env.local`:

```env
VITE_PARTYKIT_HOST=your-deploy.<username>.partykit.dev
```

## Useful commands

```bash
npm test                          # Run all tests (52 passing)
npm run type-check                # Type-check all packages
npm run build                     # Build all packages
```

## Deployment

See [DEPLOY.md](./DEPLOY.md).

## Roadmap

- ✅ Phase 1 — Lobby system
- ✅ Phase 2 — Card dealing + gameplay loop
- ✅ Phase 3 — Polish (avatars, transitions, role thumbnails, QR expand)
- 🚧 Phase 4 — GM Mode (separate branch — see `docs/PHASE_4_DECISIONS.md`)

## License

Private project. All rights reserved.
