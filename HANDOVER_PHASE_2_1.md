# Handover — Werewolf Companion Phase 2.1

> Phase 2.1 (Card Foundation) đã build xong trong session này. Doc này tổng hợp những gì đã làm + hướng dẫn user deploy + bàn giao cho session tiếp theo (Phase 2.2 hoặc tiếp tục Phase 2.3+).

---

## Trạng thái sau Phase 2.1

| Item | Status |
|---|---|
| Code | ✅ Type-check clean, 25/25 tests pass, production build OK |
| Bundle size | 343 KB JS (106 KB gzipped) — +6 KB so với Phase 1 |
| Images | ⏳ Placeholder SVGs (64 KB total) — chờ user replace bằng Pexels WebP |
| Deploy | ⏳ Chờ user push lên GitHub + redeploy Cloudflare Pages |

## Những thay đổi so với baseline Phase 1

### New files (10 files)

```
docs/
├── PHASE_2_DECISIONS.md       Lock 15 roles + golden rules + Phase 2 plan
├── BRIEF_PHASE_2_1.md         Scope của Phase 2.1
├── IMAGE_SOURCING_BRIEF.md    Guide tìm + optimize 15 ảnh Pexels
└── ACCEPTANCE_PHASE_2_1.md    PO checklist (10 AC)

packages/shared/src/
└── cards.ts                   Card type + 15 role data + TEAM_INFO

packages/client/public/cards/  (NEW folder, 15 placeholder SVGs)
├── werewolf.svg
├── ... (15 cards)
└── thief.svg

packages/client/src/components/cards/  (NEW folder)
├── CardCell.tsx               Thumbnail in 3-col grid
├── TeamSection.tsx            Section header + grid wrapper
├── TeamExplainDialog.tsx      Team info popup
├── CardDetailDialog.tsx       Tap card → full info (sticky head + scrollable body)
└── MainDeskScreen.tsx         Full-screen overlay listing all 15 cards

packages/client/src/components/home/
└── AboutScreen.tsx            Credits page accessible từ home footer
```

### Modified files (8 files)

```
.gitignore                     Add *.tsbuildinfo, vite.config.js auto-gen
docs/DESIGN.md                 ADD Golden Rules section at top
packages/server/package.json   REMOVE dead partyserver dep
packages/shared/src/index.ts   Export cards from barrel
packages/client/src/index.css  Add --color-solo for Trung Lập lavender
packages/client/src/App.tsx    Add /about route
packages/client/src/components/home/HomeScreen.tsx     Footer link to /about
packages/client/src/components/lobby/LobbyScreen.tsx   Spade icon → MainDeskScreen
```

## Tính năng đã build

### 1. Main Desk Screen
- Truy cập: Lobby → tap Spade icon trên header (cạnh logout)
- 15 cards grouped by team (Sói / Dân / Trung Lập)
- Grid 3 cột, scrollable theo Golden Rule 1 (4px amber scrollbar, flex layout)
- Tap card → CardDetailDialog
- Tap info icon mỗi team → TeamExplainDialog

### 2. Card Detail Dialog
- Sticky head: close button + large image + name + team badge (màu theo phe)
- Scrollable body: 3 sections "Khả năng / Thời điểm dậy / Lưu ý"
- "Lưu ý" có amber-tinted background + warning icon (highlight quan trọng)
- Photographer credit ở cuối (hiển thị khi có)

### 3. Team Explain Dialog
- Icon emoji + label + "Phe thiểu số/đa số/Mục tiêu riêng"
- "MỤC TIÊU" + "ĐIỀU KIỆN THẮNG"
- Button "Đã hiểu" để close

### 4. About / Credits Screen
- Truy cập: Home → footer "Giới thiệu · Tín dụng ảnh"
- 3 sections: project info / Pexels credits / nguồn tham khảo
- Heart icon footer

### 5. "PHỔ BIẾN" badge
- 5 roles: Sói Thường, Dân Làng, Tiên Tri, Bảo Vệ, Phù Thủy
- Top-right corner card cell
- Mục đích: guide newbie host chọn nhanh

## 🎨 Golden Rules locked (project-wide)

### Golden Rule 1 — Unified scroll style
Mọi scroll dùng cùng pattern như lobby host view:
- Class `.scrollable` (4px amber scrollbar)
- `flex: 1 1 auto; min-height: 0; overflow-y: auto`
- KHÔNG hard-code max-height
- Outer container `height: 100dvh`

Đã áp dụng: lobby player list, MainDeskScreen body, CardDetailDialog body, AboutScreen body.

### Golden Rule 2 — Accurate card descriptions
3-part format mandatory: **Khả năng** / **Thời điểm dậy** / **Lưu ý**
Mỗi card đã được rewrite từ research (4+ nguồn ma sói VN).

## 📝 Việc user cần làm để deploy

### Bước 1: Pull code session này về máy

Session đã work trên top of latest commit (`056eccd` — session 1 handover). User cần:

```bash
cd ~/projects/werewolf-companion
git pull origin main   # Pull latest từ Phase 1
# Sau đó merge code Phase 2.1 từ session này (download zip hoặc Claude Code apply patch)
```

### Bước 2: Pick ảnh Pexels (~30-45 phút)

Mở `docs/IMAGE_SOURCING_BRIEF.md` → có brief đầy đủ cho 15 cards với:
- Primary query
- Visual direction
- Fallback queries
- Mood keywords

Quy trình:
1. Vào pexels.com, paste query, pick ảnh tốt nhất match theme "Bàn gỗ kể chuyện"
2. Download tất cả vào 1 folder (e.g. `~/Downloads/werewolf-images/`)
3. Optimize: Squoosh.app → resize 400×400 → WebP 85% quality (target ≤33 KB)
4. Rename theo role ID: `werewolf.webp`, `seer.webp`, v.v.
5. Move vào `packages/client/public/cards/` (replace placeholder `.svg`)

### Bước 3: Update `cards.ts`

Edit `packages/shared/src/cards.ts` cho TỪNG card:
- Đổi `imageUrl: '/cards/<id>.svg'` → `'/cards/<id>.webp'`
- Add `photographer: 'Tên Photographer'`
- Add `photoUrl: 'https://www.pexels.com/photo/...'`

→ Tip: Có thể dùng Claude Code:

```
"Trong cards.ts, đổi tất cả imageUrl từ .svg sang .webp.
Sau đó tôi sẽ paste từng photographer + photoUrl cho bạn fill vào."
```

### Bước 4: Delete placeholder SVGs (optional)

```bash
cd packages/client/public/cards
rm *.svg
# Verify: chỉ còn .webp files
ls
```

### Bước 5: Verify local

```bash
npm install
npm run type-check        # phải clean
npm test                  # phải pass 25/25
npm run build --workspace=@werewolf/client   # phải build OK
```

### Bước 6: Deploy

```bash
# Commit + push
git add .
git commit -m "Phase 2.1 — Card Foundation"
git push origin main

# Deploy client (server unchanged, không cần redeploy)
cd packages/client
$env:VITE_PARTYKIT_HOST = "werewolf-companion.thangnh1394.partykit.dev"
npm run build
npx wrangler pages deploy dist --project-name=werewolf-client
```

### Bước 7: Test trên điện thoại

Trong lobby:
1. Tap Spade icon (top-right) → Main Desk mở
2. Browse 3 sections (Sói/Dân/Trung Lập)
3. Tap info icon mỗi phe → team explain dialog
4. Tap card bất kỳ → detail dialog có 3 sections
5. Đóng Main Desk → quay về lobby, player list intact

## ⚠️ Risk + edge cases noted

1. **iOS Safari 14+ supports WebP** — không cần fallback PNG/JPEG. Nếu support old iOS Safari (< 14), revert lại JPEG.
2. **Image loading: lazy by default** — `loading="lazy"` trên tất cả `<img>`. Khi user scroll xuống team Dân Làng + Trung Lập, ảnh mới load. First open Main Desk chỉ tải 4 ảnh team Sói.
3. **Photographer credit hiển thị conditional** — chỉ show khi `card.photographer` có giá trị. Hiện tại đa số chưa có → khi user fill xong sẽ hiển thị tự động.
4. **CardDetailDialog max-height: calc(100dvh - 80px)** — chỉ áp ở dialog (vì có overlay backdrop). Body bên trong vẫn dùng `.scrollable` chuẩn.

## 🎯 Phase tiếp theo

### Phase 2.2 — chưa triển khai
Đây là sub-phase tiếp theo theo `PHASE_2_DECISIONS.md`:

**Scope:** Room Desk display trong Lobby — host nhìn thấy "Room desk hiện tại" (preview list cards đã chọn), nhưng CHƯA có editor. Tương tự read-only như Main Desk nhưng filter theo room desk state.

→ Nếu skip 2.2, có thể đi thẳng Phase 2.3 (Room Desk Editor) — tích hợp display + edit cùng lúc.

### Phase 2.3 — Room Desk Editor (host UI)
Add/remove/duplicate cards, validation count, save to server state.

### Phase 2.4 — Card Dealing Logic
Server shuffle + private channels (`YOUR_CARD`) + lock room + refresh restore.

### Phase 2.5 — "Bài của tôi" Screen
Tap-and-hold reveal animation.

### Phase 2.6 — End Game Flow
Host end game button → transition về lobby + persist room desk.

## Prompt gợi ý cho session mới (Phase 2.2 hoặc 2.3)

```
Tôi đang tiếp tục project werewolf-companion sau khi hoàn thành Phase 2.1.

Đọc các file sau để nắm context:
- docs/PHASE_2_DECISIONS.md — toàn bộ quyết định Phase 2
- docs/ACCEPTANCE_PHASE_2_1.md — những gì Phase 2.1 đã ship
- docs/DESIGN.md — Golden Rules đã lock (đặc biệt 2 rules ở top)

Foundation hiện tại:
- packages/shared/cards.ts có 15 cards với full descriptions
- packages/client/components/cards/* có 5 components (CardCell, TeamSection, TeamExplainDialog, CardDetailDialog, MainDeskScreen)
- Lobby đã có Spade button mở Main Desk

Bắt đầu Phase 2.3: Room Desk Editor.
```
