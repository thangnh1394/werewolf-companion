# BRIEF — `werewolf-companion` Phase 1: Foundation & Lobby

> **Agent:** Product Manager
> **Phase:** 1.1 (Business Clarification)
> **Module:** Foundation & Lobby System
> **Parent decisions:** see `PHASE_0_DECISIONS.md`

## Tool

Phase 1 builds the foundation and lobby system of Werewolf Companion — a digital card dealer for in-person Vietnamese werewolf (ma sói) game sessions. Phase 1 delivers everything from "open the app" to "everyone is in the room and ready to play" — but NOT the card-dealing logic itself (that's Phase 2).

## Users

Groups of 5-20 friends playing ma sói together in the same physical space, each using their own phone. One person acts as room host; others join via 6-digit code or shared link/QR.

## Problem solved

Currently the group must bring a physical card deck to play. Phase 1 removes the need to physically hand out role cards by establishing the digital "room" infrastructure where players gather, sync ready states, and prepare for a match — all from their own phone. Phase 1 alone won't replace the deck (Phase 2 does), but it makes Phase 2 possible.

## Primary user journey (happy path)

**Host flow:**
1. Host opens app → home page with "Tạo phòng" / "Nhập code"
2. Taps "Tạo phòng" → enters display name + sets 6-digit code → room created
3. Sees lobby with QR code + shareable link + their own name in the player list
4. As friends join, sees their names appear in real-time
5. When all players are ready, "Bắt đầu" button becomes enabled (Phase 2 handles what happens next — for Phase 1 it just shows a placeholder "Trận đấu sẽ bắt đầu (Phase 2)")

**Player flow:**
1. Player opens app (or scans host's QR / clicks link)
2. If from link/QR → code pre-filled. If manual → taps "Nhập code" → enters 6-digit code
3. Enters display name (pre-filled from localStorage if used before)
4. Joins lobby → sees all current players + own entry
5. Taps "Sẵn sàng" → toggle to ready state, visible to everyone
6. Waits for host to start the game

## In scope (Phase 1 MVP)

- **Home page** with two primary CTAs: "Tạo phòng" and "Nhập code phòng"
- **Create room flow:** host name input + 6-digit code input + room creation
- **Join room flow:** code input + display name input (pre-filled from localStorage if available)
- **URL-based join:** `/?code=NNNNNN` pre-fills the code, prompts only for name
- **Lobby screen:** list of players (with host badge), ready toggle per player, host-only controls
- **Realtime sync:** join, leave, name update, ready toggle — all propagate within ~200ms to all clients
- **Share UX:** QR code + copyable link visible to the host (and to anyone in the lobby — friends arriving late can also share)
- **Host kick player:** with confirmation dialog (custom dialog, not browser alert)
- **localStorage name memory:** save display name after first successful join; pre-fill next time
- **Session restore:** if user refreshes the lobby page, they rejoin the same room with the same identity (via sessionId in localStorage)
- **Room TTL:** if host disconnects and doesn't return in 5 minutes, room closes (all clients disconnected with message)
- **Room idle cleanup:** if no activity for 2 hours, auto-cleanup (DO alarm)
- **Player count enforcement:** room caps at 20 players. If 21st tries to join → friendly error.
- **"Bắt đầu" button placeholder:** enabled when all ready + ≥5 players, but for Phase 1 only shows a placeholder message ("Phase 2: chia bài sẽ ở đây").

## Out of scope (explicitly NOT in Phase 1)

- **Card dealing logic** → Phase 2
- **Main desk / Room desk editor** → Phase 2
- **"Bài của tôi" screen** → Phase 2
- **Game-in-progress lock** → Phase 2 (lobby in Phase 1 always accepts new joiners up to 20)
- **End game flow** → Phase 2
- **Animations beyond basic CSS transitions** → Phase 3
- **Accessibility audit / a11y polish** → Phase 3
- **PWA install** → Future
- **Multi-language UI** → Future (Phase 1 is Vietnamese-only)

## Improvements suggested by PM (accepted by user)

- **QR code + shareable link** — ACCEPTED. Eliminates verbal code-reading friction when group is already in person. Implementation: `qrcode.react` lib + URL with `?code=` query param.
- **localStorage name memory** — ACCEPTED. Saves the typing for repeat players (group plays 4-5 sessions/month). Pre-fill on subsequent joins, still editable.

## Acceptance criteria

1. [ ] Given empty home page, when user taps "Tạo phòng" and enters name "An" + code "482915", then a room is created and user lands in lobby as host.
2. [ ] Given a lobby with host "An" (room code 482915), when another device opens `/?code=482915` and submits name "Bình", then within 200ms both devices see player list `[An (host), Bình]`.
3. [ ] Given player "Bình" in a lobby, when Bình taps "Sẵn sàng", then host's screen updates Bình's badge to "Sẵn sàng" in real-time.
4. [ ] Given a lobby with 1 host + 4 ready players (5 total, all ready), when host taps "Bắt đầu", then a placeholder message appears ("Phase 2: chia bài sẽ ở đây").
5. [ ] Given a lobby with 4 players (less than 5), when all 4 are ready, then "Bắt đầu" button remains disabled with helper text "Cần ít nhất 5 người chơi".
6. [ ] Given host viewing player list, when host taps the kick icon next to "Bình", then a confirm dialog appears; on confirm, Bình is removed and Bình's device is shown a "Bạn đã bị mời ra khỏi phòng" message.
7. [ ] Given player "An" who previously joined a room with name "An", when An visits home page again, then the name field on the join form pre-fills with "An" (editable).
8. [ ] Given an active lobby with 3 players, when one player refreshes their browser, then they automatically rejoin the same room with the same identity within 2 seconds.
9. [ ] Given a host who closes their browser tab, when 5 minutes pass without them returning, then all remaining players see "Chủ phòng đã rời, phòng đã đóng" and are returned to home page.
10. [ ] Given a room with 20 players, when a 21st tries to join, then they see "Phòng đã đầy (20/20)" and cannot enter.

## Constraints

- **Time:** N/A (no hard deadline)
- **Tech:** Locked in Phase 0 — Vite + React + TS + Tailwind + lucide-react + PartyKit + partysocket + XState + Zod
- **Cost:** Must stay within Cloudflare free tier ($0/year target)
- **Devices:** Mobile-first; viewport target ~380px width. Must work on iOS Safari + Android Chrome.
- **Network:** Must gracefully handle WiFi flakiness; reconnect within 5 seconds of network return.
- **Code language:** English identifiers; Vietnamese UI strings.

## Success signal

When the team can sit down at the next ma sói night, open the app on their phones, get into a room within 30 seconds total (no typing of 6-digit codes thanks to QR/link), and have the room reliably show everyone's ready state without any manual refresh — that's the win for Phase 1.
