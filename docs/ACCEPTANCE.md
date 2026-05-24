# Acceptance — Phase 1: Foundation & Lobby System

> **Agent:** Product Owner
> **Phase:** 6 (Acceptance)

## Phase 1 deliverables — final check

### Code

- [x] Monorepo with npm workspaces (3 packages: shared, server, client)
- [x] TypeScript strict mode in all packages
- [x] Tests pass (25/25)
- [x] Type-check clean
- [x] Production build succeeds (100 KB gzipped client bundle)

### Features (BRIEF.md scope)

- [x] Home page with "Tạo phòng" / "Nhập code" CTAs, no public listing
- [x] Create room flow: host name + 6-digit code → room created
- [x] Join room flow: code + name (with localStorage pre-fill)
- [x] URL-based join: `/?code=NNNNNN` redirects to join form with code pre-filled
- [x] Lobby screen: realtime player list with host badge
- [x] Ready toggle per player; realtime sync
- [x] Host kick with custom confirm dialog
- [x] QR code + copyable share link
- [x] localStorage name memory (pre-fill + edit)
- [x] Session restore (sessionId in localStorage)
- [x] Host disconnect → 5-min timeout → room closes
- [x] Idle TTL (2 hours)
- [x] Max 20 players enforced; min 5 to start
- [x] "Bắt đầu" button placeholder (shows "Phase 2 sẽ chia bài ở đây")
- [x] Edge state screens: kicked, room closed, join error

### Design (DESIGN.md spec)

- [x] Direction: "Bàn gỗ kể chuyện" applied (forest dark + amber)
- [x] Color palette matches tokens
- [x] Be Vietnam Pro font loaded
- [x] 3-zone flex layout (sticky header + scrollable list + sticky footer)
- [x] `100dvh` viewport (not `100vh`) for iOS Safari URL bar
- [x] Thin amber 4px scrollbar (Option A chosen)
- [x] Sort: self → not-ready → divider → ready
- [x] "Chờ mọi người sẵn sàng" copy (not per-name)
- [x] Thematic microcopy ("Đêm về, dân làng tụ họp...", "Đang nghĩ...", "Ngọn lửa đã tắt")
- [x] Safe-area inset for iOS home indicator
- [x] All 7 mockup screens implemented (home, create, join, lobby host waiting, lobby all ready, lobby player, kick dialog, edge states)

### Documentation

- [x] README.md (project overview, stack, dev setup)
- [x] DEPLOY.md (step-by-step Cloudflare deployment)
- [x] ROADMAP.md (Phase 2, Phase 3, Future)
- [x] docs/PHASE_0_DECISIONS.md (locked decisions)
- [x] docs/BRIEF.md (Phase 1 PM scope)
- [x] docs/PLAN.md (Architect tech plan)
- [x] docs/DESIGN.md (full design tokens + microcopy)
- [x] docs/TEST_REPORT.md (QA results)

### CI/CD

- [x] `.github/workflows/ci.yml` — type-check + test + build on PR
- [x] `.github/workflows/deploy.yml` — auto-deploy server + client on main push
- [x] Workflows reference required secrets (`PARTYKIT_TOKEN`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `PARTYKIT_HOST`)

### Cost target

- [x] Estimated $0/year on Cloudflare free tier for our usage profile (verified Phase 0)

## Out of scope (NOT in Phase 1, deferred to Phase 2/3)

- ⏭ Card dealing logic
- ⏭ Main desk / Room desk editor
- ⏭ "Bài của tôi" screen with tap-and-hold
- ⏭ Game-in-progress lock
- ⏭ End game flow
- ⏭ Card-deal animation
- ⏭ Full accessibility audit
- ⏭ PWA install

## Acceptance verdict

**Phase 1 ACCEPTED.** Ready for user smoke testing and deployment per the test plan in `docs/TEST_REPORT.md`.

## What the user needs to do next

1. **Deploy** (see DEPLOY.md) — PartyKit server first, then Cloudflare Pages client
2. **Smoke test** (see TEST_REPORT.md section "Test plan") on real phones to verify realtime layer
3. **Iterate** if any issues emerge from smoke test
4. **Approve Phase 2 start** — card system + game loop

## Recommended next session

Re-invoke `/app-creator` with prompt: *"Phase 2 cho werewolf-companion: card system + game loop"*. Phase 0 decisions and Phase 1 docs in this repo will be the input. The 6-agent SDLC team will then design + build Phase 2 on top of the same foundation.
