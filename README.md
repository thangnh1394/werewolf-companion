# Sói Đêm (Werewolf Companion)

> Digital card dealer for in-person Vietnamese werewolf (ma sói) game sessions. Multi-device, realtime, runs entirely on Cloudflare's free tier.

## Status

**Phase 1 complete** — Foundation & Lobby System. Phase 2 (card dealing) and Phase 3 (polish) are next.

## What it does

5–20 friends in the same room each open the app on their phone. One person creates a room with a 6-digit code, shares a QR/link with the others, and everyone joins their own player slot. When everyone presses "Sẵn sàng" (Ready), the host can start a game. (Phase 1 stops here with a placeholder; Phase 2 will deal random role cards.)

## Stack

| Layer | Tech | Why |
|---|---|---|
| Frontend | Vite 6, React 18, TypeScript, Tailwind v4 | Mobile-first SPA, fast HMR, type-safe |
| Realtime | PartyKit + `partysocket` (Cloudflare Durable Objects under the hood) | 1 room = 1 DO, hibernates when idle |
| State machine | XState 5 | Connection phases (connecting → in_lobby → kicked/closed) |
| Message validation | Zod | Shared schemas between client and server |
| Hosting | Cloudflare Pages (FE) + PartyKit cloud-prem deploy (BE) | $0/year on free tier for our usage |

## Project structure

```
werewolf-companion/
├── docs/                    Phase 0 decisions, BRIEF, PLAN, DESIGN
├── packages/
│   ├── shared/              Zod schemas + types (used by both sides)
│   ├── server/              PartyKit LobbyServer + state reducers + tests
│   └── client/              React app
└── .github/workflows/       CI + auto-deploy
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

The client will look for the PartyKit host at `localhost:1999` by default. To point at a deployed server, set `VITE_PARTYKIT_HOST` in `packages/client/.env.local`:

```env
VITE_PARTYKIT_HOST=your-deploy.<username>.partykit.dev
```

## Useful commands

```bash
npm test                          # Run all tests
npm run type-check                # Type-check all packages
npm run build                     # Build all packages
npm run -w @werewolf/server test  # Just server tests (25 unit tests)
```

## Deployment

See [DEPLOY.md](./DEPLOY.md) for full step-by-step deployment to Cloudflare.

## Cost

Estimated cost for our group (4-5 sessions/month, ~10 players, ~2-3 hours each): **$0/year**. Free tier limits are ~10,000× what we'll actually use. See `docs/PLAN.md` for the math.

## Roadmap

See [ROADMAP.md](./ROADMAP.md). Short version:

- **Phase 1** ✅ Lobby system
- **Phase 2** — Card dealing (main desk + room desk editor + "Bài của tôi" screen)
- **Phase 3** — Polish (animations, accessibility, reconnect UX)
- **Future** — Match history, custom roles, preset decks, PWA

## License

Private project. All rights reserved by the author.
