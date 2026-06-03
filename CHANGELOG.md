# Changelog

## Phase 3.4 — Game-start transitions
- 3 random cinematic transitions (Night Falls, Campfire, Card Dealing)
- Server picks variant for whole room → synchronized intro
- Videos: 2 AI-generated cartoon (Veo), 1 custom-rendered CSS animation
- Total transition assets: 4.6 MB

## Phase 3.2 + 3.3 — Profile system + UX polish
- 20-avatar set (Kahoot-style flat vector, AI-generated)
- Profile editor (name + avatar) on home + forms
- QR expand-on-tap for easier physical scanning
- Avatar refill on create/join forms

## Phase 3.1 — Visual polish
- Role thumbnails in Room Desk chips (replaced gradient placeholders)

## Phase 2 — Gameplay loop
- 15 role cards with AI-generated artwork
- Room Desk Editor (compose deck before dealing)
- crypto.getRandomValues() Fisher-Yates shuffle
- Tap-and-hold reveal with tilt animation
- End game flow (deck preserved for next round)

## Phase 1 — Foundation
- Lobby system: 6-digit room codes, host system, ready check, kick
- PartyKit + Durable Objects realtime backend
- XState state machine for connection lifecycle
- Reconnect / refresh support
