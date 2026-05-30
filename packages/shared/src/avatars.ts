/**
 * Avatar set for user profiles (Phase 3.3).
 *
 * 20 Kahoot-style flat vector character avatars. Files stored in
 * `packages/client/public/avatars/` (~5-9 KB each, 111 KB total).
 *
 * Users choose one from the picker. The selected `id` is stored in localStorage
 * and sent in the JOIN_ROOM message for display in the player list.
 */

export interface AvatarOption {
  /** Stable id used in user profile + WebSocket messages. NEVER rename. */
  id: string;
  /** Display label in the picker (Vietnamese). */
  label: string;
  /** Public URL of the WebP asset. */
  url: string;
  /** Category for grouping in the picker UI. */
  category: 'characters' | 'animals' | 'others';
}

export const AVATARS: readonly AvatarOption[] = [
  // ---------- Werewolf-themed characters ----------
  { id: 'wolf',           label: 'Sói',          url: '/avatars/avatar_01_wolf.webp',          category: 'characters' },
  { id: 'owl',            label: 'Cú mèo',       url: '/avatars/avatar_02_owl.webp',           category: 'characters' },
  { id: 'villager_boy',   label: 'Chàng trai',   url: '/avatars/avatar_03_villager_boy.webp',  category: 'characters' },
  { id: 'villager_girl',  label: 'Cô gái',       url: '/avatars/avatar_04_villager_girl.webp', category: 'characters' },
  { id: 'witch',          label: 'Phù thủy',     url: '/avatars/avatar_05_witch.webp',         category: 'characters' },
  { id: 'seer',           label: 'Nhà tiên tri', url: '/avatars/avatar_06_seer.webp',          category: 'characters' },
  { id: 'hunter',         label: 'Thợ săn',      url: '/avatars/avatar_07_hunter.webp',        category: 'characters' },
  { id: 'moon',           label: 'Mặt trăng',    url: '/avatars/avatar_08_moon.webp',          category: 'characters' },

  // ---------- Animals ----------
  { id: 'fox',            label: 'Cáo',          url: '/avatars/avatar_09_fox.webp',           category: 'animals' },
  { id: 'bear',           label: 'Gấu',          url: '/avatars/avatar_10_bear.webp',          category: 'animals' },
  { id: 'cat',            label: 'Mèo đen',      url: '/avatars/avatar_11_cat.webp',           category: 'animals' },
  { id: 'rabbit',         label: 'Thỏ',          url: '/avatars/avatar_12_rabbit.webp',        category: 'animals' },
  { id: 'panda',          label: 'Gấu trúc',     url: '/avatars/avatar_13_panda.webp',         category: 'animals' },
  { id: 'dragon',         label: 'Rồng',         url: '/avatars/avatar_14_dragon.webp',        category: 'animals' },

  // ---------- Other characters ----------
  { id: 'robot',          label: 'Người máy',    url: '/avatars/avatar_15_robot.webp',         category: 'others' },
  { id: 'astronaut',      label: 'Phi hành gia', url: '/avatars/avatar_16_astronaut.webp',     category: 'others' },
  { id: 'chef',           label: 'Đầu bếp',      url: '/avatars/avatar_17_chef.webp',          category: 'others' },
  { id: 'knight',         label: 'Hiệp sĩ',      url: '/avatars/avatar_18_knight.webp',        category: 'others' },
  { id: 'pirate',         label: 'Cướp biển',    url: '/avatars/avatar_19_pirate.webp',        category: 'others' },
  { id: 'ninja',          label: 'Ninja',        url: '/avatars/avatar_20_ninja.webp',         category: 'others' },
] as const;

export type AvatarId = (typeof AVATARS)[number]['id'];

/** Default avatar when user hasn't set one. */
export const DEFAULT_AVATAR_ID: AvatarId = 'wolf';

/** Look up an avatar by id; returns the default if not found. */
export function findAvatar(id: string | null | undefined): AvatarOption {
  if (!id) return AVATARS[0]!;
  return AVATARS.find((a) => a.id === id) ?? AVATARS[0]!;
}

/** Group avatars by category for the picker UI. */
export function groupAvatarsByCategory(): Record<AvatarOption['category'], AvatarOption[]> {
  return AVATARS.reduce(
    (acc, av) => {
      acc[av.category].push(av);
      return acc;
    },
    { characters: [], animals: [], others: [] } as Record<AvatarOption['category'], AvatarOption[]>,
  );
}

export const CATEGORY_LABELS: Record<AvatarOption['category'], string> = {
  characters: 'Nhân vật',
  animals: 'Động vật',
  others: 'Khác',
};
