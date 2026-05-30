# Acceptance — Phase 3.2 (QR Expand) + Phase 3.3 (Profile + Avatars)

> Shipped together in one package per user request.
> **Status:** ✅ READY FOR USER REVIEW

## Phase 3.2 — QR Expand on Tap

### Changes
- `ShareRoom.tsx`: QR thumbnail is now a button → opens Dialog with large QR (260×320px responsive via `min(70vw, 320px)`)
- Dialog includes: large QR, room code spelled out with letter-spacing, "Để người chơi khác quét bằng camera" hint
- Backward-safe: small QR still visible inline; users who don't tap don't notice the addition

### Acceptance
- [x] Tap QR thumbnail → Dialog opens with enlarged QR
- [x] QR scales responsively (≤70vw, capped at 320px for tablets)
- [x] Room code shown below QR (`XXX XXX` formatted)
- [x] Close button + backdrop dismissal both work
- [x] Original small QR + Copy button unchanged

---

## Phase 3.3 — Profile Editor + 20-Avatar Set

### New assets
- 20 Kahoot-style flat vector character avatars, 256×256 WebP each (~5-9 KB)
- Total avatar bundle: 111 KB for all 20
- Saved to `packages/client/public/avatars/avatar_XX_<name>.webp`
- Categories: characters (8), animals (6), others (6)

### New code
- `packages/shared/src/avatars.ts` — AVATARS catalog, AvatarOption type, findAvatar() helper, CATEGORY_LABELS
- `packages/client/src/components/profile/AvatarPicker.tsx` — grouped grid picker with selection state
- `packages/client/src/components/profile/ProfileDialog.tsx` — full profile editor (name + avatar with preview)
- `packages/client/src/lib/storage.ts` — `getSavedAvatarId()` / `saveAvatarId()`
- `packages/shared/src/constants.ts` — `STORAGE_KEYS.avatarId` added
- `packages/client/src/components/ui/Avatar.tsx` — extended to render WebP avatar when `avatarId` provided, falls back to initial letter for legacy

### Schema changes (backward compat)
- `PublicPlayer.avatarId?: string` (optional — pre-3.3 rooms persist OK)
- `JoinMessage.avatarId?: string` (optional)
- Server `addPlayer` accepts `avatarId`, stores on PublicPlayer

### UX flow
1. New user opens app → no profile icon in HomeScreen (per spec: "nếu đã có lịch sử")
2. User types name in CreateRoom/JoinRoom → saved to localStorage → has history
3. Next visit to HomeScreen → profile icon appears top-right showing saved avatar
4. Tap icon → ProfileDialog opens → can change name + avatar
5. Save → localStorage updated → applies to subsequent room joins
6. In lobby, PlayerRow shows each player's avatar instead of initial

### Acceptance
- [x] New user: no profile icon shown
- [x] After saving name once: profile icon appears top-right with current avatar
- [x] Profile icon tap → ProfileDialog opens with current name + avatar pre-filled
- [x] Avatar picker shows all 20 grouped by category (Nhân vật / Động vật / Khác)
- [x] Selecting an avatar shows orange ring + checkmark
- [x] Preview header updates as user types name / picks avatar
- [x] Save button disabled until name valid (2-20 chars) AND something changed
- [x] CreateRoom/JoinRoom pass avatarId via navigate state
- [x] JOIN message includes avatarId
- [x] Server stores avatarId on PublicPlayer
- [x] PlayerRow renders avatar image instead of initial (when avatarId set)
- [x] Backward compat: old rooms without avatarId render initial letter (no break)

### Backward compatibility verified
- `PublicPlayer.avatarId?` (optional Zod field)
- `JoinMessage.avatarId?` (optional)
- Avatar component renders initial when `avatarId` undefined
- Serialize/deserialize: serialization of PublicPlayer Map round-trips with or without avatarId
- Tests still pass (52/52) — no test updates needed since avatarId is optional

---

## Combined verification

- [x] Type-check clean (3 packages)
- [x] Tests: 52/52 pass (no regression)
- [x] Production build: 372 KB JS / 112.5 KB gzipped (+1.9 KB from Phase 3.1)
- [x] Public assets: 20 avatars copied to dist/avatars (111 KB)
- [x] All 15 cards + card-back + avatars total assets: ~440 KB (well within budget)

## Smoke test plan

### Phase 3.2 (QR)
1. Create room or join existing → see "CHIA SẺ PHÒNG" / "MỜI BẠN BÈ" card
2. Tap small QR thumbnail → Dialog opens with big QR
3. Open another phone's camera → scan big QR → should navigate to join URL
4. Tap close (X or backdrop) → dialog closes, room state preserved

### Phase 3.3 (Profile)
1. First visit (clear localStorage): No profile icon top-right
2. Create or join room with a name → name saved
3. Go back to home → profile icon now visible top-right with default wolf avatar + "Chào, <name>" chip
4. Tap icon → ProfileDialog opens
5. Edit name + pick different avatar → preview updates → Save
6. Reopen dialog → confirms new selection persisted
7. Create new room → other players see your avatar in their PlayerRow
8. Old player without avatarId (from before deploy): renders initial letter as fallback

## Bundle delta

| | Phase 3.1 | Phase 3.2 + 3.3 | Δ |
|---|---|---|---|
| Tests | 52 | 52 | 0 |
| JS gzipped | 110.6 KB | 112.5 KB | +1.9 KB |
| Public images | 392 KB (cards) | 503 KB | +111 KB (20 avatars) |
| New files | — | avatars.ts, AvatarPicker, ProfileDialog, 20× webp | +23 |

## Out of scope (deferred)

- ⏭ Live profile updates mid-session (current: must leave + rejoin to propagate)
- ⏭ Custom uploaded avatars (only the 20 preset)
- ⏭ Avatar editing during playing phase (locked to lobby; players can't change mid-game)

## Verdict

**Phase 3.2 + 3.3 ACCEPTED.** Quick wins of Phase 3 shipped. Phase 4 (GM Mode cluster) ready when user decides to start.
