# Sói Tiên Tri (alpha_wolf) — Gemini Image Generation Prompt

> Generate a card art for "Sói Tiên Tri" (Alpha Wolf / Seer Wolf) — a werewolf with prophetic / scrying powers. Must match the existing card art style (painterly digital illustration, dark forest, amber lighting, square 1:1).

## Role context

Sói Tiên Tri là một con sói có khả năng tiên tri như vai Tiên Tri thật — mỗi đêm có thể soi 1 người để biết vai trò của họ. Sói nhưng có "con mắt thứ ba" / sức mạnh huyền bí.

Visual concept ideas: wolf with glowing eyes / wolf staring into a crystal orb / wolf with arcane runes / wolf with one eye shining like a divination orb.

## Primary prompt (recommended — copy-paste vào Gemini)

```
A painterly digital illustration of a mystical alpha werewolf with prophetic powers, centered composition, square 1:1 aspect ratio.

Subject: a large dark-furred wolf with intense glowing amber eyes, sitting or standing majestically in a misty moonlit forest clearing. One of its eyes glows brighter — a third-eye effect, like seeing visions. Faint mystical runes or arcane symbols float in the air around its head, glowing softly in warm amber light.

Atmosphere: dark fantasy tabletop game card art, tarot-card aesthetic. Pine tree silhouettes in the background, soft moonlight from above, low fog at the wolf's paws. Mysterious, powerful, otherworldly.

Color palette: deep forest greens and blacks (#1F2419 background tones), warm amber glow (#E89B3C) for the magical eye and rune accents, muted gold filigree-like wisps of magic. Low saturation overall, high contrast on the wolf.

Style: painterly oil-painting feel, similar to dark fantasy card games (e.g. Magic: The Gathering, Mystery of the Abbey). NOT cartoon, NOT photoreal. Detailed fur, expressive eyes, atmospheric lighting.

NO text, NO letters, NO numbers, NO frames or borders.
```

## Alternative prompt 1 (wolf with crystal orb)

```
A painterly digital illustration of an alpha werewolf with divination powers. A large dark wolf gazing intently into a glowing amber crystal orb floating before it, in a moonlit foggy forest. The orb reflects a faint vision inside (a shadowy figure, a clue). Centered composition, square 1:1.

Atmosphere: dark fantasy card game art. Pine silhouettes, low fog, soft moonlight. Mysterious and powerful.

Colors: forest dark base (#1F2419), warm amber accents (#E89B3C), muted gold magical glow.

Style: painterly oil illustration, dark tarot aesthetic. NO text, NO borders.
```

## Alternative prompt 2 (wolf with third eye)

```
A painterly digital illustration of a mystical alpha werewolf with a glowing third eye on its forehead emitting amber light, standing in a dark moonlit pine forest. The wolf has dark fur, sharp features, an air of ancient wisdom and predatory power combined. Subtle arcane runes glow faintly in the mist around it.

Square 1:1 aspect ratio, centered composition. Painterly fantasy card game art style.

Colors: deep forest green-black (#1F2419), warm amber glow (#E89B3C). Low saturation, high contrast on the wolf.

NO text or borders. Dark fantasy mood.
```

## Settings recommendations

- **Aspect ratio:** 1:1 square
- **Variations:** generate 3-4 cùng prompt, pick cái match best với 14 cards hiện có
- **Reference image (nếu Gemini cho upload):** có thể upload 1 ảnh cards hiện tại (vd `werewolf.webp` hoặc `wolf_alpha.webp`) làm style reference

## Consistency checklist (so với 14 cards hiện tại)

Khi pick ảnh, check:

- ✅ **Painterly, không photo-realistic** — match style chung
- ✅ **Subject centered** chiếm 60-70% khung
- ✅ **Dark forest atmosphere** (pine trees, fog, moonlight)
- ✅ **Warm amber lighting** ở subject (giống cách `werewolf.webp` có moon vàng, `wolf_alpha.webp` có rim light vàng)
- ✅ **Vignette tối** ở 4 góc — focus vào center
- ✅ **Mood serious / dramatic** — không cute, không cartoon

## Sau khi generate

1. **Download** ảnh tốt nhất
2. **Optimize:** Squoosh.app → resize 400×400 → WebP 85% (target ≤33 KB)
3. **Đặt tên:** `alpha_wolf.webp`
4. **Send file cho tôi** trong chat — tôi sẽ:
   - Verify file size + quality
   - Replace `/home/claude/werewolf-companion/packages/client/public/cards/alpha_wolf.webp`
   - Package zip mới cho bạn deploy

## Quy trình full với card back nữa

Nếu bạn cũng generate card back trong cùng session Gemini:
- Card back: dùng prompt từ `CARD_BACK_PROMPT.md` (đã có sẵn)
- Sói Tiên Tri: dùng 1 trong 3 prompts ở trên

Gửi cả 2 ảnh cho tôi → tôi sẽ:
1. Replace `alpha_wolf.webp` + add `card-back.webp` vào public/cards/
2. Verify total bundle size (currently 340KB images, target ≤500KB)
3. Re-package zip Phase 2.5 với assets mới
4. Bạn deploy 1 lần là xong cả 2 thay đổi visual
