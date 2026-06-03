# Project context for Claude Code

> Đây là file Claude Code sẽ đọc tự động khi user chạy `claude` trong folder này. Nó cho Claude biết context dự án để hỗ trợ hiệu quả.

## Dự án

**Sói Đêm (Werewolf Companion)** — digital card dealer cho game ma sói (Vietnamese werewolf). Multi-device realtime app, mỗi người chơi dùng điện thoại riêng.

## Phase hiện tại

**Phase 3 COMPLETE** — Production-ready. Phases 1–3 đã ship.

- Phase 1: Lobby system (room codes, ready check, kick, QR share)
- Phase 2: 15 role cards, Room Desk Editor, dealing, tap-and-hold reveal, end-game loop
- Phase 3: Avatars, profile editor, QR expand, role thumbnails, game-start transitions

Phase 4 (GM Mode) sẽ được develop trên branch `phase-4-gm-mode`. Xem `docs/PHASE_4_DECISIONS.md`.

## Stack

- **Frontend:** Vite 6, React 18, TypeScript strict, Tailwind v4
- **Realtime:** PartyKit (Cloudflare Durable Objects)
- **State machine:** XState 5
- **Validation:** Zod (shared between client/server)
- **Hosting:** Cloudflare Pages (FE) + PartyKit cloud-prem (BE)
- **Cost target:** $0/năm

## Monorepo structure

```
packages/
├── shared/    Zod schemas + types
├── server/    PartyKit LobbyServer + state reducers + 52 tests
└── client/    React app + cards/avatars/transitions assets
```

## Quy ước code

- **Identifiers (variables, functions, files, types):** English only
- **UI strings:** Vietnamese
- **TypeScript:** strict mode, no `any`, prefer discriminated unions
- **Components:** Feature folders (`components/home/`, `components/lobby/`, `components/game/`, `components/ui/`)
- **State logic:** Pure reducers in server, XState machine in client
- **WebSocket messages:** Always go through Zod schemas in `packages/shared/src/messages.ts`

## Files quan trọng

| File | Purpose |
|---|---|
| `docs/PHASE_0_DECISIONS.md` | Locked decisions từ Phase 0 — KHÔNG đổi |
| `docs/PHASE_2_DECISIONS.md` | Card system architecture decisions |
| `docs/PHASE_4_DECISIONS.md` | GM Mode planning + TODOs for Phase 4 |
| `docs/BRIEF.md` | Original project brief (historical) |
| `docs/PLAN.md` | Tech stack chi tiết, file tree |
| `docs/DESIGN.md` | Design tokens, microcopy, layout patterns |
| `ROADMAP.md` | Phase summary + Phase 4 scope |
| `DEPLOY.md` | Deploy guide (Cloudflare Pages + PartyKit) |
| `CHANGELOG.md` | Feature history per phase |

## Commands cheat sheet

```bash
# Dev
npm run dev:server         # PartyKit dev server (port 1999)
npm run dev:client         # Vite dev server (port 5173)

# Verify
npm run type-check         # Type-check all packages
npm test                   # Run server unit tests (52 tests)
npm run build              # Build all packages

# Deploy
cd packages/server && npm run deploy   # Deploy PartyKit server
# Client deploy via Cloudflare Pages GitHub integration (auto)
```

## Khi user hỏi về Phase 4 (GM Mode)

Phase 4 scope và decisions ở `docs/PHASE_4_DECISIONS.md`. Development trên branch `phase-4-gm-mode`, không merge vào `main` cho đến khi complete.

## Khi user gặp lỗi deploy

Tham khảo `DEPLOY.md` → Troubleshooting section. Common issues:
1. `VITE_PARTYKIT_HOST` set sai (có `https://` prefix)
2. PartyKit Miniflare dev local fail (network restriction → test direct trên cloud)
3. Cloudflare Pages monorepo workspace not resolving
4. iOS Safari Private mode → localStorage không persist

## Khi cần edit code

- Server state logic: `packages/server/src/lobby/lobbyState.ts` (pure reducers — test trước khi edit)
- Server WebSocket handling: `packages/server/src/server.ts`
- Client lobby UI: `packages/client/src/components/lobby/LobbyScreen.tsx`
- Client game screen: `packages/client/src/components/game/`
- WebSocket protocol: `packages/shared/src/messages.ts` (đổi schema = đổi cả 2 phía)

Sau mọi edit, chạy:
```bash
npm run type-check && npm test
```

## Khi user muốn revert Phase 0 decisions

Hỏi lại confirmation rõ ràng. Phase 0 decisions được lock có lý do — đổi sẽ ảnh hưởng Phase 4.

## Tone với user

- Vietnamese mặc định (user dùng Vietnamese)
- Code identifiers English
- Direct, kỹ thuật, không over-explain
- Khi suggest fix, propose 1 cách chính + 1 alternative nếu relevant
