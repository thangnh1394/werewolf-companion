import { getInitial } from '../../lib/format';

interface AvatarProps {
  name: string;
  isHost?: boolean;
  size?: 'sm' | 'md';
}

export function Avatar({ name, isHost = false, size = 'md' }: AvatarProps) {
  const initial = getInitial(name);
  const dimClass = size === 'sm' ? 'w-8 h-8 text-[13px]' : 'w-9 h-9 text-[14px]';

  return (
    <div
      className={[
        dimClass,
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
