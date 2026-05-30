# Sói Tiên Tri (alpha_wolf) — Gemini Image Generation Prompt (Portrait v2)

> **CHANGE FROM v1:** Aspect ratio đổi từ 1:1 sang portrait ~5:7 để fit khung card. KHÔNG redo nếu bạn đã có ảnh 1:1 ưng ý (1:1 cards trong Phase 2.1 hiển thị trong khung vuông nhỏ của Main Desk + CardDetailDialog, OK; chỉ RevealCard mới cần portrait).

## Khi nào cần redo alpha_wolf sang portrait?

**KHÔNG cần** nếu:
- Ảnh hiện tại (1:1) hiển thị OK trong Main Desk + CardDetailDialog (khung vuông) → giữ nguyên
- RevealCard hiển thị ảnh role trong khung vuông nhỏ bên trong card (52% width, aspect 1) → ảnh 1:1 vẫn fit

**CẦN** nếu:
- Bạn muốn ALL 15 role cards sang portrait để consistent (lớn effort, không necessary)

## Recommended: GIỮ alpha_wolf.webp 1:1 hiện tại

Lý do:
- 15 role cards Phase 2.1 đều 1:1, đã hoạt động tốt
- Trong RevealCard, ảnh role hiển thị trong khung VUÔNG nhỏ (52% rộng, aspect-ratio: 1) bên trong card frame portrait — KHÔNG cần ảnh portrait
- Chỉ background card-back mới cần portrait (vì nó fill toàn khung)

## Nếu vẫn muốn portrait alpha_wolf

Prompt:

A painterly digital illustration of a mystical alpha werewolf with prophetic powers, centered composition, PORTRAIT 5:7 aspect ratio (vertical, taller than wide).

Subject: a large dark-furred wolf with intense glowing amber eyes, sitting majestically in a misty moonlit forest clearing. A glowing third-eye mark on its forehead emits warm amber light. Faint mystical runes float in a halo around its head, glowing softly in amber.

Atmosphere: dark fantasy tabletop game card art, tarot-card aesthetic. Pine tree silhouettes in the background, soft moonlight from above, low fog at the wolf's paws. Mysterious, powerful, otherworldly.

Color palette: deep forest greens and blacks (#1F2419), warm amber glow (#E89B3C), muted gold. Low saturation, high contrast on the wolf.

Style: painterly oil-painting feel. NO text, NO letters, NO numbers, NO frames or borders.

Aspect ratio: 5:7 PORTRAIT (vertical card shape).
