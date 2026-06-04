# Handover: Sub-phase 4.1 — GM Foundation

> **For:** Claude Code CLI
> **Branch:** `phase-4-gm-mode` (already exists from cleanup phase)
> **Reference docs in repo:** `docs/PHASE_4_DECISIONS.md`, `docs/PHASE_4_PLAN.md`, `docs/PHASE_4.1_BRIEF.md`, `docs/PHASE_4.1_PLAN.md`
> **Estimated effort:** 4-5 hours
> **Baseline before changes:** 52/52 server tests, 18/18 E2E passing on production

---

## TL;DR for Claude Code

Implement Sub-phase 4.1 of Phase 4 (GM Mode) on the `phase-4-gm-mode` branch.

**This sub-phase = foundation only:**
1. Bump `MIN_PLAYERS` from 5 → 6
2. Add `TRANSFER_GM` message + server reducer
3. Modify `dealCards` to exclude GM from card distribution
4. Add "transfer GM" UI in lobby (text button with Crown icon hint, GM-only visible)
5. GM PlayingScreen shows placeholder "Bạn là quản trò" (full omniscient view comes in 4.3)
6. Rename "Chủ phòng" → "Quản trò" in all UI text
7. Update E2E tests for new flows

**Result after this sub-phase:**
- 58 server tests passing (52 + 6 new)
- E2E updated + new `tests/G.gm.spec.ts` with 3 GM tests
- Manual smoke test passes (see acceptance below)

**Do NOT include in this sub-phase** (these come later):
- Turn tracking (đêm/ngày counter) → Sub-phase 4.2
- Omniscient view (GM sees all assignments) → Sub-phase 4.3
- Death marking → Sub-phase 4.3
- Notes + replay → Sub-phase 4.4

---

## Pre-flight checks

Run these and stop if any fails:

```bash
cd ~/projects/werewolf-companion
git status                          # must be clean (no uncommitted changes)
git branch --show-current           # confirm where you are
git fetch origin

# Switch to phase-4-gm-mode branch
git checkout phase-4-gm-mode
git pull origin phase-4-gm-mode

# Baseline must be green BEFORE any changes
npm test                            # MUST show 52/52 passing
npm run type-check                  # MUST pass clean
npm run build                       # MUST succeed
```

**If `npm test` shows anything other than 52/52, STOP and investigate before continuing.** The whole point of incremental sub-phases is to start from green.

---

## Detailed implementation

Read the full PLAN at `docs/PHASE_4.1_PLAN.md` for exhaustive file-by-file detail. The summary below is the action checklist.

### Implementation order (mandatory)

Code in this exact order so partial state always compiles + tests pass:

**1. Shared package**
- `packages/shared/src/constants.ts`: change `MIN_PLAYERS = 5` → `MIN_PLAYERS = 6`
- `packages/shared/src/messages.ts`: add `TransferGmMessageSchema` + include in `ClientMessageSchema` union
- `packages/shared/src/types.ts`: add doc comment to `PublicPlayer.isHost` clarifying it now means "is GM"

**2. Server reducer + tests**
- `packages/server/src/reducers.ts`:
  - Modify `dealCards`: filter out GM before assigning cards, validate `nonGmPlayers.length === deck.length`
  - Add `transferGm` reducer with full validation (phase, sender is GM, target exists, not self)
  - Wire `case 'TRANSFER_GM':` into main message handler
- `packages/server/src/tests/`: add 6 new tests (see PLAN for exact test names + assertions)
  - GM excluded from deal
  - Deal fails if non-GM count mismatches deck
  - Transfer in lobby succeeds
  - Transfer during playing rejected
  - Non-GM cannot transfer
  - Cannot transfer to self / non-existent
- **Verify: `npm test` shows 58/58 passing before continuing.**

**3. Client state machine**
- `packages/client/src/state/connection.machine.ts`: add `transferGm` action that sends `TRANSFER_GM` message via WebSocket. No state changes needed — the server's `PLAYER_UPDATED` broadcast handles state updates reactively.

**4. Client UI components**
- `packages/client/src/components/lobby/TransferGmConfirmDialog.tsx` (NEW): confirm dialog with Crown icon, target name, explicit "Bạn sẽ không còn là quản trò" warning
- `packages/client/src/components/lobby/PlayerRow.tsx`: add "Trao quản trò" button (plain text + Crown icon hint at left), visible only when `viewerIsGm && !player.isHost && !isCurrentUser`
- `packages/client/src/components/lobby/LobbyScreen.tsx`:
  - Wire transfer dialog state (`useState<PublicPlayer | null>`)
  - Pass `viewerIsGm={isHost}` and `onTransferGm` to PlayerList/PlayerRow
  - Update `canStartGame` logic to count only non-GM players
- `packages/client/src/components/game/PlayingScreen.tsx`: add GM branch — if `viewerIsGm`, render placeholder ("Bạn là quản trò. Hãy điều phối trận đấu.") instead of card reveal UI. End game button stays GM-only.

**5. Vietnamese rename pass (mechanical)**

Find every occurrence and rename:
```bash
grep -rn "Chủ phòng" packages/client/src/
```

Replace "Chủ phòng" → "Quản trò" in ALL hits. Most likely affected:
- LobbyScreen.tsx (badges, tooltips)
- PlayerRow.tsx
- KickConfirmDialog.tsx
- ErrorScreen "Chủ phòng đã rời đi..." → "Quản trò đã rời đi..."

**Critical:** Do NOT rename variable names like `isHost`, `hostSessionId`. Only Vietnamese UI strings change.

**6. E2E test updates**

Update existing tests + add new test file:
- `tests/EF.gameplay_edge.spec.ts`:
  - `MIN_PLAYERS = 6` (was 5)
  - `PLAYER_SEED` adds 6th player (`Frank`, avatar `panda`)
  - E3 privacy audit: GM should receive ZERO `YOUR_CARD` messages (was 1)
  - Deck still 5 cards (matches 5 non-GM)
- `tests/D.lobby.spec.ts`: minor selector updates if any reference "Chủ phòng"
- `tests/G.gm.spec.ts` (NEW): 3 tests
  - G1: GM transfer in lobby succeeds, both clients reflect swap
  - G2: Non-GM does NOT see "Trao quản trò" buttons
  - G3: GM excluded from deal (no YOUR_CARD on GM page, placeholder visible)

### UI design constraints

The user has specified plain text style for the transfer button (option A from prior discussion):
- **Button label:** Just text "Trao quản trò" with a Crown icon to the left as a hint (not a Crown-only icon button)
- **Use `lucide-react`'s `Crown`** icon (already in deps)
- **Match existing button styles** in the project — see existing `KickButton` or similar for visual reference
- **No emoji icons** (project rule, see `CLAUDE.md`)
- **Vietnamese UI strings:** "Trao quản trò", "Bạn sẽ không còn là quản trò", "Trao cho {name}", "Hủy"

### Code identifier convention

User's hard rule (from project standards):
- **All code identifiers (variable, function, type, file names, comments) must be in English**
- **UI strings (visible to users) in Vietnamese**

Examples:
- ✅ `transferGm()`, `handleTransferGm()`, `TransferGmConfirmDialog`, `targetSessionId`
- ❌ `traoQuanTro()`, `xacNhanTraoQuyen()`
- ✅ Button text: "Trao quản trò"
- ✅ Comment: `// Validate sender is current GM before allowing transfer`

---

## Commit strategy

Commit incrementally — **each commit must leave the repo green** (compiles + tests pass at that snapshot):

```
1. chore: bump MIN_PLAYERS to 6, add TRANSFER_GM schema
2. feat(server): transferGm reducer + dealCards excludes GM
3. feat(client): state machine action for GM transfer
4. feat(client): transfer dialog + lobby UI button
5. feat(client): GM placeholder on PlayingScreen
6. chore: rename "Chủ phòng" → "Quản trò" in UI text
7. test(e2e): update suite for 6-player GM mode + new G.gm.spec.ts
8. docs: mark Sub-phase 4.1 complete in PHASE_4_PLAN.md
```

Use conventional commit format (chore/feat/test/docs). Detailed commit messages — explain WHY not just WHAT.

After all commits, push the branch:
```bash
git push origin phase-4-gm-mode
```

**Do NOT open a PR to main yet.** That happens after all sub-phases 4.1-4.4 complete.

---

## Acceptance criteria

Sub-phase 4.1 is done when ALL of these pass:

### Automated
- [ ] `npm run type-check` clean
- [ ] `npm test` shows 58/58 passing
- [ ] `npm run build` succeeds with no warnings
- [ ] All existing E2E tests pass (with selector adjustments where needed)
- [ ] New `tests/G.gm.spec.ts` exists and passes 3 tests
- [ ] CI on `phase-4-gm-mode` branch is green after push

### Manual smoke test (user will run this on local dev or deployed branch)

Open 6 browser tabs / contexts:

1. **Tab 1:** create room → see "Quản trò" badge on own row in lobby
2. **Tab 2-6:** join via 6-digit code → all 6 visible in player list
3. **Start button:** disabled until 6th tab joins (then enabled if deck valid + all ready)
4. **Tab 1 (GM):** tap "Trao quản trò" on Tab 4's row → confirm dialog appears with target name → confirm
5. **After transfer:** Tab 1's badge gone, Tab 4 now shows "Quản trò" badge. Tab 4 sees "Trao quản trò" buttons on other rows; Tab 1 doesn't.
6. **Tab 4 (new GM):** open deck editor, add 1 wolf + 4 villagers = 5 cards total
7. **Tab 1, 2, 3, 5, 6:** ready up
8. **Tab 4:** start game → transition plays on all 6
9. **After transition:**
   - Tabs 1, 2, 3, 5, 6 see card reveal screens with their assigned roles
   - Tab 4 (GM) sees "Bạn là quản trò. Hãy điều phối trận đấu." placeholder
10. **Tab 4:** tap "Kết thúc trận" → all 6 back to lobby, Tab 4 still GM, deck preserved

### Edge cases (verify don't break)

- [ ] During game (phase=playing), "Trao quản trò" button is NOT visible on any tab
- [ ] If only 5 tabs joined, start button still disabled ("Cần ít nhất 6 người chơi")
- [ ] Refresh on GM tab during lobby → reconnects, still GM
- [ ] Non-GM tabs never receive `YOUR_CARD` for the GM's seat (privacy preserved)

---

## When to stop and ask

Pause and ask the user (do NOT just guess) if:

- Any baseline check fails before changes start (52 tests not passing, build broken)
- After bumping `MIN_PLAYERS`, more than ~3 existing tests fail and the fix isn't obvious
- The rename "Chủ phòng" → "Quản trò" finds itself in a file you weren't expecting (e.g. some doc file or comment), unclear if it should change
- E2E tests fail in ways unrelated to the changes
- You discover Phase 4 dependency on something not mentioned in BRIEF/PLAN (e.g. WebSocket migration code needs updating)
- You hit a tool limitation (e.g. cannot install deps, cannot push)

Better to pause and confirm than to silently make assumptions that diverge from the locked plan.

---

## Reference docs already in repo

These are checked in on the `phase-4-gm-mode` branch. Read them as needed:

- `docs/PHASE_4_DECISIONS.md` — all 11 locked decisions (D1-D6 + Q1-Q5). Authoritative source on "why this scope".
- `docs/PHASE_4_PLAN.md` — overall Phase 4 broken into sub-phases 4.1-4.4
- `docs/PHASE_4.1_BRIEF.md` — high-level "what & why" for THIS sub-phase
- `docs/PHASE_4.1_PLAN.md` — file-by-file implementation detail with code snippets

In case of contradiction:
1. `PHASE_4_DECISIONS.md` (locked decisions) wins
2. `PHASE_4.1_PLAN.md` (implementation) is the procedural guide
3. This handover is a summary — defer to the above for detail

---

## Communication style with user

The user is technically engaged (TypeScript dev), communicates in Vietnamese, prefers:
- **Direct technical answers** — no unnecessary preamble
- **Vietnamese for chat conversation**, English for code (hard rule)
- **Targeted edits over full file rewrites** — token-efficient
- **Approve via small UI cards** — use any equivalent in your CLI (or just yes/no questions)
- **Honest QA + PO sign-off** — push back if something doesn't actually work; don't rubber-stamp

The user has explicitly said in past sessions: **"PO sign-off must be earned, not rubber-stamped."** Apply rigorous self-review before declaring acceptance criteria met.

---

## After all 8 commits land

Report back to user with:

```
✅ Sub-phase 4.1 complete on phase-4-gm-mode branch.

Tests: 58/58 server, all E2E passing including new G.gm.spec.ts (3 tests).
Build: clean, no warnings.

Commits pushed to origin/phase-4-gm-mode. Manual smoke test pending your run.

Acceptance criteria checklist:
- [✓] type-check clean
- [✓] 58/58 tests
- [✓] build succeeds
- [✓] E2E updates landed
- [✓] G.gm.spec.ts added with 3 tests
- [ ] manual smoke (pending user action)

When you run the smoke test, expected behavior is in `docs/PHASE_4.1_BRIEF.md`
"Acceptance criteria" section. Report back any issues and we'll iterate before
moving to Sub-phase 4.2.
```
