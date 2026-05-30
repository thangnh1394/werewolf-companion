# Card Back — Gemini Image Generation Prompt (Portrait v2)

> **CHANGE FROM v1:** Aspect ratio đổi từ 1:1 (square) sang **portrait ~5:7** (vertical, fit khung card aspect 0.7). Ảnh không bị crop/stretch khi đặt trong card frame.

## Primary prompt (copy-paste vào Gemini)

```
A mysterious tarot-style card back design for a werewolf party game, viewed straight-on (flat, centered, symmetrical), portrait orientation (vertical card shape, aspect ratio approximately 5:7 or 2:3 — like a real playing card).

Style: dark atmospheric digital illustration, painterly, ornate gilded filigree, cohesive with a moonlit forest storytelling theme.

Central motif (vertically centered, upper-middle area): a glowing amber full moon with dark pine tree silhouettes in front of it, a small howling wolf silhouette on a cliff in the foreground, faint hanging lantern beside the moon.

Border: thick symmetrical gilded filigree frame on all four edges (top, bottom, left, right), with ornate gold scrollwork, oak leaves, and subtle moon phase symbols at the midpoints of each edge. The border should completely surround the central artwork like a vintage tarot card. Top center has a small wolf paw print emblem; bottom center has a matching emblem (paws or claw).

Atmosphere: deep forest green-black background (#1F2419), warm amber moon glow (#E89B3C), muted aged-gold filigree details. Low saturation, candle-lit mysterious mood.

Composition: PORTRAIT (taller than wide), with the central round emblem in the upper-middle portion of the card, ornate borders running top-to-bottom. NO text, NO letters, NO numbers anywhere.

Mood: secretive, mysterious, inviting — "hold to reveal your secret role". Premium board-game card aesthetic, similar to high-quality tarot card backs or Magic: The Gathering card backs.

Aspect ratio: 5:7 (portrait, tall card shape). NOT square.
```

## Settings

- **Aspect ratio:** 5:7 hoặc 2:3 (portrait/tall) — KHÔNG square
  - Nếu Gemini có option chọn: pick "portrait" hoặc "tall" hoặc "2:3"
  - Nếu chỉ có 1:1 và 16:9: chọn 9:16 (portrait) rồi crop nhẹ
- **Resolution:** 1024×1456 hoặc tương đương (target dimensions)
- **Variations:** generate 3-4, pick best
- **Reference image:** có thể upload card-back.webp cũ làm style reference

## Vì sao đổi sang portrait

Card frame trong app dùng aspect-ratio 0.7 (cao 1.43× rộng — tỉ lệ bài tây). Ảnh 1:1 đặt trong khung dọc sẽ:
- Bị crop trên/dưới (nếu object-fit: cover) → mất phần border filigree
- Hoặc bị stretch méo (nếu object-fit: fill)
- Hoặc có viền trống (nếu object-fit: contain)

Ảnh portrait fit thẳng vào khung → giữ trọn vẹn composition + border filigree.

## Sau khi generate

1. **Download** ảnh đẹp nhất (vertical orientation)
2. **Verify aspect ratio:** check dimensions phải gần với 5:7 (vd 800x1120, 1000x1400, etc.)
3. **Send file cho tôi** trong chat — tôi sẽ:
   - Optimize sang WebP với quality cao hơn để giữ filigree sharp
   - **Target size: ~70-90 KB** (cao hơn rule 33 KB nhưng OK vì decorative + bạn đã accept)
   - Replace card-back.webp
   - Update RevealCard.tsx nếu cần điều chỉnh CSS để tận dụng portrait

## Yêu cầu vẫn giữ nguyên

- KHÔNG có text/chữ/số
- Đối xứng trục dọc
- Border filigree đầy đủ 4 cạnh (top/bottom/left/right)
- Dark theme match #1F2419 background
- Portrait orientation (đây là điểm thay đổi chính)
