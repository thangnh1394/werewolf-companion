import { z } from 'zod';

/**
 * Card data — single source of truth for all role information.
 * Used by client (UI) and server (deal logic in Phase 2.4).
 *
 * Format follows Golden Rule 2: every card must convey
 *   - ability (what they do, when, who they target)
 *   - wakeTime (which nights they wake)
 *   - notes (edge cases that matter for correct play)
 */

export const TeamSchema = z.enum(['wolf', 'village', 'solo']);
export type Team = z.infer<typeof TeamSchema>;

export const CardSchema = z.object({
  id: z.string(),
  name: z.string(),
  team: TeamSchema,
  ability: z.string(),
  wakeTime: z.string(),
  notes: z.string().optional(),
  imageUrl: z.string(),
  photographer: z.string().optional(),
  photoUrl: z.string().optional(),
  popular: z.boolean().optional(),
});
export type Card = z.infer<typeof CardSchema>;

/**
 * All 15 cards. Order within each team matches the Vietnamese ma sói community
 * convention (popular first, then by complexity).
 *
 * Image paths point to /cards/<id>.svg (placeholder); when user replaces with
 * Pexels WebP, update extension to .webp.
 */
export const CARDS: readonly Card[] = [
  // ---------- PHE SÓI ----------
  {
    id: 'werewolf',
    name: 'Sói Thường',
    team: 'wolf',
    ability:
      'Mỗi đêm cùng các sói khác bàn nhau (im lặng, chỉ ra dấu) chọn 1 dân để giết.',
    wakeTime: 'Tất cả các đêm.',
    notes:
      'Sói không được cắn sói khác. Mục tiêu: tiêu diệt hết dân làng hoặc đạt số sói ≥ số dân còn sống.',
    imageUrl: '/cards/werewolf.webp',
    popular: true,
  },
  {
    id: 'alpha_wolf',
    name: 'Sói Tiên Tri',
    team: 'wolf',
    ability:
      'Là sói. Đêm đầu thức dậy cùng các sói, biết toàn bộ đồng đội. Mỗi đêm còn được soi 1 người để biết họ là vai gì (chính xác như Tiên Tri thật).',
    wakeTime: 'Tất cả các đêm.',
    notes:
      'Vẫn tính là sói. Nếu bị treo cổ, phe sói mất 1 mạng. Sức mạnh nằm ở việc giả vờ làm Tiên Tri dân để dẫn dân làng đi sai hướng.',
    imageUrl: '/cards/alpha_wolf.webp',
  },
  {
    id: 'wolf_alpha',
    name: 'Sói Trùm',
    team: 'wolf',
    ability:
      'Là sói mạnh nhất. Khi bị treo cổ ban ngày, ngay đêm hôm sau các sói còn lại được cắn 2 người thay vì 1.',
    wakeTime: 'Tất cả các đêm.',
    notes:
      'Khả năng "cắn 2" chỉ kích hoạt nếu Sói Trùm bị TREO CỔ. Không kích hoạt nếu chết do Phù Thủy giết hay Thợ Săn bắn.',
    imageUrl: '/cards/wolf_alpha.webp',
  },
  {
    id: 'cursed_wolf',
    name: 'Sói Nguyền',
    team: 'wolf',
    ability:
      'Là sói. Đêm đầu các sói khác được biết Sói Nguyền là ai, nhưng Sói Nguyền KHÔNG biết các sói khác. Tiên Tri soi Sói Nguyền sẽ thấy là DÂN (gây nhiễu).',
    wakeTime: 'Tất cả các đêm.',
    notes:
      'Khi tất cả sói khác đã chết, Sói Nguyền sẽ tự động thức dậy như sói thường và tiếp tục cắn mỗi đêm.',
    imageUrl: '/cards/cursed_wolf.webp',
  },

  // ---------- PHE DÂN LÀNG ----------
  {
    id: 'villager',
    name: 'Dân Làng',
    team: 'village',
    ability: 'Không có khả năng đặc biệt.',
    wakeTime: 'Chỉ ban ngày (không dậy ban đêm).',
    notes:
      'Sức mạnh của bạn là quan sát + lập luận. Biểu quyết treo cổ là vũ khí duy nhất của phe Dân.',
    imageUrl: '/cards/villager.webp',
    popular: true,
  },
  {
    id: 'seer',
    name: 'Tiên Tri',
    team: 'village',
    ability:
      'Mỗi đêm chọn soi 1 người. Quản Trò ra dấu cho biết người đó có phải Sói hay không (chỉ "Sói" / "không Sói", không nói vai cụ thể).',
    wakeTime: 'Tất cả các đêm.',
    notes:
      'Vai TRỤ CỘT của phe Dân. Cần ra mặt khéo léo — nếu lộ sớm dễ bị Sói cắn ngay đêm sau.',
    imageUrl: '/cards/seer.webp',
    popular: true,
  },
  {
    id: 'bodyguard',
    name: 'Bảo Vệ',
    team: 'village',
    ability:
      'Mỗi đêm chọn 1 người để bảo vệ (kể cả bản thân). Nếu người đó bị Sói cắn đêm đó thì không chết.',
    wakeTime: 'Tất cả các đêm.',
    notes:
      'KHÔNG được bảo vệ cùng 1 người 2 đêm liên tiếp. Không chống lại được bình giết của Phù Thủy.',
    imageUrl: '/cards/bodyguard.webp',
    popular: true,
  },
  {
    id: 'witch',
    name: 'Phù Thủy',
    team: 'village',
    ability:
      'Có 2 bình thuốc, mỗi bình dùng 1 lần duy nhất cả ván: Bình CỨU (hồi sinh người vừa bị Sói cắn đêm đó) + Bình GIẾT (giết 1 người bất kỳ).',
    wakeTime: 'Tất cả các đêm, sau khi Sói cắn xong.',
    notes:
      'Quản Trò chỉ cho biết AI bị Sói cắn, không nói gì thêm. Có thể dùng cả 2 bình trong cùng 1 đêm.',
    imageUrl: '/cards/witch.webp',
    popular: true,
  },
  {
    id: 'hunter',
    name: 'Thợ Săn',
    team: 'village',
    ability:
      'Khi chết bằng BẤT KỲ cách nào (Sói cắn / treo cổ / Phù Thủy giết), được bắn chết 1 người chơi khác ngay lập tức.',
    wakeTime: 'Đêm đầu để xác nhận vai (sau đó không dậy đêm).',
    notes:
      'Khả năng vẫn dùng được nếu Già Làng đã chết (ngoại lệ duy nhất của phe Dân giữ chức năng khi Già Làng mất).',
    imageUrl: '/cards/hunter.webp',
  },
  {
    id: 'little_girl',
    name: 'Bé Gái',
    team: 'village',
    ability:
      'Khi Sói thức dậy ban đêm, được phép HÉ MẮT TRỘM NHÌN để biết ai là Sói.',
    wakeTime: 'Tất cả các đêm (cùng lúc với Sói).',
    notes:
      'RỦI RO: Nếu Sói phát hiện đang nhìn trộm, có thể tự ý chuyển nạn nhân đêm đó sang Bé Gái. Phải hé mắt thật khéo.',
    imageUrl: '/cards/little_girl.webp',
  },
  {
    id: 'elder',
    name: 'Già Làng',
    team: 'village',
    ability:
      'Có 2 mạng khi bị Sói cắn (lần 1 không chết).',
    wakeTime: 'Đêm đầu tiên để xác nhận vai.',
    notes:
      'Nếu chết vì TREO CỔ / Phù Thủy giết / Thợ Săn bắn → chết ngay lập tức VÀ tất cả vai đặc biệt phe Dân (trừ Thợ Săn) sẽ MẤT chức năng. Cần được bảo vệ tối đa.',
    imageUrl: '/cards/elder.webp',
  },
  {
    id: 'sorcerer',
    name: 'Pháp Sư',
    team: 'village',
    ability:
      'Mỗi đêm chọn 1 người. Quản Trò ra dấu cho biết người đó có phải Tiên Tri hay không.',
    wakeTime: 'Tất cả các đêm.',
    notes:
      'Phe Dân. Khác với Tiên Tri (soi Sói), Pháp Sư chuyên SĂN Tiên Tri để giúp đồng đội bảo vệ vai trò quan trọng này.',
    imageUrl: '/cards/sorcerer.webp',
  },
  {
    id: 'servant',
    name: 'Người Hầu',
    team: 'village',
    ability:
      'Khi có người vừa bị treo cổ ban ngày (TRƯỚC khi Quản Trò công bố vai của họ), Người Hầu có thể đứng dậy tuyên bố "Tôi xin đổi vai". Nhận vai của người chết, người chết coi như là Người Hầu.',
    wakeTime: 'Đêm đầu để xác nhận vai.',
    notes:
      'Chỉ đổi 1 lần duy nhất cả ván. Nếu đổi sang vai Sói → đổi phe luôn, đêm sau dậy cùng Sói.',
    imageUrl: '/cards/servant.webp',
  },

  // ---------- PHE TRUNG LẬP ----------
  {
    id: 'cupid',
    name: 'Cupid',
    team: 'solo',
    ability:
      'Đêm đầu tiên chọn 2 người chơi (có thể chọn cả mình) làm "cặp đôi". Hai người này được Quản Trò bí mật cho biết ai là người yêu của họ.',
    wakeTime: 'Chỉ đêm đầu tiên.',
    notes:
      'Nếu 1 trong 2 người chết, người còn lại CHẾT NGAY theo. Nếu cặp đôi là 1 Sói + 1 Dân → cả 2 chuyển thành PHE CẶP ĐÔI riêng (chỉ thắng khi 2 người cuối cùng còn sống là họ).',
    imageUrl: '/cards/cupid.webp',
  },
  {
    id: 'thief',
    name: 'Tên Trộm',
    team: 'solo',
    ability:
      'Khi bắt đầu ván, Quản Trò để 2 lá bài dư úp giữa bàn. Đêm đầu tiên Tên Trộm được nhìn 2 lá đó và chọn 1 lá để đổi thành vai mới của mình.',
    wakeTime: 'Chỉ đêm đầu tiên.',
    notes:
      'Nếu cả 2 lá đều là Sói → BẮT BUỘC phải chọn 1 (thành Sói). Sau khi đổi, lá Tên Trộm trở thành vô hiệu.',
    imageUrl: '/cards/thief.webp',
  },
] as const;

// ---------- Helpers ----------

/** Lookup by id. Returns undefined if not found. */
export function findCard(id: string): Card | undefined {
  return CARDS.find((c) => c.id === id);
}

/** Group cards by team. Order: wolf → village → solo. */
export function groupByTeam(): Record<Team, Card[]> {
  const groups: Record<Team, Card[]> = { wolf: [], village: [], solo: [] };
  for (const card of CARDS) {
    groups[card.team].push(card);
  }
  return groups;
}

/**
 * Team metadata for the team-explainer dialog.
 */
export const TEAM_INFO: Record<
  Team,
  {
    label: string;
    sublabel: string;
    objective: string;
    winCondition: string;
    accentColor: string; // hex
  }
> = {
  wolf: {
    label: 'Phe Sói',
    sublabel: 'Phe thiểu số',
    objective:
      'Tiêu diệt hết phe Dân Làng. Mỗi đêm cùng quyết định giết 1 người.',
    winCondition: 'Số sói còn sống ≥ số dân còn sống.',
    accentColor: '#D85A30',
  },
  village: {
    label: 'Phe Dân Làng',
    sublabel: 'Phe đa số',
    objective:
      'Tìm ra và treo cổ hết Sói. Mỗi vai đặc biệt có khả năng giúp suy luận.',
    winCondition: 'Toàn bộ sói đã bị loại khỏi ván chơi.',
    accentColor: '#E89B3C',
  },
  solo: {
    label: 'Phe Trung Lập',
    sublabel: 'Mục tiêu riêng',
    objective:
      'Mỗi vai trò Trung Lập có mục tiêu riêng, không thuộc phe Sói hay Dân. Đọc khả năng từng card để biết.',
    winCondition: 'Tùy vai trò — xem mô tả từng card.',
    accentColor: '#C088E0',
  },
};
