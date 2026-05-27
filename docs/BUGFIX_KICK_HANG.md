# Bugfix — Phase 2.3 Kick Hang

> **Reported by user:** "phần desk ổn nhưng lại có bug chỗ mời user ra khỏi phòng, đáng lẽ user bị mời ra khỏi phòng nên bị đá về home, nhưng hiện tại họ lại bị treo"

## Symptom

Host kicks a player → kicked player's screen hangs/freezes instead of showing "Bạn đã bị mời ra khỏi phòng" (KickedScreen).

## Root cause

**React Rules of Hooks violation** in `LobbyScreen.tsx` introduced during Phase 2.3.

When integrating Phase 2.3's deck-size validation, a `useMemo` for `deckSize` was added at line 91 — **after** the early returns that check terminal phases (`joining_error`, `kicked`, `room_closed`) at lines 72-80.

```tsx
// BEFORE FIX
if (phase === 'kicked') return <KickedScreen />;   // early return at line 75
// ...
const deckSize = useMemo(() => ..., [context.roomDesk]);   // hook at line 91
```

### Why this hangs the UI

React tracks hooks by their call order, not by name. When state transitions:

| Phase | Hooks called | Total |
|---|---|---|
| `in_lobby` | 5 useState + 2 useMemo + 1 useEffect + 1 useMemo (deckSize) | **9 hooks** |
| `kicked` (after fix to state) | 5 useState + 2 useMemo + 1 useEffect → early return | **8 hooks** |

On the transition render:
1. Previous render: tracked 9 hooks
2. New render: returns early at `if (phase === 'kicked')` → only 8 hooks called
3. React detects the missing hook → throws "Rendered fewer hooks than expected"
4. Component crashes mid-render → DOM stays at last good state → user sees "hang"

## Fix

Move `deckSize` useMemo **before** all early returns, so hook count stays consistent across all phases.

```tsx
// AFTER FIX
const deckSize = useMemo(() => ..., [context.roomDesk]);   // hook moved up

if (phase === 'kicked') return <KickedScreen />;            // early returns now safe
```

Committed in this session.

## Prevention

Added **Golden Rule 3** to `docs/DESIGN.md`:

> All React hooks (`useState`, `useEffect`, `useMemo`, `useCallback`, custom hooks) MUST be called before any conditional `return null` or early return in a component.

Future Phase 2.4+ work must follow this rule. Recommend configuring ESLint plugin `react-hooks/rules-of-hooks` to catch this automatically.

## Verification

After fix:
- ✅ Type-check clean
- ✅ 36/36 tests still pass
- ✅ Production build succeeds (355 KB JS, 109 KB gzipped — no size change)

## Manual smoke test (do this after redeploy)

1. Host + at least 1 player in lobby
2. Host taps kick icon next to player → confirm dialog
3. Tap "Mời X ra"
4. **Expected:** Kicked player's screen IMMEDIATELY transitions to "Bạn đã bị mời ra khỏi phòng" with "Về màn hình chính" button
5. **Not expected:** Screen frozen, white screen, or stuck on lobby

## Bug pattern lessons

- TypeScript does NOT catch Rules of Hooks violations
- Unit tests cover server reducers but not React component hook order
- This same pattern could affect `room_closed` and `joining_error` transitions too — same fix covers all 3

## Other components to audit

When working in Phase 2.4+, check these for same pattern (hooks after early return):
- ✅ `LobbyScreen.tsx` — fixed
- ⚠️ `RoomDeskEditor.tsx` — has `useMemo` for `grouped` and `teamSubtotal`; no early returns — OK
- ⚠️ `MainDeskScreen.tsx` — same pattern as above — OK
- ⚠️ `CardDetailDialog.tsx` — has early return `if (!card) return null` but no hooks below — OK (no hooks at all)

Recommend running through entire client tree if any new components added with hooks.
