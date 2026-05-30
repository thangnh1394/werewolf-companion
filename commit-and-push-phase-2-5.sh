#!/bin/bash
# Phase 2.5 — Commit and push to GitHub
# Usage: bash commit-and-push-phase-2-5.sh

set -e  # Exit on error

echo "📋 Phase 2.5 — Tap-and-hold reveal + AI assets"
echo ""

# Stage all changes
echo "→ Staging files..."
git add packages/shared/src/cards.ts
git add packages/client/src/components/game/PlayingScreen.tsx
git add packages/client/src/components/game/RevealCard.tsx
git add packages/client/public/cards/alpha_wolf.webp
git add packages/client/public/cards/card-back.webp
git add packages/client/public/cards/card-back.svg
git add docs/BRIEF_PHASE_2_5.md
git add docs/ACCEPTANCE_PHASE_2_5.md
git add docs/CARD_BACK_PROMPT.md
git add docs/ALPHA_WOLF_PROMPT.md
git add HANDOVER_PHASE_2_5.md
git add package-lock.json

echo "→ Files staged:"
git status --short

echo ""
read -p "→ Continue with commit? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

# Commit
git commit -m "Phase 2.5 — Tap-and-hold reveal + AI-generated assets

- New: RevealCard component with tap-and-hold + tilt animation
- New: card-back.webp (Gemini-generated) + SVG fallback
- Replaced: alpha_wolf.webp with new artwork
- Added: shortAbility field to 15 cards in cards.ts
- Rewrote: PlayingScreen with face-down default + Xem chi tiết button
- Tap-and-hold scope limited to card div (not full screen)
- Same format/size for front and back, tilt only during transition"

echo ""
echo "→ Pushing to origin/main..."
git push origin main

echo ""
echo "✅ Done! GitHub Actions will auto-deploy."
echo "   Watch: https://github.com/thangnh1394/werewolf-companion/actions"
