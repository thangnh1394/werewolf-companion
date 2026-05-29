# Acceptance — Phase 2.5: "Bài của tôi" Tap-and-Hold Reveal

> **Agent:** Product Owner
> **Sub-phase:** 2.5
> **Status:** ✅ READY FOR USER REVIEW

## Code

- [x] Added `shortAbility` field to CardSchema + 15 cards in shared/cards.ts
- [x] New component: `RevealCard.tsx` — same-format front/back, tap-and-hold reveal, tilt animation during transition
- [x] Rewrote `PlayingScreen.tsx` — face-down default, RevealCard + "Xem chi tiết" button + reuses CardDetailDialog
- [x] Placeholder `card-back.svg` (forest moon emblem) — fallback if WebP not yet generated
- [x] Card back path: `/cards/card-back.webp` (primary) → `/cards/card-back.svg` (fallback via onError)
- [x] Tap-and-hold scope: ONLY inside card div (not full screen)
- [x] Type-check clean
- [x] Tests: 46/46 pass (no regression)
- [x] Production build: 363 KB JS, 110 KB gzipped (+1 KB gzip)

## Acceptance criteria (12 from BRIEF)

- [x] **AC1**: Default state shows card face-down with card back image + hint text below
- [x] **AC2**: Press-and-hold → tilt animation (~280ms) → card face-up with role info
- [x] **AC3**: Release → tilt animation → card face-down immediately
- [x] **AC4**: Face-up shows: role image, team badge, name, shortAbility (1 line)
- [x] **AC5**: pointerleave handled (drag finger off card → flips back)
- [x] **AC6**: Desktop mouse hold works (pointer events, not touch-only)
- [x] **AC7**: Card back fallback: img onError swaps to placeholder SVG
- [x] **AC8**: Light haptic vibration on reveal (navigator.vibrate)
- [x] **AC9**: No text baked in card-back.svg (text is code overlay below card)
- [x] **AC10**: Tilt uses CSS `transform` (GPU-accelerated, smooth)
- [x] **AC11**: Refresh mid-game preserved (yourCard still in Phase 2.4 context — Phase 2.5 only changed UI)
- [x] **AC12**: No regression — 46 tests pass, lobby/desk/dealing unchanged

## Design decisions implemented

1. ✅ **Same frame for front & back** — both aspect 0.7, same border style, same shadow style
2. ✅ **Tap-and-hold scope limited to card** — buttons outside card don't trigger reveal
3. ✅ **Card stays flat after transition** — tilt is during transition only (`rotateY(0)` at rest)
4. ✅ **shortAbility on face-up** — 1-liner per role, no scrolling needed in card
5. ✅ **"Xem chi tiết vai trò" button** — opens CardDetailDialog (reused from Phase 2.1) for full info

## Golden Rules compliance

- [x] **Golden Rule 1 (unified scroll):** Not applicable — RevealCard has no scrollable area (intentional, fits on screen)
- [x] **Golden Rule 2 (accurate descriptions):** shortAbility validated for accuracy + ability/wakeTime/notes unchanged from cards.ts (single source of truth)
- [x] **Golden Rule 3 (hooks before early returns):** RevealCard has useState/useRef at top, no early return before hooks

## Manual smoke test plan (after deploy)

1. **Face-down default:**
   - Game starts → see card back (moon emblem) + "Giữ vào card để xem" hint

2. **Tap-and-hold reveal:**
   - Press finger on card → tilt animation → role revealed
   - Lift finger → tilt → face-down again
   - Repeat several times — smooth, no lag

3. **Scope:**
   - Tap on header area (outside card) → no reveal
   - Tap on "Xem chi tiết" button (outside card) → opens dialog, card NOT revealed

4. **Detail dialog:**
   - Tap "Xem chi tiết vai trò" → dialog opens with 3 sections
   - Tap X / backdrop → dialog closes, card stays face-down

5. **Drag-off:**
   - Hold card, drag finger off card area → card flips back face-down (pointerleave)

6. **Desktop:**
   - On laptop with mouse, click and hold on card → reveals, release → hides

7. **Refresh:**
   - Mid-game refresh browser → reconnect → card face-down (yourCard preserved from Phase 2.4)

8. **Privacy when peeking:**
   - Friend looking over shoulder briefly → user lifts finger fast → card hidden in ~140ms

## Card back image (user task)

User generates the actual card back via Gemini using `docs/CARD_BACK_PROMPT.md`. After generating:

1. Optimize: Squoosh.app → resize 400×400 (or similar 1:1) → WebP 85% quality → target ≤33 KB
2. Save as `card-back.webp`
3. Drop into `packages/client/public/cards/`
4. Redeploy — the `<img>` onError fallback chain automatically picks WebP first

Until then, placeholder SVG (forest moon emblem) is used — fully functional, just less polished visual.

## Out of scope (deferred)

- ⏭ End game button → Phase 2.6
- ⏭ Persistent peek count / analytics
- ⏭ Auto-hide after N seconds (rejected in PM intake)

## Verdict

**Phase 2.5 ACCEPTED.** Tap-and-hold mechanism complete. Ready for deploy + smoke test.

## Bundle delta

| | Phase 2.4 | Phase 2.5 | Δ |
|---|---|---|---|
| Tests | 46 | 46 | 0 (no new server logic) |
| JS gzipped | 109 KB | 110 KB | +1 KB |
| New files | — | RevealCard.tsx, card-back.svg | +2 |
| Modified files | — | cards.ts (+shortAbility), PlayingScreen.tsx (rewrite) | 2 |
