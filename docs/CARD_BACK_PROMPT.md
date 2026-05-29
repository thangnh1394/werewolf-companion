# Card Back — Gemini Image Generation Prompt

> Generate the card back (mặt úp) shown when a player hasn't revealed their role yet. Must match the existing 15 card artwork theme: "Bàn gỗ kể chuyện" (forest dark + warm amber lantern light).

## Primary prompt (copy-paste vào Gemini)

```
A mysterious tarot-style card back design for a werewolf party game, viewed straight-on (flat, centered, symmetrical).

Style: dark atmospheric digital illustration, painterly, cohesive with a moonlit forest storytelling theme.

Central motif: a glowing amber lantern OR a full moon partially hidden behind dark pine tree silhouettes, with subtle wolf imagery woven into the shadows.

Color palette: deep forest green-black background (#1F2419), warm amber accents (#E89B3C), muted gold filigree border. Low saturation, high contrast, candle-lit mood.

Composition: ornate symmetrical border frame (like a vintage playing card back), intricate but not cluttered, with a single focal emblem in the center. NO text, NO letters, NO numbers anywhere.

Mood: secretive, mysterious, inviting — "hold to reveal your secret role". Premium board-game card aesthetic.

Square aspect ratio (1:1). Centered composition with breathing room around the central emblem.
```

## Alternative prompt (nếu muốn đơn giản hơn)

```
A minimalist mysterious card back for a werewolf game. Centered glowing amber moon emblem over a dark forest-green background (#1F2419). Subtle geometric filigree border in muted gold (#E89B3C). Symmetrical, flat, straight-on view. No text or numbers. Dark, secretive, candle-lit mood. Square 1:1 aspect ratio. Premium tabletop card aesthetic.
```

## Settings recommendations

- **Aspect ratio:** 1:1 (square) — match các card khác
- **Số lượng generate:** 4 variations → pick cái đẹp nhất
- **Nếu Gemini cho chỉnh:** ưu tiên cái có border đối xứng + emblem rõ ở center

## Sau khi generate

1. **Download** ảnh đẹp nhất
2. **Optimize:** Squoosh.app → resize 400×400 → WebP 85% (target ≤33 KB)
3. **Đặt tên:** `card-back.webp`
4. **Move vào:** `packages/client/public/cards/card-back.webp`
5. Code đã reference sẵn path này (tôi sẽ set trong Developer phase)

## Yêu cầu quan trọng

- ❌ **KHÔNG có text/chữ/số** trong ảnh (vì sẽ có text overlay "Giữ để xem" từ code)
- ✅ **Đối xứng** — card back đẹp khi đối xứng (như bài thật)
- ✅ **Center emblem rõ ràng** — moon/lantern làm focal point
- ✅ **Dark theme** — phải hợp với #1F2419 background của app
- ✅ **1:1 square** — cùng tỉ lệ với 15 card images

## Tip: Đảm bảo consistency

Nếu bạn còn nhớ prompt đã dùng để generate 15 card images (Phase 2.1), thêm style keywords tương tự vào đây để card back match phong cách. Ví dụ nếu 15 cards là "painterly illustration" thì giữ "painterly"; nếu là "flat vector" thì đổi sang "flat vector emblem".

## Fallback nếu chưa có ảnh

Trong khi chờ generate, code sẽ dùng placeholder SVG (lantern emblem) — app vẫn chạy được, chỉ là card back chưa đẹp như ý. Sau khi có `card-back.webp`, chỉ cần drop file vào `public/cards/` và redeploy.
