# Phase 4 — Decisions Captured (Locked Early)

> User chốt sẵn các decisions chiến lược cho Phase 4 trước khi bắt đầu code Phase 3.
> Khi Phase 4 starts, đọc file này TRƯỚC để có context.

## Scope: GM Mode (Game Master refactor)

Shift app từ "card dealer" → "card dealer + game state tracker". Toàn bộ cluster GM:
- GM mode replaces host role logic
- GM transferable
- GM omniscient view
- Death tracking
- Turn tracking (đêm/ngày)
- Notes
- Dead player UI
- End-of-game replay

## Locked decisions

### D1: GM mặc định hay opt-in?

✅ **GM = host by default, transferable trong waiting lobby**

- Khi tạo phòng → host AUTOMATICALLY là GM (không có toggle)
- GM có thể transfer cho người khác **CHỈ trong waiting lobby** (phase: 'lobby')
- KHÔNG thể transfer khi đang playing
- KHÔNG có option "play without GM" — mọi phòng đều có GM

Hệ quả:
- GM không nhận card (không deal cho GM)
- Player count cho deck = total_players - 1 (excluding GM)
- canStartGame check: deck size === non-GM players count

### D2: Turn tracking model

✅ **Auto, alternating ngày/đêm với ngày 1 starts at "đêm ngày 1"**

Flow:
```
Game start → Đêm ngày 1
  ↓ GM bấm "End đêm"
Sáng ngày 1
  ↓ GM bấm "End ngày"  
Đêm ngày 2
  ↓ GM bấm "End đêm"
Sáng ngày 2
  ↓ ...repeat...
GM bấm "Kết thúc trận" → end game flow
```

Server state mới:
- `currentTurn: { day: number, phase: 'night' | 'day' }`
- Khởi tạo khi dealCards: `{ day: 1, phase: 'night' }`
- Reducer `advanceTurn()`: night→day = same day; day→night = day+1

Notes optional cho từng turn — không bắt buộc.

### D3: (Decided implicitly) GM transfer mechanism

- Khi transfer:
  - State `players` Map: update `isHost` flag (current GM=false, target=true)
  - Update `hostSessionId`
  - Broadcast `PLAYER_UPDATED` cho cả 2 players
  - New GM nhận full omniscient view (assignments + game log) qua dedicated message hoặc snapshot
- Old GM (vừa transfer xong) lose omniscient view → giờ là regular player → tương lai có thể được chia bài ván sau nếu họ vẫn ở phòng

### D4: (Implied by D2) Notes attached to turns

- Mỗi turn có thể có `notes: string[]`
- Notes lưu kèm turn record (turn day + phase)
- Replay view = chronological list các turns + notes + deaths

### D5: (Decided implicitly) Death tracking

- GM mark player chết với `(targetSessionId, day, phase, reason: string)`
- Death affects:
  - Player's screen: hiện "Bạn đã chết, chờ kết thúc"
  - GM's view: player highlighted/dimmed
  - Replay log: ghi nhận

### D6: (Decided implicitly) End-of-game replay

- GM bấm "Kết thúc trận"
- Server broadcast event `GAME_ENDED_WITH_LOG` (hoặc tương tự)
- Modal cho mọi người: "Bạn có muốn xem lại quá trình ván đấu?"
- Yes → view replay screen (full turn log + notes + deaths)
- No → về lobby ready như Phase 2.6 flow
- Replay log clear khi ván tiếp theo bắt đầu

## Open questions (to discuss when Phase 4 starts)

1. **GM minimum player count?** Hiện tại 5 players including host. Nếu GM không play, cần 5 non-GM = 6 total? Hay vẫn 5 total + GM?
2. **Re-deal flow:** Sau replay/decline, host (= GM) có thể start ván mới với same deck. GM transfer ván trước → ván sau GM mới có thể start.
3. **Mid-game disconnect of GM:** Nếu GM disconnect giữa ván, ai control? Auto-transfer? Wait reconnect?
4. **Notes UI:** Per-turn note hay free-form running text? Markdown? Just plain?
5. **Replay accessible khi end?** Replay là 1-time view khi end, hay anytime sau end (cho đến khi ván sau start)?

## Status

✅ Decisions D1, D2 explicitly locked by user
🔵 D3-D6 derived from D1+D2 + feature list, will confirm khi Phase 4 starts
❓ Open questions cần discuss before Architect

## Reference: original feature list from user

```
- Chuyển role chủ phòng thành quản trò, có thể đổi Quản trò tùy ý cho bất kỳ ai
- Một khi đã làm quản trò thì không cần chia bài cho họ
- GM thấy ai role gì
- Đánh dấu ai chết, đêm nào, lý do chết
- Track theo turn (đêm/ngày), mark có ai chết, note input optional
- Player chết: hiện "bạn đã chết vui lòng chờ game kết thúc"
- Khi GM bấm kết thúc → broadcast "có muốn xem lại quá trình?"
- Decline → về lobby chờ ván mới
- Accept → xem full quá trình do GM note + điều phối
```
