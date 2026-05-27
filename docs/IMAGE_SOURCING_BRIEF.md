# Image Sourcing Brief — Phase 2.1 Card Foundation

> **Agent:** Designer
> **Phase:** 2.1
> **For:** User / Claude Code to hand-pick 15 Pexels images
> **Theme:** "Bàn gỗ kể chuyện" — dark forest, warm lantern light, mysterious

## How to use this document

For each of the 15 roles below, this brief gives you:
- **Primary query** — paste into pexels.com search
- **Visual direction** — what to look for in the image
- **Fallback queries** — if primary doesn't surface good options
- **Mood keywords** — additional terms to refine

After picking an image, document:
- Photographer name + Pexels photo URL → for attribution
- Save to `packages/client/public/cards/<role_id>.webp`

## Image optimization (after download)

Use one of these tools to standardize each image:

### Option A — Online (no install)
1. Go to [Squoosh](https://squoosh.app/)
2. Upload original image
3. **Resize:** 400 × 400 px (crop to square if needed; center on subject)
4. **Format:** WebP
5. **Quality:** 80-85%
6. Target output: ≤ 33 KB each
7. Save as `<role_id>.webp`

### Option B — CLI (faster for batch)

```bash
# Install once
npm install -g sharp-cli

# Resize + convert (one command per image)
sharp -i wolf.jpg -o werewolf.webp --resize 400 400 --webp 85
```

### Option C — Ask Claude Code

```
Tôi vừa download 15 ảnh vào folder ~/Downloads/wolf-images/.
Hãy resize tất cả về 400x400 WebP @ 85% quality, đặt tên theo role ID,
move vào packages/client/public/cards/.
Use sharp library. Verify mỗi file ≤ 33KB.
```

## Universal guidelines (apply to ALL 15)

✅ **Look for:**
- Dark backgrounds (forest, night sky, dim interiors)
- Warm light sources (lanterns, fire, moonlight casting amber tones)
- Single subject in center 60% of frame (crops cleanly to square)
- Symbolic, evocative — NOT literal/cartoonish
- Painted/illustrated style preferred over realistic photo IF available, but photo OK if mood matches
- High contrast (subject pops against background)

❌ **Avoid:**
- Bright daylight scenes
- Modern/urban settings
- Faces with clear identifying features (privacy — even on Pexels)
- Cartoonish or "cute" Halloween imagery
- Stock-photo-cliché poses (e.g., people in costume holding props)
- Logos, watermarks, brand-recognizable elements

---

## 🐺 Phe Sói (4 cards)

### 1. `werewolf` — Sói Thường

- **Primary query:** `wolf full moon dark`
- **Visual direction:** Lone wolf silhouette against full moon OR pair of glowing yellow eyes in dark forest. Should feel menacing but elegant — not gory.
- **Mood:** Predator, prowling, night hunt
- **Fallbacks:** `wolf eyes night`, `wolf silhouette moonlight`, `gray wolf dark`
- **Reference:** Search results from designer indicate strong options in this category — plenty of choices.

### 2. `alpha_wolf` — Sói Tiên Tri

- **Primary query:** `crystal ball mystical dark`
- **Visual direction:** Glowing crystal ball OR wolf with one glowing eye (symbolic of "seeing" power). Difference from werewolf: must convey the SEEING/divination aspect.
- **Mood:** Knowing, watchful, supernatural
- **Fallbacks:** `mystical orb fortune`, `wolf glowing eye`, `dark divination`

### 3. `wolf_alpha` — Sói Trùm

- **Primary query:** `alpha wolf pack leader`
- **Visual direction:** Single dominant wolf standing tall, possibly with subtle hint of other shapes behind (pack). OR an antler crown / horns motif.
- **Mood:** Leadership, authority, dominance
- **Fallbacks:** `wolf pack leader`, `crowned wolf`, `dominant wolf stance`

### 4. `cursed_wolf` — Sói Nguyền

- **Primary query:** `cursed dark ritual`
- **Visual direction:** Skull, candles in a circle, or wolf with red-glow eye (curse mark). Should suggest contamination/spreading.
- **Mood:** Cursed, transformative, ominous
- **Fallbacks:** `dark curse ritual`, `red moon wolf`, `transformation magic`

---

## 🏘️ Phe Dân Làng (9 cards)

### 5. `villager` — Dân Làng

- **Primary query:** `village lantern night`
- **Visual direction:** Warm lit window of a wooden cabin, OR a single lantern on a wooden porch. Conveys "ordinary villager" — humble, no special power. NO faces if possible.
- **Mood:** Quiet, peaceful, vulnerable
- **Fallbacks:** `cottage lantern night`, `medieval village dark`, `warm window cabin`

### 6. `seer` — Tiên Tri

- **Primary query:** `crystal ball seer purple`
- **Visual direction:** Crystal ball with smoke/mist inside OR tarot cards spread on dark wood. Mystical but on the GOOD side (so warmer tones than alpha_wolf's version).
- **Mood:** Wise, perceptive, ethereal
- **Fallbacks:** `fortune teller crystal`, `divination cards dark`, `oracle mystical`

### 7. `bodyguard` — Bảo Vệ

- **Primary query:** `shield medieval dark`
- **Visual direction:** A medieval shield against stone/wood backdrop OR strong arm with armor. Symbol of protection.
- **Mood:** Strong, vigilant, dependable
- **Fallbacks:** `knight armor dark`, `medieval shield wood`, `guard helmet`

### 8. `witch` — Phù Thủy

- **Primary query:** `witch potion bottles candle`
- **Visual direction:** Glass apothecary bottles with colorful liquid, candle flicker. Should show duality (heal vs kill = green + red potions visible).
- **Mood:** Mysterious, knowledgeable, dual-natured
- **Fallbacks:** `apothecary bottles dark`, `magic potions glow`, `alchemist table`

### 9. `hunter` — Thợ Săn

- **Primary query:** `crossbow medieval dark`
- **Visual direction:** Crossbow OR bow against forest bark, OR an arrow with feathered fletching. Suggests "one shot, takes them with me."
- **Mood:** Patient, deadly, accurate
- **Fallbacks:** `archer bow dark forest`, `arrow quiver`, `medieval weapon`

### 10. `little_girl` — Bé Gái

- **Primary query:** `child window peeking night`
- **Visual direction:** Silhouette of small figure looking through curtain/door crack, lit by warm light. NO clear faces. Convey "peeking secretly."
- **Mood:** Innocent, curious, vulnerable
- **Fallbacks:** `silhouette curtain light`, `keyhole peek light`, `child shadow doorway`

### 11. `elder` — Già Làng

- **Primary query:** `walking staff cane wooden`
- **Visual direction:** Walking staff leaning against weathered wood, OR weathered hands holding a wooden cane. Suggests "twice-lived" toughness.
- **Mood:** Aged, weathered, resilient
- **Fallbacks:** `old hands cane`, `weathered staff wood`, `elder walking stick`

### 12. `sorcerer` — Pháp Sư

- **Primary query:** `spellbook candle ancient`
- **Visual direction:** Open ancient book with glow, possibly with magical particles. Different from witch: more "academic magic" feel.
- **Mood:** Scholarly, probing, secretive
- **Fallbacks:** `magic book glow dark`, `wizard tome candle`, `ancient spellbook`

### 13. `servant` — Người Hầu

- **Primary query:** `mask theatrical dark`
- **Visual direction:** Venetian-style mask OR theatre masks (the "two faces" hint at role-swap). Dark backdrop with warm spotlight.
- **Mood:** Adaptable, watchful, identity-shifting
- **Fallbacks:** `venetian mask dark`, `theatre masks shadow`, `bauta mask`

---

## 🌑 Phe Trung Lập (2 cards)

### 14. `cupid` — Cupid

- **Primary query:** `arrow heart dark romantic`
- **Visual direction:** Arrow with heart-shaped tip OR two candles tied with red ribbon. Romantic but with a dark undertone (the "bound fate" aspect).
- **Mood:** Romantic, fateful, bittersweet
- **Fallbacks:** `red ribbon candles`, `cupid arrow dark`, `intertwined hearts shadow`

### 15. `thief` — Tên Trộm

- **Primary query:** `hooded figure shadow`
- **Visual direction:** Hooded silhouette OR hands stealing something in dim light (coin pouch, key, cards). Conveys "swap identity."
- **Mood:** Sneaky, opportunistic, hidden
- **Fallbacks:** `hood cloak shadow`, `pickpocket hand silhouette`, `mysterious thief dark`

---

## Quality checklist before commit

Before adding final images to the repo, verify each:

- [ ] File is exactly 400×400 px
- [ ] File size ≤ 33 KB
- [ ] WebP format
- [ ] Filename is `<role_id>.webp` (lowercase, matches the ID column above)
- [ ] Photographer name recorded in `packages/client/src/lib/cards.ts` (in `photographer` field)
- [ ] Pexels photo URL recorded (for attribution page)
- [ ] Visual matches "dark forest + warm light" mood (no neon-bright photos)
- [ ] Total folder `public/cards/` ≤ 500 KB

## Attribution data template

For each image picked, add to `packages/client/src/lib/cards.ts`:

```ts
{
  id: 'werewolf',
  name: 'Sói Thường',
  team: 'wolf',
  ability: 'Mỗi đêm cùng các sói khác chọn 1 dân để giết',
  imageUrl: '/cards/werewolf.webp',
  photographer: 'Caleb Falkenhagen',                                  // ← from Pexels
  photoUrl: 'https://www.pexels.com/photo/wolf-in-dark-28217301/',    // ← from Pexels
  popular: true,
}
```

## Pexels TOS reminders

- ✅ Free for commercial use
- ✅ Attribution not required by license, but RECOMMENDED (we'll show on About page anyway)
- ✅ Downloading + self-hosting = OK
- ❌ Don't hotlink Pexels CDN long-term
- ❌ Don't claim original authorship

## Time estimate

Hand-picking 15 images: **30-45 minutes** if done with Claude Code:
1. ~15 min — Open Pexels, paste queries, pick best match per role
2. ~10 min — Download all to one folder
3. ~5 min — Claude Code runs sharp script to resize + convert all 15 at once
4. ~5 min — Move to `public/cards/`, update `cards.ts` with photographer credits
5. ~5 min — Verify in browser, swap any that look wrong
