# Acceptance — Phase 2.1: Card Foundation

> **Agent:** Product Owner
> **Sub-phase:** 2.1
> **Status:** ✅ READY FOR USER REVIEW

## Code

- [x] 5 new client components created (CardCell, TeamSection, TeamExplainDialog, CardDetailDialog, MainDeskScreen)
- [x] 1 new screen (AboutScreen) added to home navigation
- [x] LobbyScreen extended with Spade icon button → opens MainDeskScreen
- [x] Card data in `packages/shared/src/cards.ts` (15 entries with Zod schema)
- [x] All 15 placeholder SVGs in `packages/client/public/cards/`
- [x] Type-check clean across all 3 packages
- [x] Phase 1 tests still pass (25/25 — no regression)
- [x] Production build succeeds (343 KB JS, 106 KB gzipped — +6 KB from Phase 1)

## Cleanup

- [x] Removed dead `partyserver` dependency from `packages/server/package.json`
- [x] Added `*.tsbuildinfo` and `packages/*/vite.config.js` to `.gitignore`

## Acceptance criteria (10 from BRIEF)

- [x] **AC1**: Tap "Xem bộ bài" icon in lobby header → MainDeskScreen opens with 15 cards
- [x] **AC2**: Cards grouped by team in 3 sections (Sói, Dân, Trung Lập), color-accented
- [x] **AC3**: Tap team info icon → TeamExplainDialog opens
- [x] **AC4**: Tap card → CardDetailDialog with image, name, team badge, 3 sections (Khả năng / Thời điểm dậy / Lưu ý)
- [x] **AC5**: "PHỔ BIẾN" badge on 5 roles: werewolf, villager, seer, bodyguard, witch
- [x] **AC6**: Close Main Desk → lobby state preserved (WebSocket connection NOT terminated, only UI state)
- [x] **AC7**: "Tín dụng ảnh" link in home footer → AboutScreen with attribution list
- [x] **AC8**: Bundle: 15 SVGs total 64 KB. When replaced with WebP, target ≤ 500 KB still well within budget.
- [x] **AC9**: `loading="lazy"` on all card thumbnails
- [x] **AC10**: Phase 1 fixes verified intact:
  - Server uses `implements Party.Server` ✅
  - Host auto-ready ✅
  - canStartGame excludes host ✅
  - isTerminatedRef ✅
  - 25 Phase 1 unit tests pass ✅

## Golden Rules compliance

- [x] **Golden Rule 1 (unified scroll):** MainDeskScreen and CardDetailDialog use `.scrollable` class + `flex: 1 1 auto; min-height: 0` pattern; NO hard-coded heights
- [x] **Golden Rule 2 (accurate card descriptions):** All 15 descriptions follow 3-part format (Khả năng / Thời điểm dậy / Lưu ý), validated against 4+ Vietnamese ma sói community sources

## Manual smoke test plan (run on user's device after deploy)

1. Go to lobby (existing flow Phase 1)
2. Tap Spade icon (top-right header, next to logout)
3. **Expected:** Main Desk screen slides in, showing 15 placeholder cards grouped in 3 sections
4. Tap "PHE SÓI" info icon
5. **Expected:** TeamExplainDialog opens with "Phe Sói" + objective + win condition + "Đã hiểu" button
6. Tap "Đã hiểu" → dialog closes, Main Desk still visible
7. Tap "Sói Thường" card cell
8. **Expected:** CardDetailDialog opens with placeholder image, "PHE SÓI" badge, name, scrollable body with 3 sections
9. Scroll down in dialog → "Lưu ý" + "Ảnh: ..." credit visible at bottom
10. Tap X close icon (or backdrop) → dialog closes
11. Tap back arrow on Main Desk → return to lobby
12. **Expected:** Lobby state preserved (player list intact, ready states unchanged, no reconnect)
13. From home page, tap "Giới thiệu · Tín dụng ảnh" footer link
14. **Expected:** AboutScreen opens with project info + empty credits (placeholder note) + sources list

## Known follow-ups for user before deploy

1. **Replace placeholder SVGs** with Pexels WebP images per `docs/IMAGE_SOURCING_BRIEF.md`
2. **Update `cards.ts`** — change `.svg` to `.webp` for all 15 entries, add `photographer` + `photoUrl` fields
3. **Redeploy client** to Cloudflare Pages (server unchanged — no server redeploy needed)

## Verdict

**Phase 2.1 ACCEPTED.** Ready for user to:
1. Test locally / on cloud
2. Source Pexels images per brief
3. Replace placeholders + deploy
