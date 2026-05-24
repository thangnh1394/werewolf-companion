# Project context for Claude Code

> Đây là file Claude Code sẽ đọc tự động khi user chạy `claude` trong folder này. Nó cho Claude biết context dự án để hỗ trợ hiệu quả.

## Dự án

**Sói Đêm (Werewolf Companion)** — digital card dealer cho game ma sói (Vietnamese werewolf). Multi-device realtime app, mỗi người chơi dùng điện thoại riêng.

## Phase hiện tại

**Phase 1 COMPLETE** — Foundation & Lobby System.

Phase 2 (card dealing) và Phase 3 (polish) chưa bắt đầu.

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
├── shared/    Zod schemas + types (foundation)
├── server/    PartyKit LobbyServer + state reducers + 25 tests
└── client/    React app
```

## Quy ước code

- **Identifiers (variables, functions, files, types):** English only
- **UI strings:** Vietnamese
- **TypeScript:** strict mode, no `any`, prefer discriminated unions
- **Components:** Feature folders (`components/home/`, `components/lobby/`, `components/ui/`)
- **State logic:** Pure reducers in server, XState machine in client
- **WebSocket messages:** Always go through Zod schemas in `packages/shared/src/messages.ts`

## Files quan trọng

| File | Purpose |
|---|---|
| `docs/PHASE_0_DECISIONS.md` | Locked decisions từ Phase 0 — KHÔNG đổi |
| `docs/BRIEF.md` | Phase 1 scope + 10 acceptance criteria |
| `docs/PLAN.md` | Tech stack chi tiết, file tree, risks |
| `docs/DESIGN.md` | Design tokens, microcopy, layout patterns |
| `docs/TEST_REPORT.md` | Manual test plan |
| `ROADMAP.md` | Phase 2/3/Future scope |
| `HANDSON_DEPLOY.md` | Step-by-step deploy guide |
| `DEPLOY.md` | Reference deploy doc |

## Commands cheat sheet

```bash
# Dev
npm run dev:server         # PartyKit dev server (port 1999)
npm run dev:client         # Vite dev server (port 5173)

# Verify
npm run type-check         # Type-check all packages
npm test                   # Run server unit tests (25 tests)
npm run build              # Build all packages

# Deploy
cd packages/server && npm run deploy   # Deploy PartyKit server
# Client deploy via Cloudflare Pages GitHub integration (auto)
```

## Khi user hỏi về Phase 2

Phase 2 scope ở `ROADMAP.md`. Quy trình: invoke `/app-creator` với prompt phase 2, team 6 agent (PM/Architect/Designer/Developer/QA/PO) sẽ design + build trên foundation hiện tại. Không phá vỡ Phase 0 decisions.

Các quyết định lớn cho Phase 2 (deferred từ Phase 0):
- Card images: bundled trong client, ~10 cards initial roles (Sói, Dân, Tiên tri, Bảo vệ, Phù thủy, Thợ săn)
- Card reveal: tap-and-hold để xem (anti over-shoulder peek), release để úp lại
- Chủ phòng cũng là player thường (nhận bài random như mọi người)
- Server-side shuffle, private channel `YOUR_CARD` per session (KHÔNG broadcast)

## Khi user gặp lỗi deploy

Tham khảo `HANDSON_DEPLOY.md` → Phase F (Troubleshooting). Common issues:
1. `VITE_PARTYKIT_HOST` set sai (có `https://` prefix)
2. PartyKit Miniflare dev local fail (network restriction → test direct trên cloud)
3. Cloudflare Pages monorepo workspace not resolving
4. iOS Safari Private mode → localStorage không persist

## Khi cần edit code

- Server logic: `packages/server/src/lobby/lobbyState.ts` (pure reducers — test trước khi edit)
- Server WebSocket handling: `packages/server/src/server.ts`
- Client lobby UI: `packages/client/src/components/lobby/LobbyScreen.tsx`
- WebSocket protocol: `packages/shared/src/messages.ts` (đổi schema = đổi cả 2 phía)

Sau mọi edit, chạy:
```bash
npm run type-check && npm test
```

## Khi user muốn revert Phase 0 decisions

Hỏi lại confirmation rõ ràng. Phase 0 decisions được lock có lý do — đổi sẽ ảnh hưởng cả Phase 2/3.

## Tone với user

- Vietnamese mặc định (user dùng Vietnamese)
- Code identifiers English
- Direct, kỹ thuật, không over-explain
- Khi suggest fix, propose 1 cách chính + 1 alternative nếu relevant
