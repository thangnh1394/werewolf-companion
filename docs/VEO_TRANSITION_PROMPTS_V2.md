# Veo Prompts v2 — Stylized Animation

> **Style shift from v1:** photo-realistic → hand-drawn animation
>
> Match the painted illustration aesthetic of the app's card artwork.
> Reference: Studio Ghibli, Cartoon Saloon (Wolfwalkers, Song of the Sea),
> traditional 2D animation with painted backgrounds.

## Universal style keywords (use in EVERY prompt)

```
2D hand-drawn animation style, painted backgrounds, Studio Ghibli aesthetic,
soft brushstrokes, watercolor textures, stylized not photorealistic,
storybook illustration, fantasy concept art
```

These keywords steer Veo away from default photo-realistic toward illustrated/painted.

---

## Video 1 — Night Falls (`night.mp4`)

```
2D hand-drawn animation, Studio Ghibli style, painted illustration aesthetic.
Cinematic vertical 9:16 portrait. A dark forest at twilight rendered in
watercolor and ink. The sky transitions from deep amber sunset to a starry
night over 8 seconds. A large stylized full moon slowly rises from behind
silhouetted pine trees in the lower foreground. Distant wolf silhouettes on
a hill briefly appear. Slow ambient camera. Color palette: deep forest greens,
warm amber, charcoal black, painted texture visible. Storybook fantasy
atmosphere, NOT photorealistic. No text, no people, no faces.
```

---

## Video 2 — Campfire (`campfire.mp4`)

```
2D hand-drawn animation, Studio Ghibli style, painted illustration aesthetic.
Cinematic vertical 9:16 portrait. A magical campfire burning in a forest
clearing at night, rendered in watercolor and ink. Stylized warm orange
flames flicker and dance with bright amber sparks rising upward as glowing
dots. The fire grows from small embers to a roaring blaze over 8 seconds.
Camera slowly pulls back revealing painted tree silhouettes surrounding the
clearing. Color palette: warm amber, deep red embers, charcoal darkness with
visible brushstroke texture. Mystical fantasy ritual atmosphere, hand-drawn
look NOT photorealistic. No text, no people, no faces.
```

---

## Video 3 — Card Dealing (`dealing.mp4`)

```
2D hand-drawn animation, Studio Ghibli style, painted illustration aesthetic.
Cinematic vertical 9:16 portrait. Stylized mystical playing cards with
dark forest-themed backs glowing with amber light, rendered in watercolor
texture. Cards float and swirl in a circular dance through dark misty space,
with glowing amber light trails following each one like ink ribbons. After
5 seconds one central card slowly approaches the camera and stops, hovering
close. Magical glowing particle effects. Color palette: deep amber, gold,
dark charcoal misty background with painted texture. Storybook magic
atmosphere, hand-drawn NOT photorealistic, NO text on cards, no faces,
no people.
```

---

## Alternative if Ghibli style doesn't trigger well

Veo may not always honor "Studio Ghibli" keyword consistently. Fallback variations to try:

### Variation 1: Watercolor concept art
Replace `Studio Ghibli style` with:
```
watercolor concept art style, painted with traditional media,
visible brushstrokes, illustrated storybook fantasy
```

### Variation 2: Animated film
Replace with:
```
stylized animated film, hand-painted backgrounds, 2D cel animation,
NOT live action, NOT photorealistic, illustrated fantasy art
```

### Variation 3: Storybook illustration
Replace with:
```
fantasy book illustration come to life, painted in watercolor and gouache,
storybook style with thick painterly strokes, NOT photorealistic
```

---

## Critical "NOT" keywords

Negative prompts work in Veo. Always include some "NOT" instructions:
- `NOT photorealistic`
- `NOT live action`
- `NOT 3D rendered`
- `NOT CGI`

This actively pushes Veo away from its default photographic tendency.

---

## Visual checklist v2

Pick output if:
- ✅ Visible painted/brushstroke texture in frames
- ✅ Colors look slightly desaturated/painted (not photo-vivid)
- ✅ Edges of objects look slightly hand-drawn (not pixel-perfect photo)
- ✅ Atmospheric, illustrated quality

Reject if:
- ❌ Looks like real photographed scene
- ❌ Hyper-realistic lighting/textures
- ❌ Looks like 3D rendering
- ❌ Frame quality varies between shots (Veo glitching)

---

## Tips for Veo Vids interface

When you generate in vids.new:
1. Paste full prompt (including style keywords)
2. If output is photorealistic anyway, edit prompt → emphasize "2D hand-drawn"
3. Some Veo models có dropdown "Style" — chọn "Illustration" hoặc "Animation" nếu có
4. Try 2-3 retries với cùng prompt — Veo có variance, sometimes lần 2-3 stylized hơn

Sau khi có 3 videos approved, upload lên chat cho tôi optimize và integrate code.
