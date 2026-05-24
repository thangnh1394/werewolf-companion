# HANDSON — Deploy & Test Phase 1 với Claude Code

> Hướng dẫn từng bước để deploy `werewolf-companion` Phase 1 lên Cloudflare (FREE) và test thật trên 2-3 điện thoại. Cách viết: copy-paste vào Claude Code để Claude hỗ trợ debug khi gặp lỗi.
>
> **Time estimate:** 60-90 phút lần đầu (gồm tạo Cloudflare account, login PartyKit). Lần thứ 2 chỉ ~10 phút.

---

## 📋 Trước khi bắt đầu — Checklist

Đảm bảo có sẵn:

- [ ] **macOS / Linux / Windows WSL** terminal
- [ ] **Node.js 20+** đã cài (kiểm tra: `node --version`)
- [ ] **npm 10+** (kiểm tra: `npm --version`)
- [ ] **git** đã cài
- [ ] **Tài khoản GitHub** (free)
- [ ] **Tài khoản Cloudflare** (free) — nếu chưa có: https://dash.cloudflare.com/sign-up
- [ ] **Claude Code** đã cài: `npm install -g @anthropic-ai/claude-code` (nếu chưa có)
- [ ] **2-3 điện thoại** để test (hoặc 1 điện thoại + 2-3 browser tabs)

> Nếu thiếu cái nào, hỏi Claude Code: *"Tôi đang trên [macOS/Linux/Windows]. Hãy giúp tôi cài [Node.js / git / Claude Code]."*

---

## 🚀 Phase A — Setup local

### Step A1. Giải nén project

```bash
# Vào thư mục bạn muốn chứa project, ví dụ:
cd ~/projects

# Giải nén zip vừa download
unzip werewolf-companion-phase1.zip
cd werewolf-companion

# Verify structure
ls -la
```

**Expected:** Thấy folders `packages/`, `docs/`, `.github/`, files `README.md`, `package.json`, v.v.

### Step A2. Khởi tạo git repo

```bash
git init
git add .
git commit -m "Phase 1 — Foundation & Lobby System"
```

### Step A3. Install dependencies

```bash
npm install
```

**Expected:** `added ~194 packages` (mất 30-60s).

> ❌ **Nếu lỗi:** Copy lỗi vào Claude Code:
>
> *"Tôi đang setup werewolf-companion. Khi chạy `npm install` tôi gặp lỗi sau: [paste lỗi]. Giúp tôi fix."*

### Step A4. Verify build local

```bash
# Type-check toàn bộ
npm run type-check

# Run tests
npm test

# Build client
npm run build --workspace=@werewolf/client
```

**Expected:**
- Type-check: không có error
- Tests: `Tests  25 passed (25)`
- Build: `✓ built in ~6s`

✅ **Checkpoint A:** Nếu cả 3 commands pass → local setup OK, đi tiếp Phase B.

---

## 🖥️ Phase B — Test local trước khi deploy

Trước khi deploy lên cloud, ta test local để chắc chắn code hoạt động.

### Step B1. Start PartyKit server (terminal 1)

Mở terminal mới, chạy:

```bash
cd ~/projects/werewolf-companion
npm run dev:server
```

**Expected:** Logs `🎈 PartyKit dev`, server listening ở `http://127.0.0.1:1999`.

> ❌ **Nếu lỗi `Host not in...` / `No such module`:** Đây là vấn đề common với PartyKit + Miniflare. Hỏi Claude Code:
>
> *"PartyKit dev không start được, log lỗi: [paste]. Tôi đang dùng Node [version]. Giúp fix."*
>
> Claude Code có thể đề xuất: update `compatibilityDate` trong `partykit.json`, dùng `npx wrangler dev` thay thế, hoặc bypass bằng cách test trực tiếp trên cloud.

### Step B2. Start client (terminal 2)

Mở terminal MỚI (giữ terminal 1 chạy):

```bash
cd ~/projects/werewolf-companion
npm run dev:client
```

**Expected:** Vite logs, listening ở `http://localhost:5173`.

### Step B3. Test trên browser desktop

Mở browser, vào `http://localhost:5173`.

**Expected:** Thấy màn Home với logo lửa, tagline "Chia bài ma sói qua điện thoại...", 2 nút "Tạo phòng mới" + "Nhập code phòng".

### Step B4. Quick smoke test (2 browser tabs)

1. **Tab 1:** Tạo phòng → tên "Test1", code `123456` → vào lobby
2. **Tab 2:** Mở `http://localhost:5173/?code=123456` → tên "Test2" → vào lobby
3. **Verify:** Cả 2 tab phải thấy 2 người chơi cùng lúc

✅ **Checkpoint B:** Nếu thấy realtime sync giữa 2 tab → code chạy đúng. Stop cả 2 server (Ctrl+C ở mỗi terminal) và đi tiếp Phase C.

> ❌ **Nếu Tab 2 không thấy Tab 1 trong lobby:** Hỏi Claude Code:
>
> *"Tôi mở 2 tab, tab 1 tạo phòng tab 2 join nhưng không thấy realtime sync. Console browser hiện: [paste F12 → Console errors]. Giúp debug."*

---

## ☁️ Phase C — Deploy PartyKit server lên Cloudflare

### Step C1. Login PartyKit

```bash
cd packages/server
npx partykit login
```

**Expected:** Browser tự mở, login với GitHub. Sau đó terminal hiện "✓ Successfully logged in".

> ❌ **Nếu browser không mở tự động:** Copy URL từ terminal, paste vào browser manually.

### Step C2. Deploy server

```bash
npx partykit deploy
```

**Expected:** Logs build → upload → "Deployed to https://werewolf-companion.<your-partykit-username>.partykit.dev"

📝 **GHI LẠI URL NÀY** — sẽ cần ở Step D2. Ví dụ:
```
https://werewolf-companion.hoangthang1394.partykit.dev
```

### Step C3. Test server bằng curl

```bash
curl https://werewolf-companion.<your-username>.partykit.dev/parties/lobby/test
```

**Expected:** Response (có thể là HTML hoặc 426 Upgrade Required — đều OK, nghĩa là server reachable). KHÔNG được là 404 hay timeout.

✅ **Checkpoint C:** Server deployed thành công, có URL public.

> ❌ **Nếu deploy lỗi `Cloudflare not connected`:** Hỏi Claude Code:
>
> *"npx partykit deploy bị lỗi: [paste]. Tôi cần connect Cloudflare account như thế nào?"*

---

## 🌐 Phase D — Deploy client lên Cloudflare Pages

Có 2 cách: **(D-A) qua GitHub** (recommended, auto-deploy) hoặc **(D-B) qua Wrangler CLI** (one-off).

### Cách D-A — GitHub auto-deploy (recommended)

#### Step D-A1. Push lên GitHub

1. Tạo repo trên GitHub: https://github.com/new
   - Name: `werewolf-companion`
   - Private (recommended)
   - **KHÔNG** check "Initialize with README"

2. Trong terminal:
```bash
cd ~/projects/werewolf-companion
git remote add origin https://github.com/<your-username>/werewolf-companion.git
git branch -M main
git push -u origin main
```

#### Step D-A2. Connect Cloudflare Pages với GitHub

1. Vào https://dash.cloudflare.com → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
2. Chọn GitHub → authorize → chọn repo `werewolf-companion`
3. **Build settings:**
   - **Project name:** `werewolf-companion`
   - **Production branch:** `main`
   - **Framework preset:** `Vite`
   - **Build command:**
     ```
     npm install && npm run build --workspace=@werewolf/client
     ```
   - **Build output directory:**
     ```
     packages/client/dist
     ```
   - **Root directory:** *(để trống — keep repo root)*
4. **Environment variables (quan trọng!):**
   Click **Add variable** → add:
   - **Name:** `VITE_PARTYKIT_HOST`
   - **Value:** URL PartyKit từ Step C2, **không có `https://`**, ví dụ:
     ```
     werewolf-companion.hoangthang1394.partykit.dev
     ```
   - Add another variable:
   - **Name:** `NODE_VERSION`
   - **Value:** `20`
5. Click **Save and Deploy**

**Expected:** Build chạy 2-3 phút. Sau đó được URL dạng `https://werewolf-companion.pages.dev`.

📝 **GHI LẠI URL NÀY** — sẽ test ở Phase E.

> ❌ **Nếu build fail:** Vào Cloudflare → Pages → project → Deployments → click vào deployment fail → xem log. Copy log fail vào Claude Code:
>
> *"Cloudflare Pages build fail. Log lỗi: [paste]. Tôi đã set VITE_PARTYKIT_HOST và NODE_VERSION=20. Giúp debug."*

### Cách D-B — Wrangler CLI (alternative)

```bash
cd ~/projects/werewolf-companion/packages/client

# Build với env var
VITE_PARTYKIT_HOST=werewolf-companion.<your-username>.partykit.dev npm run build

# Deploy
npx wrangler login   # Một lần duy nhất
npx wrangler pages deploy dist --project-name=werewolf-companion
```

**Expected:** Get URL `https://werewolf-companion.pages.dev`.

✅ **Checkpoint D:** Bạn có 2 URL:
- Server: `werewolf-companion.<username>.partykit.dev`
- Client: `https://werewolf-companion.pages.dev`

---

## 📱 Phase E — Test thật trên điện thoại

### Test 1: Tạo phòng + Join via QR (~5 phút)

1. **Phone 1 (host):**
   - Mở browser, vào URL Pages (https://werewolf-companion.pages.dev)
   - Tap **"Tạo phòng mới"**
   - Nhập tên: `Hoàng`
   - Nhập code 6 số: `482915`
   - Tap **"Tạo phòng"** → vào lobby
   - **Expected:** Thấy player list có "Hoàng (bạn)" với crown badge, QR code hiện sẵn

2. **Phone 2 (player):**
   - Mở camera, scan QR trên Phone 1
   - Browser tự mở URL với code pre-filled
   - Banner amber hiện "Bạn vừa mở link mời. Code đã được điền sẵn."
   - Nhập tên: `Minh`
   - Tap **"Vào phòng"**
   - **Expected:** Cả 2 phone phải thấy 2 người trong lobby **trong < 2 giây**

✅ **PASS** nếu sync nhanh, KHÔNG cần F5 refresh.

> ❌ **Nếu Phone 2 không vào được:**
>
> *Claude Code prompt:* "Tôi deploy werewolf-companion lên Cloudflare. Phone 1 tạo phòng OK, Phone 2 scan QR mở được link nhưng không join được. Browser console hiện: [F12 → Console screenshot/paste]. URL PartyKit của tôi là: [paste]. URL Pages: [paste]. Giúp debug."

### Test 2: Ready toggle realtime (~2 phút)

1. **Phone 2:** Tap **"Tôi đã sẵn sàng"**
2. **Phone 1:** Quan sát hàng của Minh

**Expected:** Minh's row đổi từ "Đang nghĩ..." → badge xanh "Sẵn sàng" trong < 1 giây. Counter "1 / 2 sẵn sàng" cập nhật.

3. **Phone 2:** Tap "Bỏ sẵn sàng" → revert lại

✅ **PASS** nếu sync hai chiều mượt.

### Test 3: Min 5 players + Start game (~5 phút)

Mở thêm 3 browser tabs trên laptop (dùng Incognito để có sessionId khác nhau):

1. **Tab Incognito 1:** Vào URL Pages, join phòng `482915` với tên `An`
2. **Tab Incognito 2:** Tên `Linh`
3. **Tab Incognito 3:** Tên `Trang`
4. Tất cả 5 tab/phone đều bấm **"Tôi đã sẵn sàng"**
5. **Phone 1 (host):** Nút **"Bắt đầu chia bài"** chuyển sang màu amber active

**Expected:** Khi host bấm Start → tất cả 5 client phải hiện modal **"Phase 2 sẽ chia bài ở đây"**.

✅ **PASS** = Phase 1 hoạt động end-to-end!

### Test 4: Kick player (~2 phút)

1. **Phone 1 (host):** Tap icon X (UserMinus) bên cạnh "Linh"
2. **Expected:** Dialog confirm hiện ra với text "Mời Linh ra khỏi phòng?"
3. Tap **"Mời Linh ra"**
4. **Expected trên tab Linh:** Hiện màn "Bạn đã bị mời ra khỏi phòng"
5. **Expected trên các tab khác:** Linh biến mất khỏi player list

### Test 5: Refresh restore (~1 phút)

1. Khi đang ở trong lobby với 5 người
2. **Phone 2 (Minh):** Refresh browser (pull-to-refresh hoặc Ctrl+R)
3. **Expected:** Lobby tự load lại < 2 giây, Minh vẫn còn trong player list với tên cũ

✅ **PASS** = session restore hoạt động.

### Test 6: Host disconnect timeout (10 phút — tùy chọn)

> Test này mất 5 phút chờ — chỉ làm nếu muốn verify cleanup behavior.

1. Tạo phòng host trên Phone 1, có Phone 2 join
2. **Phone 1:** Đóng tab browser hoàn toàn
3. Đợi 5 phút
4. **Expected trên Phone 2:** Hiện màn "Phòng đã đóng. Ngọn lửa đã tắt."

**Shortcut để test nhanh:** Sửa `packages/shared/src/constants.ts` → `HOST_DISCONNECT_TIMEOUT_MS = 30 * 1000` (30s thay vì 5 phút) → redeploy → test → revert lại.

> Prompt cho Claude Code: *"Help me change HOST_DISCONNECT_TIMEOUT_MS to 30 seconds, redeploy both server and client, test, then revert."*

---

## 🐛 Phase F — Troubleshooting common issues

### Issue 1: "Failed to connect to WebSocket"

**Symptom:** Trong lobby, thấy "Mất kết nối, đang thử lại..." mãi.

**Causes:**
- `VITE_PARTYKIT_HOST` set sai (có `https://` prefix hoặc trailing slash)
- PartyKit server chưa deploy
- Cloudflare network blocked (rare)

**Prompt Claude Code:**
> *"WebSocket connect fail. Trong Cloudflare Pages env tôi set VITE_PARTYKIT_HOST=[paste value]. Browser F12 Network tab hiện: [paste WS request]. Giúp debug."*

### Issue 2: "Code đúng nhưng không vào được phòng"

**Symptom:** Nhập code đúng → bị bounce về home page.

**Cause:** Có thể là JoinErrorScreen render nhưng auto-redirect.

**Prompt Claude Code:**
> *"Tôi nhập đúng code phòng nhưng bị quay lại home. Browser console hiện: [paste]. Giúp check."*

### Issue 3: "QR code không scan được"

**Symptom:** Camera điện thoại scan QR không nhận.

**Cause:** Background trắng + foreground dark — đúng spec rồi. Có thể do:
- Màn hình phone 1 quá nhỏ → tăng zoom browser hoặc dùng nút Copy link
- Light điều kiện ánh sáng kém
- Camera app cũ → dùng Google Lens hoặc QR scanner app

**Workaround:** Dùng nút **Copy** bên cạnh URL, share qua Zalo/iMessage.

### Issue 4: "iOS Safari refresh mất data"

**Symptom:** Refresh trên iOS Safari → vào lại không thấy ai.

**Cause:** iOS Safari Private mode → localStorage không persist. Hoặc user tap "Refresh" mất context state route.

**Prompt Claude Code:**
> *"User refresh iOS Safari → vào lobby thấy trống. localStorage có sessionId nhưng player list rỗng. Giúp debug useLobby logic."*

### Issue 5: "Build fail trên Cloudflare Pages: monorepo workspace issue"

**Symptom:** Pages build fail với error về `@werewolf/shared` not found.

**Fix in Cloudflare Pages settings:**
- **Build command** đổi thành:
  ```
  npm install && npm run build --workspace=@werewolf/client
  ```
- Hoặc nếu vẫn fail, thử:
  ```
  npm install --workspaces --include-workspace-root && npm run build -w @werewolf/client
  ```

**Prompt Claude Code:**
> *"Cloudflare Pages build fail. Workspace dependency `@werewolf/shared` không resolve được. Log: [paste]. Giúp fix."*

---

## 🎯 Phase G — Verify acceptance criteria

Sau khi pass hết Test 1-5, đối chiếu với 10 acceptance criteria trong `docs/BRIEF.md`:

```
- [ ] AC1: Tạo phòng → vào lobby as host
- [ ] AC2: 2 devices thấy nhau realtime (<200ms)
- [ ] AC3: Ready toggle propagates
- [ ] AC4: "Bắt đầu" với 5 ready → modal stub
- [ ] AC5: <5 players → button disabled với helper text
- [ ] AC6: Kick → confirm dialog → kicked screen
- [ ] AC7: Name pre-fill từ localStorage
- [ ] AC8: Refresh giữa lobby → auto rejoin <2s
- [ ] AC9: Host disconnect 5min → "Phòng đã đóng"
- [ ] AC10: 21st player → "Phòng đã đầy"
```

> **AC10 cần effort** — phải có 20 tab thật. Có thể tạm skip nếu test 1-9 OK.

---

## 🎉 Phase H — Done! Next steps

Nếu Phase E pass hết → **Phase 1 production ready** 🎉

### Recommended next actions:

1. **Custom domain (optional):**
   - Cloudflare Pages → project → Custom domains → add `soi-dem.yourdomain.com`
   - HTTPS auto-config

2. **Monitoring (optional):**
   - Cloudflare → Analytics & Logs → Workers & Pages → xem traffic
   - Nếu cần error tracking: integrate Sentry (Phase 3)

3. **Share với bạn bè:**
   - Test với group thật vào buổi ma sói tiếp theo
   - Collect feedback để input cho Phase 2

4. **Bắt đầu Phase 2 khi sẵn sàng:**
   - Mở Claude chat (web) hoặc Claude Code
   - Prompt: *"/app-creator Phase 2 cho werewolf-companion: card system + game loop. Tham khảo docs/PHASE_0_DECISIONS.md, docs/BRIEF.md, ROADMAP.md trong repo."*
   - Team 6 agent sẽ design + build Phase 2 trên foundation của Phase 1

---

## 💬 Khi gặp lỗi không có trong doc này

Mở Claude Code trong project folder:

```bash
cd ~/projects/werewolf-companion
claude
```

Prompt template:

> *Tôi đang ở Phase [A/B/C/D/E/F] của werewolf-companion deploy.*
>
> *Tôi đang làm: [mô tả action]*
>
> *Nhưng gặp lỗi: [paste full error]*
>
> *Context:*
> - *OS: [macOS/Linux/Windows]*
> - *Node version: [output of `node --version`]*
> - *VITE_PARTYKIT_HOST: [value]*
> - *PartyKit URL: [value]*
> - *Pages URL: [value]*
>
> *Giúp tôi debug step-by-step.*

Claude Code sẽ:
- Đọc các file relevant trong project
- Đề xuất fix cụ thể
- Có thể edit file giúp bạn
- Chạy commands để verify

---

## 📦 Tham khảo nhanh

| Resource | URL/Path |
|---|---|
| Project structure | `docs/PLAN.md` |
| Design tokens | `docs/DESIGN.md` |
| Acceptance criteria | `docs/BRIEF.md` |
| Test plan đầy đủ | `docs/TEST_REPORT.md` |
| Phase 0 quyết định | `docs/PHASE_0_DECISIONS.md` |
| Roadmap Phase 2/3 | `ROADMAP.md` |
| PartyKit dashboard | https://www.partykit.io/dashboard |
| Cloudflare dashboard | https://dash.cloudflare.com |

---

## ⏱️ Time tracker

Ghi lại thời gian thực tế để tham khảo cho Phase 2:

- [ ] Phase A (Setup local): ___ phút
- [ ] Phase B (Test local): ___ phút
- [ ] Phase C (Deploy server): ___ phút
- [ ] Phase D (Deploy client): ___ phút
- [ ] Phase E (Test on phones): ___ phút
- **Total:** ___ phút

Mục tiêu: **< 90 phút** lần đầu. Nếu vượt → tìm bottleneck (thường là Cloudflare Pages config hoặc PartyKit login).

---

🍀 Chúc deploy thành công! Khi gặp issue, đừng ngại paste full log vào Claude Code — feedback chi tiết = fix nhanh.
