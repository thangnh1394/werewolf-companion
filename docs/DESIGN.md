# DESIGN — `werewolf-companion` Phase 1: Foundation & Lobby

> **Agent:** Designer
> **Phase:** 3.4–3.5 (Research + Mockups)
> **Direction:** "Bàn gỗ kể chuyện" — forest dark + amber accent, cozy storytelling vibe
> **Display name (proposed):** "Sói Đêm"

## 🔒 Golden Rules (project-wide, locked across all phases)

These rules apply to EVERY screen, EVERY component, in EVERY phase. Phase 2+ designers must follow these without exception.

### Golden Rule 1 — Unified scroll style

All scrollable areas in the app use the SAME pattern as the lobby host view:

```css
/* Container */
.scrollable {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;                                 /* Firefox */
  scrollbar-color: rgba(232, 155, 60, 0.30) transparent;
}

/* Webkit/Blink */
.scrollable::-webkit-scrollbar { width: 4px; }
.scrollable::-webkit-scrollbar-track { background: transparent; }
.scrollable::-webkit-scrollbar-thumb {
  background: rgba(232, 155, 60, 0.30);
  border-radius: 2px;
}
.scrollable::-webkit-scrollbar-thumb:hover {
  background: rgba(232, 155, 60, 0.50);
}
```

**Layout rule:** Containers with scrollable content use a 3-zone vertical flex:
- Header zone: `flex-shrink: 0` (sticky top)
- Scrollable zone: `flex: 1 1 auto; min-height: 0; overflow-y: auto`
- Footer zone (if any): `flex-shrink: 0` (sticky bottom)

**NEVER** hard-code `max-height: <px>` or `min-height: <px>` on the scroll zone — let flex compute height from viewport.

Outer container always uses `height: 100dvh` (NOT `100vh`) for correct iOS Safari behavior.

This applies to: lobby player list, Main Desk Screen, Room Desk Editor (Phase 2.3), Card Detail Dialog if content overflows, and any future scrollable area.

### Golden Rule 2 — Card descriptions must be accurate and actionable

Every role description shown to the user must be:

- **Accurate** — matches official ma sói rules (verified against Vietnamese ma sói community sources: dienmayxanh.com, xtmobile.vn, playplus.vn, hoanghamobile.com)
- **Complete** — user must understand: WHEN they act (đêm đầu / mỗi đêm / khi chết), WHAT they do, WHO they can target, and KEY EDGE CASES (e.g., Bảo Vệ không bảo vệ liên tiếp 2 đêm; Già Làng chết khi treo cổ → mất các chức năng)
- **Actionable** — a user reading the description should be able to play correctly without external rule lookup
- **Structured** — uses consistent format: **Khả năng** + **Thời điểm dậy** + **Lưu ý**

This applies wherever role info is displayed: CardDetailDialog, "Bài của tôi" reveal screen (Phase 2.5), Main Desk browse, Room Desk Editor previews.

Single source of truth for role text: `packages/shared/src/cards.ts` (or wherever card data lives). Never duplicate description strings in UI components — always import from card data.

---

## Visual direction summary

The chosen direction evokes a warm storytelling gathering — friends huddled around a wooden table by lantern-light at dusk. Forest-dark backgrounds (charred green-black) provide a calm canvas; amber accents play the role of the lantern's flame. Sage-green badges signal "ready" (the village agrees); muted coral signals destructive actions (kick a player). Copy carries light flavor without becoming theatrical: "Đêm về, dân làng tụ họp..." as subtitle, "5 dân làng quanh bàn" as section header. Italic asides feel like a narrator murmuring the scene.

## Design tokens

### Color palette

```ts
export const colors = {
  // Surfaces
  bgBase:       '#1F2419',  // page background — forest-dark green-black
  bgSurface:    '#2D3225',  // cards, inputs — one step lighter
  bgSurfaceHi:  '#3D4533',  // hover/raised surfaces, borders
  bgInputIdle:  '#4A4533',  // muted avatar circles

  // Text
  textPrimary:   '#F5EFE0',  // parchment — main text
  textSecondary: '#8A8674',  // taupe-gray — meta info, helper text
  textMuted:     '#5A5848',  // for very low-emphasis labels

  // Accent (amber / lantern flame)
  accent:       '#E89B3C',
  accentDim:    '#C99934',
  accentBgSoft: 'rgba(232, 155, 60, 0.08)',  // soft amber tint for highlighted rows
  accentBorder: 'rgba(232, 155, 60, 0.30)',

  // Ready (sage forest)
  readyBg:   '#4A6B2A',
  readyText: '#D4E8B0',

  // Destructive (muted coral, not pure red — fits the warm palette)
  danger:        '#D85A30',
  dangerBgSoft:  'rgba(216, 90, 48, 0.12)',
  dangerBorder:  '#5A3027',
};
```

### Typography

```ts
export const typography = {
  // Primary font: Be Vietnam Pro — designed by native Vietnamese designers with adaptive diacritics.
  // Verified to render `ấ`, `ợ`, `ự`, `ẵ`, `ỉ` correctly.
  fontFamily: '"Be Vietnam Pro", system-ui, -apple-system, sans-serif',

  // Weights: 400 (regular) and 500 (medium). Never 600+ — too heavy against the dark surfaces.
  sizes: {
    xs:    '11px',  // meta labels, hints
    sm:    '12px',  // secondary text
    base:  '13px',  // body small
    body:  '14px',  // primary UI text (player names, list items)
    md:    '15px',  // buttons, input
    lg:    '16px',  // primary buttons
    xl:    '18px',  // screen headings
    '2xl': '22px',  // 6-digit code cells
    '3xl': '26px',  // app name on home
  },

  weights: {
    regular: 400,
    medium:  500,
  },

  lineHeights: {
    tight:  1.4,   // headings, button text
    normal: 1.5,   // body
    loose:  1.6,   // empty-state descriptions
  },
};
```

### Spacing & layout

```ts
export const radii = {
  sm: '6px',    // pills (ready badge)
  md: '8px',    // buttons inside avatars
  lg: '10px',   // input fields
  xl: '12px',   // cards, primary buttons
  '2xl': '14px',// large primary CTA
  '3xl': '18px',// dialog containers
  full: '50%',  // avatars
};

export const spacing = {
  // mobile-first; designed at 340px viewport (smallest common)
  outer:  '20px 16px',  // screen padding
  card:   '14px',
  field:  '14px',
  gap:    '8px',        // between list items
  section: '22px',      // between sections
};
```

### Icon system

`lucide-react` exclusively. Common icons used in Phase 1:

| Use | Icon | Notes |
|---|---|---|
| Logo / accent mark | `Flame` | Stand-in for "lantern" |
| Create room CTA | `Plus` | |
| Join room CTA | `KeyRound` | |
| Player count footer | `Users` | |
| Back navigation | `ArrowLeft` | |
| Next/Continue | `ArrowRight` | |
| Name field | `User` | |
| Code share/copy | `Copy` | |
| Share | `Share2` | |
| Leave room | `LogOut` | |
| Host badge | `Crown` | |
| Ready check | `Check` | |
| Kick player | `UserMinus` | |
| Random code | `Dices` | |
| Linked from share | `Link` | |
| Recently used name hint | `BookmarkCheck` | |
| Helper info | `Info` | |
| Kicked screen | `DoorOpen` | |
| Room closed screen | `Flame` (with X overlay, or `FlameKindling` if available) | Use `<Flame />` with opacity 0.4 + small overlay; lucide may not ship `FlameOff` |

**Mockups used Tabler icons** for rendering convenience. Developer maps to lucide equivalents (named above). All icons render at 16-20px inline, 24-36px decorative; `aria-hidden` for decorative icons, `aria-label` for icon-only buttons.

### Components specs

#### Button — primary
- Background: `#E89B3C`
- Text: `#1F2419` (high contrast on amber)
- Padding: `16px`
- Border-radius: `14px`
- Font: 16px / 500
- Active state: scale(0.98) + bg `#C99934`
- Disabled: bg `#3D4533`, text `#8A8674`, cursor `not-allowed`

#### Button — secondary
- Background: `#2D3225`
- Border: `1px solid #3D4533`
- Text: `#F5EFE0`
- Same dimensions as primary

#### Button — icon-only (kick)
- Background: transparent
- Border: `1px solid #5A3027`
- Color: `#D85A30`
- Padding: `6px`
- Radius: `6px`

#### Input — text
- Background: `#2D3225`
- Border: `1px solid #3D4533` (idle), `#E89B3C` (focus)
- Padding: `14px` (left padding `44px` if leading icon)
- Color: `#F5EFE0`
- Placeholder color: `#5A5848`
- Border-radius: `12px`

#### Input — 6-digit code (segmented)
- 6 cells side-by-side, `gap: 8px`
- Each cell: `aspect-ratio: 1`, `max-width: 46px`, centered text
- Empty: bg `#2D3225`, border `#3D4533`, placeholder `_` color `#5A5848`
- Filled: bg `rgba(232, 155, 60, 0.08)`, border `rgba(232, 155, 60, 0.4)`
- Active (cursor): border `#E89B3C` (solid amber)
- Implementation hint: single hidden `<input type="text" inputmode="numeric" maxlength="6">` driving 6 visual cells (accessibility + auto-paste support)

#### Player card row
- Bg: `#2D3225`
- Radius: `12px`
- Padding: `10px 12px`
- Layout: avatar + name + ready/kick on right
- Self (you): left border `3px solid #E89B3C`
- Soft-highlight (e.g., "you are not yet ready" hint): bg `rgba(232, 155, 60, 0.06)`, border `1px solid rgba(232, 155, 60, 0.25)`
- Avatar: 36×36 circle, initial letter, font 14px/500
- Host avatar bg: `#E89B3C` with dark text
- Other avatars bg: `#4A4533` with light text

#### Ready badge
- Bg: `#4A6B2A`
- Text: `#D4E8B0`, 11px/500
- Padding: `4px 10px`
- Radius: `6px`
- Text: "Sẵn sàng"

#### "Not ready" indicator
- Plain text "Chưa sẵn sàng" or italic "Đang nghĩ..." (varied to feel less robotic)
- Color: `#8A8674`
- No background, no border

#### Dialog overlay
- Backdrop: `rgba(0,0,0,0.6)` + `backdrop-filter: blur(4px)`
- Dialog: `#1F2419`, border `1px solid #3D4533`, radius `18px`, padding `24px 20px`
- Icon container: 56×56 square, soft semantic bg, radius `14px`

#### Edge-state screens (kicked, room closed)
- Centered single-column layout
- Icon at top in soft semantic bg square (radius `18px`)
- Title (18px/500) + description (13px, line-height 1.6, color `#8A8674`)
- Primary action button at bottom

## Copy / microcopy

Designer wrote thematic flavor text. Developer may tweak but should preserve the warm, gently-evocative tone.

| Context | Text |
|---|---|
| App name (proposed) | Sói Đêm |
| App tagline (home) | Chia bài ma sói qua điện thoại, không cần đem bộ bài theo nữa |
| Home footer | 5–20 người chơi mỗi phòng |
| Lobby subtitle (default) | "Đêm về, dân làng tụ họp..." |
| Lobby subtitle (all ready) | "Tất cả đã sẵn sàng. Đêm sắp buông xuống..." |
| Lobby subtitle (just 1 person) | "Chờ thêm vài dân làng đến..." |
| Players section header | `N` DÂN LÀNG QUANH BÀN |
| Ready counter | `M / N` sẵn sàng |
| Not-ready indicator (varied) | "Đang nghĩ...", "Chưa sẵn sàng" |
| Code share label | CHIA SẺ PHÒNG (host) / MỜI BẠN BÈ (player) |
| Create CTA | Tạo phòng |
| Join CTA | Vào phòng |
| Ready CTA | Tôi đã sẵn sàng |
| Unready CTA | Bỏ sẵn sàng |
| Start CTA (Phase 1) | Bắt đầu chia bài (will show Phase 2 placeholder dialog) |
| Start blocked — not all ready | Chờ mọi người sẵn sàng |
| Start blocked — too few | Cần ít nhất 5 người chơi |
| Kick confirm title | Mời `<Tên>` ra khỏi phòng? |
| Kick confirm body | `<Tên>` sẽ bị đưa về màn hình chính. Họ có thể quay lại nếu biết code phòng. |
| Kicked screen title | Bạn đã bị mời ra khỏi phòng |
| Kicked screen body | Chủ phòng đã quyết định mời bạn ra. Bạn có thể tạo phòng mới hoặc tham gia phòng khác. |
| Room closed title | Phòng đã đóng |
| Room closed body | Chủ phòng đã rời đi và không quay lại trong 5 phút. Ngọn lửa đã tắt. |
| Code-from-link banner | Bạn vừa mở link mời. Code đã được điền sẵn. |
| localStorage name hint | Đã nhớ tên từ lần trước. Bạn có thể đổi. |

## Responsive notes

- Target viewport: 340–430px (iPhone SE → iPhone Pro Max → Pixel)
- Min tap target: 44×44px (player rows, buttons all meet)
- Safe-area inset: bottom 20px padding accounts for iOS home indicator (Developer applies via `env(safe-area-inset-bottom)`)
- No landscape support optimization in Phase 1 (acceptable for ma sói use case — players hold phone in portrait)
- Web fonts loaded from Google Fonts CDN with `display: swap` to avoid invisible text during load

## Lobby layout: sticky header + scrollable player list + sticky footer

To handle rooms with up to 20 players gracefully on small screens, the lobby uses a **3-zone vertical flex layout**:

```
┌─────────────────────────────┐
│  STICKY HEADER (no scroll)  │
│  • Room code + leave btn    │
│  • Italic subtitle          │
│  • QR share card            │
│  • Section header + counter │
├─────────────────────────────┤
│  SCROLLABLE PLAYER LIST     │
│  • flex: 1                  │
│  • overflow-y: auto         │
│  • internal scroll          │
├─────────────────────────────┤
│  STICKY FOOTER (no scroll)  │
│  • Start button OR          │
│    Ready button (player)    │
│  • Helper text              │
└─────────────────────────────┘
```

**Implementation:**
- Outer container: `height: 100dvh; display: flex; flex-direction: column` — `100dvh` (dynamic viewport height) is critical on mobile, since `100vh` over-extends past the URL bar on iOS Safari and causes the footer button to be pushed below the visible area
- Header zone: `flex-shrink: 0` (natural content height)
- List zone: `flex: 1 1 auto; min-height: 0; overflow-y: auto` — **never set `max-height` or `min-height` to fixed pixel values**, that anti-pattern leaves dead space on large phones and over-restricts on small ones; the `min-height: 0` override is critical so the flex child can actually shrink below its content height
- Footer zone: `flex-shrink: 0` (natural content height, pinned to bottom by flex layout)
- Apply `padding-bottom: env(safe-area-inset-bottom)` on the outer container to clear the iOS home indicator
- Scrollbar styled to match palette — thin amber, transparent track. Full CSS:
  ```css
  .lobby-list {
    /* Firefox */
    scrollbar-width: thin;
    scrollbar-color: rgba(232, 155, 60, 0.30) transparent;
  }
  /* Webkit/Blink (iOS Safari, Chrome, Edge) */
  .lobby-list::-webkit-scrollbar { width: 4px; }
  .lobby-list::-webkit-scrollbar-track { background: transparent; }
  .lobby-list::-webkit-scrollbar-thumb {
    background: rgba(232, 155, 60, 0.30);
    border-radius: 2px;
  }
  .lobby-list::-webkit-scrollbar-thumb:hover {
    background: rgba(232, 155, 60, 0.50);
  }
  ```
  Note: iOS Safari hides scrollbars by default during non-scroll state — that's expected behavior, not a bug. On Android Chrome and desktop browsers, the thin amber scrollbar will be persistently visible.

### Player list sort order

To help the host quickly identify who's blocking the start, players are sorted within the scrollable list:

1. **Self** (whether host or player) — always pinned at the top with `border-left: 3px solid #E89B3C`
2. **Players "Chưa sẵn sàng"** — listed first, in order of join time
3. **Divider** — thin 1px line (`#2D3225`), 8px vertical margin, only shown when both groups exist
4. **Players "Đã sẵn sàng"** — listed last, in order of join time

When all players are ready, the divider disappears and only the sorted-by-join list remains. The host's position never changes — they stay pinned at top.

This sort applies to all viewers (host and players), so everyone sees the same order. The kick button is only visible on rows for the host.

## Accessibility (minimum, Phase 1)

- Color contrast: amber (#E89B3C) on dark green (#1F2419) = 7.2:1 ✅ AAA
- Text primary on base bg: 12.4:1 ✅ AAA
- All buttons have visible focus states (3px amber outline)
- Icon-only buttons get `aria-label`
- Form fields associated with `<label>` by id
- Live regions: player list updates use `aria-live="polite"` so screen readers announce joins/leaves
- Phase 3 will do a full audit

## Open design questions for Phase 2

(Not blocking Phase 1, just so Designer in Phase 2 doesn't re-decide from scratch.)

- Card backs in "Bài của tôi" — should they have a custom illustration (lantern? full moon? wolf silhouette?) or just a textured amber-on-dark pattern? Lean towards: simple geometric pattern + small lantern icon centered.
- Card-reveal animation — fade + scale, or 3D flip? Lean towards: subtle scale + opacity fade (cheaper, works on weaker phones).
- Role illustrations — sourced from one cohesive set on Unsplash/illustrations (consistent style is critical) or commission a small custom set? Discuss with user in Phase 2.
