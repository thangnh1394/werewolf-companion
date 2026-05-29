# Handover — Werewolf Companion Phase 2.5

> Phase 2.5 (Tap-and-hold reveal) đã build xong. Doc này tổng hợp + hướng dẫn deploy.

## Trạng thái sau Phase 2.5

| Item | Status |
|---|---|
| Code | ✅ Type-check clean, 46/46 tests pass, build OK |
| Bundle | 363 KB JS (110 KB gzipped) — +1 KB so với Phase 2.4 |
| Card back asset | ⏳ Placeholder SVG, chờ Gemini WebP từ user |
| Deploy | GitHub Actions auto-deploy on push to main |

## Decisions locked (từ PM intake)

1. ✅ **Pure hold** — thả tay = úp ngay (anti-peek tối đa)
2. ✅ **Card back qua Gemini** — user generate ảnh, code có fallback SVG
3. ✅ **Tilt animation** (KHÔNG full 3D) — lật xéo nhẹ chỉ TRONG transition, sau đó card phẳng

## User feedback adjustments (in-session)

User chỉnh thêm:
- ✅ Card up/down **cùng size + cùng format** (aspect 0.7, cùng border)
- ✅ Tilt chỉ là transition animation, card phẳng khi settled
- ✅ Vùng tap-and-hold **giới hạn trong card** (không phải full screen)
- ✅ Card hiển thị ngắn gọn (ảnh + tên + short ability) → "Xem chi tiết" button mở dialog đầy đủ

## Những thay đổi so với baseline Phase 2.4

### New files (4)

```
docs/
├── BRIEF_PHASE_2_5.md
├── CARD_BACK_PROMPT.md      Gemini prompt cho user generate card back
└── ACCEPTANCE_PHASE_2_5.md

packages/client/public/cards/
└── card-back.svg            Placeholder card back (forest moon emblem)

packages/client/src/components/game/
└── RevealCard.tsx           Tap-and-hold reveal card với tilt animation
```

### Modified files (2)

```
packages/shared/src/cards.ts
  + shortAbility field in CardSchema (≤12 words)
  + shortAbility added to all 15 cards

packages/client/src/components/game/PlayingScreen.tsx
  REWROTE: face-down default, RevealCard + detail button
  Now reuses CardDetailDialog from Phase 2.1 for full info
```

## Cách hoạt động

### Reveal flow

1. Game start → PlayingScreen render với RevealCard mặt úp (card back SVG/WebP)
2. User press-and-hold trong card → `onPointerDown`
3. State `animating = true` → CSS transform `rotateY(85deg)` chạy 140ms
4. Mid-animation: swap `revealed = true` → render face content
5. Animation reverse 140ms về `rotateY(0)` → card phẳng, hiện đầy đủ
6. User thả tay → `onPointerUp`/`onPointerCancel`/`onPointerLeave`
7. State `animating = true` → tilt → swap `revealed = false` → settle phẳng (face-down)

### Tap-and-hold scope

Handler gắn vào `<div>` card → CHỈ tap trong card mới trigger reveal. Ngoài card (header, "Xem chi tiết" button) bấm thoải mái, không ảnh hưởng.

### Pointer events

- `pointerdown` → reveal (haptic vibrate)
- `pointerup` / `pointercancel` / `pointerleave` → hide
- `setPointerCapture` để giữ event khi ngón tay drift nhẹ
- `preventDefault` trên `contextmenu` để chống iOS 3D-touch + chuột phải
- `touchAction: 'none'` + `userSelect: 'none'` để chống select text/zoom

### Card back asset chain

```
1. <img src="/cards/card-back.webp">    Primary (user uploads sau khi Gemini generate)
2. onError → swap to /cards/card-back.svg    Fallback placeholder (đã include)
```

App chạy bình thường ngay khi deploy, kể cả khi chưa có WebP. Khi user generate xong + drop file vào public, redeploy → WebP tự động được dùng.

## 📝 Việc user cần làm

### Optional (improve visual): Generate card back

1. Mở `docs/CARD_BACK_PROMPT.md`
2. Paste prompt vào Gemini → generate 3-4 variations
3. Pick cái đẹp nhất
4. Optimize: Squoosh.app → 400×400 WebP 85% (target ≤33 KB)
5. Save as `card-back.webp` → drop vào `packages/client/public/cards/`
6. Commit + push → auto-deploy → card back đẹp tự động xuất hiện

### Required: Deploy Phase 2.5 code

```bash
cd ~/projects/werewolf-companion
# Pull/merge code Phase 2.5
npm install
npm run type-check     # clean
npm test               # 46/46

git add .
git commit -m "Phase 2.5 — Tap-and-hold reveal"
git push origin main   # GitHub Actions auto-deploys
```

## Smoke test priorities

1. **Face-down default:** Game start → card úp, không thấy role
2. **Tap-and-hold:** Press + hold → tilt → card mở, hiện ảnh + tên + short ability
3. **Release:** Thả tay → tilt → card úp ngay
4. **Scope:** Tap header / Xem chi tiết button → không lật card
5. **Detail dialog:** Tap "Xem chi tiết vai trò" → CardDetailDialog mở với 3 mục đầy đủ
6. **Drag-off:** Hold card → drag ngón tay ra ngoài card → flip về úp (pointerleave)
7. **Desktop:** Mouse click + hold → work
8. **Refresh:** Refresh giữa ván → vẫn face-down, hold lại reveal đúng role cũ

## ⚠️ Lưu ý

- **Vẫn chưa có nút End Game** — Phase 2.6 sẽ thêm. Tạm thời để về lobby: host LogOut (đóng phòng).
- **Card back placeholder** sẽ trông đơn giản hơn ảnh Gemini sau cùng — UX hoạt động đầy đủ.

## 🎯 Phase tiếp theo

### Phase 2.6 — End Game Flow (LAST sub-phase of Phase 2)

**Scope:**
- Host thấy nút "Kết thúc trận" trên PlayingScreen
- Tap → transition `phase: 'playing' → 'lobby'`
- Clear `assignments` (server)
- **GIỮ** `roomDesk` (để ván sau dùng lại — Phase 0 decision)
- Reset ready states về false (mọi người phải ready lại)
- Broadcast `GAME_ENDED` event
- Client transition về LobbyScreen

**Sau Phase 2.6 = Phase 2 hoàn tất.**

## Prompt cho session mới (Phase 2.6)

```
Tiếp tục werewolf-companion sau Phase 2.5.
Sync github: https://github.com/thangnh1394/werewolf-companion
Đọc: HANDOVER_PHASE_2_5.md, docs/ACCEPTANCE_PHASE_2_5.md, docs/PHASE_2_DECISIONS.md

Foundation:
- Tap-and-hold reveal hoàn chỉnh (RevealCard + PlayingScreen)
- 46 tests pass
- Phase 2.4 dealing + assignments hoạt động

Bắt đầu Phase 2.6: End Game Flow (sub-phase cuối của Phase 2).
```
