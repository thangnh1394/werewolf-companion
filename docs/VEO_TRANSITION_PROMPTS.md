# Veo Prompts — Game Start Transitions

> 3 short videos for the werewolf companion app's game-start transition.
> Generate via Google Veo (qua Gemini) — free tier.
>
> **Universal settings:**
> - **Aspect ratio:** 9:16 (vertical, portrait phone)
> - **Duration:** 8 seconds (Veo max cap)
> - **Style:** Dark fantasy, cinematic, atmospheric
> - **Mood:** Mystical, slightly ominous but inviting — NOT horror
> - **Resolution:** Veo default (will be re-encoded to 720x1280 anyway)
> - **NO text, letters, numbers, logos** in any frame (Veo's text tends to be garbled)
> - **NO faces, no characters** (avoid uncanny valley + privacy issues)
>
> **Why these constraints:**
> - Portrait 9:16 fills mobile UI without letterboxing.
> - 8s matches Veo's cap. App will play through full duration before revealing card UI.
> - No text in video = we overlay narrative text in HTML afterwards (more flexible, localizable).
> - No faces = atmospheric only, characters are imagined.

---

## Video 1 — Night Falls (`night.mp4`)

### Prompt

```
Cinematic vertical shot, 9:16 portrait. A dark forest at twilight. The sky transitions
from deep amber sunset to a starry night over 8 seconds. A large glowing full moon
slowly rises from behind silhouetted pine trees in the lower foreground. Distant
howling wolf silhouettes briefly appear on a hill. Slow ambient camera, no motion
blur. Color palette: deep forest greens, warm amber, charcoal black. Mystical fantasy
atmosphere. No text, no people, no faces.
```

### Notes
- "8 seconds" được nhấn để Veo pace toàn bộ progression
- "slow ambient camera" tránh Veo dùng dynamic camera moves
- "no people, no faces" để tránh uncanny valley nhân vật

---

## Video 2 — Campfire (`campfire.mp4`)

### Prompt

```
Cinematic vertical shot, 9:16 portrait. A magical campfire burning in a clearing
deep in a dark forest at night. Warm orange flames flicker and dance with bright
amber sparks rising upward and dissolving into darkness. The fire grows from small
embers to a roaring blaze over 8 seconds. The camera slowly pulls back to reveal
faint silhouettes of trees surrounding the clearing. Deep dark background, glowing
fire is the only light source. Color palette: warm amber, deep red embers, charcoal
darkness. Mystical fantasy ritual atmosphere. No text, no people, no faces.
```

### Notes
- "Pull back" thay vì zoom in để reveal scope
- "Silhouettes of trees" (chứ không phải người) — chỉ environmental
- Đảm bảo fire là focal point

---

## Video 3 — Card Dealing (`dealing.mp4`)

### Prompt

```
Cinematic vertical shot, 9:16 portrait. Mystical playing cards with dark forest-themed
backs glowing with golden amber light. Cards float and swirl in a circular dance
through dark misty space, with glowing amber trails following each one. After 5
seconds, one central card slowly approaches the camera and stops, hovering close as
if about to be flipped. Magical particle effects. Color palette: deep amber, gold,
dark charcoal background. Mystical fantasy magic atmosphere. No text on cards, no
faces, no people.
```

### Notes
- "Dark forest-themed backs" để cards match aesthetic của app
- "Approaches the camera and stops" — không zoom past, để smooth transition vào card UI
- "Particle effects" tăng magical feel

---

## Workflow

### Bước 1: Generate
Mở Gemini với Veo access → paste từng prompt → generate.

**Tips:**
- Nếu output không như ý, regenerate 2-3 lần (cùng prompt) — Veo có variance
- Save mỗi variant với tên: `night.mp4`, `campfire.mp4`, `dealing.mp4`
- Nếu Veo offer multiple variations per prompt, chọn variation hợp lý nhất

### Bước 2: Upload
Upload 3 file `.mp4` cho tôi:
- night.mp4
- campfire.mp4
- dealing.mp4

### Bước 3: Tôi optimize
- Convert MP4 → WebM VP9 (smaller size, same quality)
- Target ≤ 800 KB mỗi video, ≤ 2.5 MB total
- Strip audio (videos không cần audio, save bandwidth)
- Resize to 720x1280 nếu cần
- Move sang `packages/client/public/transitions/`

### Bước 4: Refactor code
- Replace 4 SVG transition components → 1 `VideoTransition` component
- Remove framer-motion dependency (save -42 KB gzipped!)
- Native `<video>` element handles playback
- Server vẫn pick random variant (logic không đổi)
- Duration uniform 8s

---

## Visual checklist khi pick output

✅ **Approve nếu:**
- Camera motion ổn định, không glitch
- Color palette dark fantasy đúng
- Không có text/letter nào trong frame
- Không có character/face nào
- Loop kết thúc smooth (frame cuối không cắt giữa motion)
- Atmosphere "mystical" không quá horror

❌ **Reject + regenerate nếu:**
- Có hallucinated text/letters
- Camera glitch hoặc jump cuts
- Color quá saturated hoặc quá tối (không thấy gì)
- Có nhân vật / face xuất hiện
- Frame cuối kết thúc giữa motion (sẽ cảm thấy bị cắt)
- Quá short (< 5s) hoặc quá long (> 9s)

---

## Backup plan

Nếu Veo output cho variant nào không đẹp sau 3-4 lần retry:
- **Skip variant đó** — server logic dễ adjust để chỉ random 2/3 variants
- **Hoặc dùng SVG+Framer fallback** cho variant fail (mix approach)
- **Hoặc tìm trên Pexels/Mixkit** — free stock video có "forest night", "campfire", "magic cards"

Báo tôi sau khi gen xong + upload videos nhé!
