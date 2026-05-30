# Avatar Set — Gemini Image Generation Prompts (Kahoot-Style)

> Generate 20 character avatars matching Kahoot's playful, vector-flat illustration style. Used for user profile pictures in the werewolf companion app.

## Style reference: Kahoot avatars

Kahoot's character/avatar aesthetic:
- **Flat vector illustration**, NOT painterly, NOT photo-realistic
- **Bold rounded shapes**, simple geometry
- **Friendly expressive faces** with big eyes, simple smile
- **Vibrant solid color palette** — bright but slightly muted (not neon)
- **Character occupies ~70% of canvas**, centered
- **Solid colored background** or subtle radial gradient (NOT detailed scene)
- **Optional small accessory** (hat, glasses, props) for personality
- **No outlines** or very thin dark outlines only

## Base prompt template

Use this template for EACH of the 20 avatars, swap [DESCRIPTION] for each character:

```
A friendly cartoon character avatar in flat vector illustration style, similar to Kahoot game character avatars. Centered character, head and shoulders only or full-body in chibi/cute proportions. Big round eyes, simple expressive smile, soft rounded shapes, bold vibrant colors with slight muted/pastel tones. Solid colored background (not a detailed scene). NO text, NO letters, NO numbers, NO logos.

Character: [DESCRIPTION]

Style: flat vector, no outlines, modern playful illustration. Aspect ratio 1:1 (square). Suitable as a user profile avatar.
```

## The 20 character descriptions

Mix of werewolf-game-themed (subtle) + general fun characters. Each is distinctive:

### Werewolf-themed (subtle, fun)

1. **avatar_01_wolf**: A cute friendly cartoon wolf with big round eyes, smiling, dark grey fur with a small white patch on chest. Forest green background.

2. **avatar_02_owl**: A wise-looking cartoon owl with huge round amber eyes, perched, holding a tiny crystal ball. Dark blue background. Cute, not scary.

3. **avatar_03_villager_boy**: A young village boy character with messy brown hair, freckles, big smile, wearing a simple green tunic. Warm beige background.

4. **avatar_04_villager_girl**: A young village girl character with red braided hair, rosy cheeks, friendly smile, wearing a yellow dress. Warm pink background.

5. **avatar_05_witch**: A friendly witch character with purple hair, pointy hat, holding a tiny potion bottle, sweet smile. Dark purple background. NOT scary.

6. **avatar_06_seer**: A mystical fortune teller character with long silver hair, gentle smile, glowing third-eye gem on forehead. Indigo background.

7. **avatar_07_hunter**: A brave hunter character with green hood, determined smile, simple bow on back. Forest green background.

8. **avatar_08_moon**: A smiling cartoon full moon with rosy cheeks and closed eyes, sleeping/dreaming expression. Dark blue night sky background with tiny stars.

### General playful (variety for non-themed users)

9. **avatar_09_fox**: A cute orange fox with big eyes, fluffy tail, mischievous smile. Coral pink background.

10. **avatar_10_bear**: A round friendly brown bear with rosy cheeks, big smile, holding tiny honey jar. Warm yellow background.

11. **avatar_11_cat**: A black cat with bright green eyes, sitting, content smile, tiny pink nose. Lavender background.

12. **avatar_12_rabbit**: A white bunny with long floppy ears, pink nose, soft smile. Mint green background.

13. **avatar_13_panda**: A panda with classic black-and-white markings, big smile, holding bamboo. Soft green background.

14. **avatar_14_dragon**: A cute friendly baby dragon with tiny wings, green scales, big eyes, small fire puff. Orange background.

15. **avatar_15_robot**: A boxy cute robot with antenna, big square eyes showing happy expression, friendly smile. Cyan blue background.

16. **avatar_16_astronaut**: A cartoon astronaut character with helmet up, smiling face visible, white suit. Deep space purple background with tiny stars.

17. **avatar_17_chef**: A character with chef hat, mustache, big smile, holding tiny wooden spoon. Cream background.

18. **avatar_18_knight**: A friendly knight with helmet (visor up showing smiling face), simple armor, holding tiny shield. Slate blue background.

19. **avatar_19_pirate**: A cartoon pirate with bandana, eye patch (on one eye, smile on the other side), parrot on shoulder. Teal background.

20. **avatar_20_ninja**: A cute ninja character with black mask showing only friendly eyes, simple star symbol. Charcoal grey background.

## Settings recommendations

- **Aspect ratio:** 1:1 square
- **Resolution:** 512x512 or 1024x1024
- **Variations per prompt:** generate 2-3 per character → pick best
- **Style consistency:** add to EVERY prompt: "consistent with Kahoot-style flat vector character avatars"

## Naming convention

Save files as listed above:
```
avatar_01_wolf.png
avatar_02_owl.png
...
avatar_20_ninja.png
```

## After generating

Send all 20 files (PNG or JPG, original resolution) to me. I will:

1. Optimize each → WebP 200×200 quality 85 (target ~10-15 KB each)
2. Total bundle ≤ 300 KB for all 20 avatars
3. Save to `packages/client/public/avatars/`
4. Build a manifest file `avatars.ts` with metadata (id, label, optional category)
5. Implement Profile editor UI + avatar picker

## Visual checklist when picking variations

- ✅ Character clearly centered, no awkward cropping
- ✅ Background SOLID color (or very simple gradient), not detailed scene
- ✅ Friendly/cute, not scary (even witch/wolf should be approachable)
- ✅ Style consistent across all 20 (same flatness, same eye style, same color richness)
- ✅ Distinct from each other (no two look alike)
- ✅ NO text, NO letters baked into image
- ❌ Avoid hyper-realistic or photo-style
- ❌ Avoid dark/edgy (this is for a fun party game)

## Tip for batch generation

If Gemini lets you generate multiple in one prompt, paste all 20 character descriptions in a single request with the base template. Otherwise, run 20 separate prompts. Either way, keep the style instruction identical to maintain consistency.
