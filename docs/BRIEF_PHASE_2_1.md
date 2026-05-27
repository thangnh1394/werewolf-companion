# BRIEF — Phase 2.1: Card Foundation

> **Agent:** Product Manager
> **Sub-phase:** 2.1 (Card Foundation)
> **Module:** Card data + images + Main Desk display
> **Parent decisions:** see `PHASE_2_DECISIONS.md`

## Tool

Phase 2.1 establishes the card system foundation: 15 role definitions, bundled Pexels images, shared types/schemas, and a Main Desk read-only display where users can browse all available roles. No game logic yet — that's Phase 2.4. No editor yet — that's Phase 2.3.

## Users

Same target as Phase 1: groups of 5-20 friends playing ma sói together. In Phase 2.1, the primary use case is **education** — newcomers exploring what roles exist before a host decides to use them, and experienced players reminding themselves of less-common role abilities.

## Problem solved

After Phase 1, the app has a lobby but no way to even see what cards exist. Players have to remember ma sói rules from memory. Phase 2.1 adds an in-app reference: tap a button in the lobby to browse all 15 roles with descriptions and team affiliations.

## Primary user journey

1. User is in lobby (either host or player, after joining)
2. Taps "Xem bộ bài" button (icon: `Layers` or similar, in lobby header next to share button)
3. Modal/screen opens showing all 15 cards grouped by team:
   - **Phe Sói** (4 cards)
   - **Phe Dân Làng** (9 cards)
   - **Phe Trung Lập** (2 cards)
4. Each section header has a small `info` icon → tap to see team explanation (win condition, role count)
5. Each card cell shows: thumbnail image, name, "Phổ biến" badge if applicable
6. Tap a card → detail dialog opens with full info (large image, name, team, ability description)
7. Close detail → back to list
8. Close list → back to lobby (lobby state preserved)

## In scope (Phase 2.1 deliverable)

- **15 role definitions** in shared package (id, name, team, ability text, image path, popular flag)
- **Pexels image sourcing** — Designer picks one image per role matching "Bàn gỗ kể chuyện" theme
- **Image optimization** — download → resize 400×400 → convert WebP @ 85% quality → place in `packages/client/public/cards/`
- **Attribution data** — photographer name + Pexels URL per image, surfaced in About page
- **About / Credits screen** — accessible from home page footer
- **MainDeskScreen component** — full-screen modal (or page route) listing cards grouped by team
- **TeamSection component** — collapsible section header with info icon for team explanation
- **CardCell component** — thumbnail + name + popular badge, tap to open detail
- **CardDetailDialog component** — large image, name, team badge, ability description
- **TeamExplainDialog component** — for the info icon (Sói/Dân/Trung Lập explanations)
- **Entry point in LobbyScreen** — small "Xem bộ bài" button in lobby header
- **Featured/Popular flag** on 5 most-common roles: Sói Thường, Dân Làng, Tiên Tri, Bảo Vệ, Phù Thủy
- **Cleanup tasks:**
  - Remove dead `partyserver` dep from `packages/server/package.json`
  - Add `*.tsbuildinfo` and `vite.config.js` to `.gitignore`

## Out of scope (NOT in Phase 2.1)

- ⏭ Room desk editor with add/remove → **Phase 2.3**
- ⏭ Card dealing logic → **Phase 2.4**
- ⏭ "Bài của tôi" reveal screen → **Phase 2.5**
- ⏭ End game flow → **Phase 2.6**
- ⏭ Editing card definitions at runtime (always static for now)
- ⏭ Localization beyond Vietnamese

## Improvements (accepted by user)

- **Team info tooltip** — each team section header has info icon → opens explanatory dialog. ACCEPTED.
- **"Phổ biến" badge** — top 5 most-used roles get a small badge for newbie guidance. ACCEPTED.

## Acceptance criteria

1. Given user is in a lobby, when they tap "Xem bộ bài" in the lobby header, then a Main Desk screen opens displaying all 15 cards.
2. Given Main Desk is open, then cards are grouped by team in 3 sections (Sói, Dân Làng, Trung Lập), with team-color accents.
3. Given a team section header, when user taps its info icon, then a dialog opens explaining the team's role count and win condition.
4. Given a card cell, when user taps it, then a detail dialog opens showing the large image, name, team badge, and ability description.
5. Given a card is in the "popular" set (5 specific roles), then its cell shows a small "Phổ biến" badge.
6. Given a user closes the Main Desk, then the underlying lobby state is preserved (player list, ready states unchanged).
7. Given a user is on home page, when they tap the "Tín dụng ảnh" link in footer, then an About page opens with all 15 photographer credits.
8. Given the client bundle is built, then total `/cards/*.webp` payload is ≤ 500 KB (i.e., ≤33 KB average per image).
9. Given a slow 3G connection, when Main Desk opens, then card thumbnails load progressively (lazy load) without blocking the UI.
10. Given Phase 1 fixes are intact (server.ts uses Party.Server, host auto-ready, isTerminatedRef), then no regression in lobby behavior.

## Constraints

- **Time:** No hard deadline; one session per sub-phase
- **Tech:** Continue Phase 1 stack (Vite + React + TS + Tailwind v4 + lucide-react + PartyKit)
- **Cost:** $0/month maintained — no new infra
- **Image format:** WebP only (no fallback for IE11; mobile Safari supports WebP since iOS 14)
- **Image size budget:** ≤ 500 KB total for 15 images = ~33 KB/image after optimization
- **Code language:** English identifiers; Vietnamese UI strings
- **No regression:** All 25 Phase 1 unit tests still pass; lobby flow works identically

## Success signal

When a host who's never opened the app before can: (a) create a room, (b) tap "Xem bộ bài" and see 15 cards organized by team, (c) understand which 5 are most common via the badges, and (d) tap any card to read its ability — all without prior ma sói rule knowledge. That's the Phase 2.1 win.

## Implementation order suggested

1. **Designer Research** — pick 15 Pexels image URLs + write team explanations
2. **Architect** — file tree + Zod schemas + cleanup tasks
3. **Designer Mockups** — render real HTML for CardCell, DetailDialog, MainDeskScreen, TeamExplainDialog
4. **Developer** — bundle images, implement components, integrate with lobby
5. **QA** — type-check, tests, build size budget verification, manual smoke
6. **PO** — accept against the 10 criteria
