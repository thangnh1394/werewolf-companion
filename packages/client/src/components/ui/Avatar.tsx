import { findAvatar } from '@werewolf/shared';
import { getInitial } from '../../lib/format';

interface AvatarProps {
  name: string;
  /** Avatar id from AVATARS catalog. If omitted, renders initial letter (backward compat). */
  avatarId?: string;
  isHost?: boolean;
  size?: 'sm' | 'md';
}

export function Avatar({ name, avatarId, isHost = false, size = 'md' }: AvatarProps) {
  const dimClass = size === 'sm' ? 'w-8 h-8' : 'w-9 h-9';

  // If avatarId is provided, render the image avatar
  if (avatarId) {
    const avatar = findAvatar(avatarId);
    return (
      <div
        className={[
          dimClass,
          'rounded-full overflow-hidden shrink-0',
        ].join(' ')}
        style={{
          border: isHost ? '2px solid #E89B3C' : '2px solid rgba(232,155,60,0.25)',
        }}
        aria-hidden
      >
        <img
          src={avatar.url}
          alt=""
          draggable={false}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  // Fallback: initial letter
  const initial = getInitial(name);
  const textSize = size === 'sm' ? 'text-[13px]' : 'text-[14px]';
  return (
    <div
      className={[
        dimClass,
        textSize,
        'rounded-full flex items-center justify-center font-medium shrink-0',
        isHost
          ? 'bg-accent text-bg-base'
          : 'bg-bg-input-idle text-text-primary',
      ].join(' ')}
      aria-hidden
    >
      {initial}
    </div>
  );
}
