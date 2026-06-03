# Roadmap

## Phase 1 — Foundation & Lobby System ✅ Complete

6-digit room codes, host system, ready check, kick with confirm dialog,
QR + link share, localStorage name + session restore, host disconnect timeout,
2-hour idle TTL, max 20 / min 5 player validation, reconnect / refresh support.

## Phase 2 — Card System & Gameplay Loop ✅ Complete

15 role cards with AI-generated artwork, Room Desk Editor (host composes deck
before dealing), server-side Fisher-Yates shuffle, private card delivery per
player (`YOUR_CARD` — never broadcast), tap-and-hold reveal with tilt animation,
end-game flow (deck preserved for next round), room lock during play.

## Phase 3 — Polish ✅ Complete

Role thumbnails in Room Desk chips, 20-avatar set + customizable profile
(name + avatar), QR expand-on-tap for physical scanning, cinematic game-start
transitions (3 random variants — 2 Veo AI-generated, 1 custom CSS animation),
avatar pre-fill on create/join forms.

## Phase 4 — GM Mode 🚧 Planned

Game Master view: host opts in, does not receive a card, sees all player
role assignments during the game. Development in branch `phase-4-gm-mode`.
See `docs/PHASE_4_DECISIONS.md` for captured design decisions.
