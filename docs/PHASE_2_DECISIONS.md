# Phase 2 — Phase 0 Decisions

> Quyết định locked sau Phase 0 research cho Phase 2 (card system + game loop). Extends `PHASE_0_DECISIONS.md` từ Phase 1. KHÔNG đổi trong Phase 2 trừ khi user request explicitly.

## Inherited từ Phase 1 (post-fixes)

Refer to `HANDOVER.md` for full context. Key fixed items that Phase 2 must respect:

- **Server uses `implements Party.Server`** (NOT partyserver library). All new server logic follows same pattern.
- **Host auto-ready:** `addPlayer()` sets `isReady: claimsHost`. `canStartGame()` excludes host from ready check.
- **`isTerminatedRef` in useLobby:** Only set for `KICKED` / `ROOM_CLOSED`. END_GAME does NOT terminate connection.
- **Production URLs:**
  - Server: `werewolf-companion.thangnh1394.partykit.dev`
  - Client: `fa4bcf9b.werewolf-client.pages.dev`
  - Repo: `github.com/thangnh1394/werewolf-companion`
- **Deploy flow:** PartyKit deploy (server) + Wrangler CLI (client). NO GitHub Pages auto-deploy.
- **No local dev:** PartyKit Miniflare doesn't work on Windows 11 + Node 22. Test directly on cloud.

## Card system — 15 roles

> **Format:** Mỗi card có description đầy đủ để user mới hoàn toàn có thể đọc xong rồi chơi đúng. Mỗi description gồm: **Khả năng** (when + what), **Thời điểm dậy** (đêm nào), **Lưu ý** (rules edge cases nếu có).

### Phe Sói (4 roles)

| ID | Vietnamese | Description (UI tooltip) |
|---|---|---|
| `werewolf` | Sói Thường | **Khả năng:** Mỗi đêm cùng các sói khác bàn nhau (im lặng, chỉ ra dấu) chọn 1 dân để giết. **Thời điểm dậy:** Tất cả các đêm. **Lưu ý:** Sói không được cắn sói khác. Mục tiêu: tiêu diệt hết dân làng. |
| `alpha_wolf` | Sói Tiên Tri | **Khả năng:** Đêm đầu tiên thức dậy cùng tất cả các sói, biết toàn bộ đồng đội của mình. Mỗi đêm còn được soi 1 người để biết họ là vai gì (chính xác như Tiên Tri thật). **Thời điểm dậy:** Tất cả các đêm. **Lưu ý:** Vẫn là sói, bị treo cổ thì phe sói mất 1 mạng. |
| `wolf_alpha` | Sói Trùm | **Khả năng:** Là sói mạnh nhất. Khi bị treo cổ ban ngày, ngay đêm hôm sau sói còn lại được cắn 2 người thay vì 1. **Thời điểm dậy:** Tất cả các đêm. **Lưu ý:** Khả năng "cắn 2" chỉ kích hoạt nếu Sói Trùm bị TREO CỔ, không phải bị Phù Thủy giết hay Thợ Săn bắn. |
| `cursed_wolf` | Sói Nguyền | **Khả năng:** Là sói. Đêm đầu mỗi sói được biết Sói Nguyền là ai, nhưng Sói Nguyền không biết các sói khác là ai. Tiên Tri soi Sói Nguyền sẽ thấy là DÂN (gây nhiễu). **Thời điểm dậy:** Tất cả các đêm. **Lưu ý:** Khi tất cả sói khác đã chết, Sói Nguyền sẽ tự động thức dậy như sói thường và tiếp tục cắn. |

### Phe Dân Làng (9 roles)

| ID | Vietnamese | Description (UI tooltip) |
|---|---|---|
| `villager` | Dân Làng | **Khả năng:** Không có khả năng đặc biệt. **Thời điểm dậy:** Chỉ ban ngày. **Lưu ý:** Sức mạnh của bạn là quan sát + lập luận. Biểu quyết treo cổ là vũ khí duy nhất của phe Dân. |
| `seer` | Tiên Tri | **Khả năng:** Mỗi đêm chọn soi 1 người, Quản Trò sẽ ra dấu cho biết người đó có phải Sói hay không (chỉ trả lời "Sói" / "không Sói", không nói cụ thể vai gì). **Thời điểm dậy:** Tất cả các đêm. **Lưu ý:** Đây là vai TRỤ CỘT của phe Dân. Cần ra mặt khéo léo, nếu lộ sớm dễ bị Sói cắn. |
| `bodyguard` | Bảo Vệ | **Khả năng:** Mỗi đêm chọn 1 người để bảo vệ (kể cả bản thân). Nếu người đó bị Sói cắn đêm đó thì không chết. **Thời điểm dậy:** Tất cả các đêm. **Lưu ý:** KHÔNG được bảo vệ cùng 1 người 2 đêm liên tiếp. Không chống lại được bình giết của Phù Thủy. |
| `witch` | Phù Thủy | **Khả năng:** Có 2 bình thuốc dùng 1 lần duy nhất cả ván: **Bình Cứu** (cứu người vừa bị Sói cắn đêm đó), **Bình Giết** (giết 1 người bất kỳ). **Thời điểm dậy:** Tất cả các đêm sau khi Sói cắn xong. **Lưu ý:** Quản Trò chỉ cho biết AI bị cắn, không nói thêm. Có thể dùng cả 2 bình trong cùng 1 đêm. |
| `hunter` | Thợ Săn | **Khả năng:** Khi chết bằng BẤT KỲ cách nào (Sói cắn / treo cổ / Phù Thủy giết), được bắn chết 1 người chơi khác ngay lập tức. **Thời điểm dậy:** Không dậy ban đêm, chỉ tỉnh khi chết. **Lưu ý:** Nếu Già Làng đã chết, Thợ Săn vẫn dùng được khả năng này (ngoại lệ duy nhất của phe Dân). |
| `little_girl` | Bé Gái | **Khả năng:** Khi Sói thức dậy ban đêm, được phép HÉ MẮT TRỘM NHÌN để biết ai là Sói. **Thời điểm dậy:** Tất cả các đêm (cùng lúc với Sói). **Lưu ý:** RỦI RO: Nếu Sói phát hiện đang nhìn trộm, có thể tự ý chuyển nạn nhân sang Bé Gái. Phải hé mắt thật khéo. |
| `elder` | Già Làng | **Khả năng:** Có 2 mạng khi bị Sói cắn (lần 1 không chết). **Thời điểm dậy:** Đêm đầu tiên để xác nhận vai. **Lưu ý:** Nếu chết vì TREO CỔ / Phù Thủy giết / Thợ Săn bắn → chết ngay lập tức và TẤT CẢ các vai đặc biệt phe Dân (trừ Thợ Săn) sẽ MẤT chức năng. Cần được bảo vệ tối đa. |
| `sorcerer` | Pháp Sư | **Khả năng:** Mỗi đêm chọn 1 người, Quản Trò ra dấu cho biết người đó có phải Tiên Tri hay không. **Thời điểm dậy:** Tất cả các đêm. **Lưu ý:** Phe Dân. Khác với Tiên Tri (soi Sói), Pháp Sư chuyên SĂN Tiên Tri để giúp Tiên Tri tránh bị Sói cắn (vì biết Tiên Tri là ai thì có thể bảo vệ). |
| `servant` | Người Hầu | **Khả năng:** Khi có người vừa bị treo cổ ban ngày (TRƯỚC khi Quản Trò công bố vai của họ), Người Hầu có thể đứng dậy tuyên bố "Tôi xin đổi vai". Người Hầu nhận vai của người chết, người chết coi như là Người Hầu. **Thời điểm dậy:** Đêm đầu để xác nhận. **Lưu ý:** Chỉ đổi 1 lần duy nhất. Nếu đổi sang vai Sói → đổi phe luôn. |

### Phe Trung Lập (2 roles)

| ID | Vietnamese | Description (UI tooltip) |
|---|---|---|
| `cupid` | Cupid | **Khả năng:** Đêm đầu tiên chọn 2 người chơi (có thể chọn cả mình) làm "cặp đôi". Hai người này được Quản Trò bí mật cho biết ai là người yêu của họ. **Thời điểm dậy:** Chỉ đêm đầu. **Lưu ý:** Nếu 1 trong 2 người chết, người còn lại CHẾT NGAY theo. Nếu cặp đôi 1 Sói 1 Dân → cả 2 thành phe Cặp Đôi (chỉ thắng khi chỉ còn 2 người là họ). |
| `thief` | Tên Trộm | **Khả năng:** Khi bắt đầu ván, Quản Trò để 2 lá bài dư úp giữa bàn. Đêm đầu tiên Tên Trộm được nhìn 2 lá đó và chọn 1 lá để đổi thành vai mới của mình. **Thời điểm dậy:** Chỉ đêm đầu. **Lưu ý:** Nếu cả 2 lá là Sói → BẮT BUỘC phải chọn 1 (thành Sói). Sau khi đổi, lá bài Tên Trộm trở thành vô hiệu. |

## Card images

- **Source:** Pexels (Free, CC0). Sourced once during Designer Phase 2.1.
- **Hosting:** Bundled in client at `packages/client/public/cards/<role_id>.webp`
- **Format:** WebP at 85% quality, 400×400px square
- **Size budget:** ~25KB per image, ~375KB total
- **Lazy loading:** Card images loaded only when card is revealed (not on app boot)
- **Attribution:** "About" section in app + README.md credits each photographer

## Room desk editor UI

- **Grouped by team:** Sói / Dân / Trung Lập (3 collapsible sections, default expanded)
- **Card cell:** image thumbnail + name + "+" / "-" buttons
- **Allows duplicates:** Counter `x2` on cell when multiple selected
- **Live counter:** "X cards / Y người chơi" with color (green when match, amber when off)
- **Persist across rounds:** Room desk preserved after end game

## Card metadata schema

```ts
{
  id: 'werewolf',                    // unique English ID
  name: 'Sói Thường',                 // Vietnamese display name
  team: 'wolf' | 'village' | 'solo', // for grouping + win condition
  ability: 'Mỗi đêm...',              // UI description (1-2 sentences)
  imageUrl: '/cards/werewolf.webp',  // bundled asset path
  photographer?: 'Photographer Name', // for attribution
}
```

## Game loop

### Lock during play
- When `phase === 'playing'`: new connections receive `JOIN_ERROR` with `reason: 'room_in_progress'`
- Existing users can rejoin (have card preserved in roundState)

### Card dealing flow
1. Host clicks "Bắt đầu chia bài"
2. Server validates: `cardCount === playerCount`, all non-host ready
3. Server shuffles cards (Fisher-Yates)
4. Server assigns each player a card → sends private `YOUR_CARD` message to each connection (NOT broadcast)
5. Server broadcasts `GAME_STARTED` (with phase change, NO card info)
6. Client transitions to "Bài của tôi" screen

### Card reveal UX
- Card upside-down by default in center of screen
- **Tap and hold** → flip + reveal (animation ~300ms)
- **Release** → flip back to upside-down
- Show timer indicator while holding (optional polish)
- No "always show" button — strict anti-shoulder-peek

### End game
- Host taps "Kết thúc trận"
- Server broadcasts `GAME_ENDED`
- All clients transition back to lobby state
- Player list preserved (everyone stays)
- Room desk preserved
- Ready states reset to false (host stays ready)
- New players can join again

### Refresh during game
- Same `sessionId` → server resends `STATE_SNAPSHOT` + private `YOUR_CARD` again
- Card preserved across refreshes within same game

## Phase 2 sub-phases breakdown

### Phase 2.1 — Card Foundation
- Card data file (15 roles with metadata)
- Pexels image sourcing (Designer picks URLs)
- Optimize + bundle images to `public/cards/`
- Shared Zod schemas for card-related messages
- Attribution page

### Phase 2.2 — Main Desk Display
- Read-only screen: list all 15 cards, browseable
- Grouped by team with sections
- Accessible from lobby (info button)
- Each card opens detail dialog

### Phase 2.3 — Room Desk Editor (Host)
- Host-only screen accessed from lobby
- Same grouped layout as Main Desk + add/remove controls
- Live counter + validation
- Save on close (or auto-save on every change)

### Phase 2.4 — Card Dealing Logic
- Server: shuffle + private channel implementation
- New WebSocket messages: `YOUR_CARD`, `GAME_STARTED`, `GAME_ENDED`
- Lock room logic
- Refresh restore handling

### Phase 2.5 — "Bài của tôi" Screen
- Tap-and-hold mechanism
- Card flip animation
- Display: image + name + team + ability description
- Read-only player list (no kick during game)

### Phase 2.6 — End Game Flow
- Host UI: "Kết thúc trận" button (with confirm dialog?)
- Transition back to lobby
- Verify room desk persistence
- Verify player list persistence
- New player join unlock

## Out of scope (deferred to Phase 3 or Future)

- ⏭ Card-flip animation polish (basic CSS flip OK for MVP)
- ⏭ Custom user-defined roles
- ⏭ Preset decks ("Cơ bản 8 người")
- ⏭ Narrator-only mode
- ⏭ Match history
- ⏭ Voice integration
