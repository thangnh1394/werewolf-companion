# BRIEF — Phase 2.5: "Bài của tôi" Tap-and-Hold Reveal

> **Agent:** Product Manager
> **Sub-phase:** 2.5
> **Module:** Replace plain PlayingScreen with tap-and-hold card reveal
> **Parent decisions:** see `PHASE_2_DECISIONS.md`
> **Builds on:** Phase 2.4 dealing (yourCard already in context + PlayingScreen exists)

## Tool

Phase 2.5 makes the dealt card SECRET by default. Instead of showing the role plainly (Phase 2.4 placeholder), the card shows face-down. The player presses and HOLDS to reveal their role; releasing flips it back face-down immediately. This prevents over-the-shoulder peeking when friends are sitting together.

## Users

Every player in a playing game (including host) — each privately reveals their own role.

## Problem solved

Phase 2.4 dealt cards but showed them plainly — risky when everyone's in the same room. Phase 2.5 adds the physical-card secrecy: only you, holding your phone close, briefly peek at your role. Let go and it's hidden again.

## Primary user journey

1. Game starts (Phase 2.4 dealt the cards). Player's screen shows a face-DOWN card.
2. Face-down state shows: the card back image + text "Giữ để xem vai của bạn".
3. Player **presses and holds** the card.
4. Card flips (3D rotateY animation ~400ms) to reveal the role: image, name, team, ability, wake time, notes.
5. Player **releases** → card immediately flips back face-down.
6. Repeat as needed.

## Decisions locked (from PM intake)

1. ✅ **Interaction:** Pure hold — release = flip back immediately (safest, matches Phase 0 anti-peek intent)
2. ✅ **Card back:** User generates via Gemini (prompt in `docs/CARD_BACK_PROMPT.md`); placeholder SVG until ready; NO text in image (text overlaid by code)
3. ✅ **Animation:** Subtle tilt/skew flip — KHÔNG cần full 3D rotateY. Chỉ cần hiệu ứng lật xéo nhẹ tạo cảm giác lật bài thật khi hold → reveal và release → hide. Ưu tiên mượt + đơn giản, tránh jank.

## In scope (Phase 2.5 deliverable)

- **Rewrite `PlayingScreen.tsx`:** face-down by default, press-and-hold to reveal
- **New component:** `RevealCard.tsx` — the 3D-flip card with front (role) + back (card back)
- **Tilt flip animation:** subtle CSS `transform` (slight rotateY ~15-25deg + scale during transition, settling flat) — gives a "card flipping" feel without a full 180° 3D spin. Quick (~250-350ms), GPU-accelerated, smooth on all devices.
- **Press-and-hold:** `pointerdown` → reveal, `pointerup`/`pointercancel`/`pointerleave` → hide; suppress contextmenu/text-select (reuse Phase 2.3 CardCellWithCounter pattern)
- **Card back asset:** reference `/cards/card-back.webp`; placeholder SVG fallback
- **Face-down UI:** card back image + "Giữ để xem vai của bạn" hint + lock/eye icon
- **Face-up UI:** full role info (reuse the card layout from Phase 2.4 PlayingScreen — image, team badge, name, Khả năng/Thời điểm dậy/Lưu ý)
- **Hold hint:** subtle pulse or instruction so first-time users know to hold
- **Haptic:** light vibration on reveal (if supported), like Phase 2.3

## Out of scope (NOT in Phase 2.5)

- ⏭ End game / return to lobby → Phase 2.6
- ⏠ Re-deal
- ⏭ Timer showing how long you've held
- ⏭ "Peek count" / analytics

## Acceptance criteria

1. Given the game is playing, then the player's card shows FACE-DOWN by default (card back + "Giữ để xem vai của bạn").
2. Given a face-down card, when the player presses and holds, then the card flips with a subtle tilt animation to reveal their role within ~300ms.
3. Given a revealed card, when the player releases, then the card flips back face-down immediately.
4. Given the card is revealed, then it shows the correct role image, name, team, ability, wake time, and notes (from cards.ts).
5. Given the player drags their finger off the card while holding, then the card flips back (pointerleave/cancel handled).
6. Given a desktop user, when they hold mouse button down, then reveal works (pointer events, not touch-only).
7. Given the card back image is missing, then a placeholder SVG card back shows (app doesn't break).
8. Given the player holds, then a light haptic vibration fires (if device supports).
9. Given no text appears baked into the card back image (text is a code overlay).
10. Given the tilt flip, then it performs smoothly on mobile (no jank — uses GPU transform).
11. Given a player refreshes mid-game, then they still see their face-down card (yourCard restored from Phase 2.4).
12. No regression: 46 tests pass + dealing/lobby/desk flows unchanged.

## Constraints

- **Anti-peek:** release MUST hide immediately — no lingering reveal
- **Performance:** 3D flip uses `transform` + `will-change` for GPU acceleration; test on mid-range mobile
- **Privacy preserved:** card data already private from Phase 2.4 (no server change needed in 2.5 — this is pure client UI)
- **Bundle:** ~+2 KB gzipped
- **No server changes:** Phase 2.5 is client-only (yourCard already delivered in 2.4)

## Success signal

When a player in a room of friends presses their phone, glances at "Sói Thường" for a second, lifts their thumb, and the card snaps back to a mysterious face-down back — and the person next to them saw nothing — that's the Phase 2.5 win.

## Implementation order

1. **Designer mockup** — face-down state + face-up state + flip
2. **Developer** — RevealCard component + rewrite PlayingScreen + card back placeholder
3. **QA** — type-check + build + interaction testing notes (manual, since it's gesture-based)
4. **PO** — accept against 12 criteria
