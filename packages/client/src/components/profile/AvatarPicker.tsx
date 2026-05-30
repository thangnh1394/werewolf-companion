import {
  AVATARS,
  CATEGORY_LABELS,
  groupAvatarsByCategory,
  type AvatarOption,
} from '@werewolf/shared';
import { Check } from 'lucide-react';

interface AvatarPickerProps {
  selectedId: string;
  onSelect: (avatarId: string) => void;
}

/**
 * Avatar grid picker, grouped by category. Used in HomeScreen profile setup
 * and in the in-lobby ProfileDialog.
 *
 * Renders a checkmark badge on the currently selected avatar.
 */
export function AvatarPicker({ selectedId, onSelect }: AvatarPickerProps) {
  const groups = groupAvatarsByCategory();
  const order: AvatarOption['category'][] = ['characters', 'animals', 'others'];

  return (
    <div className="flex flex-col gap-4">
      {order.map((category) => (
        <div key={category}>
          <div className="text-text-secondary text-[11px] font-medium tracking-widest mb-2">
            {CATEGORY_LABELS[category].toUpperCase()}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {groups[category].map((avatar) => {
              const isSelected = avatar.id === selectedId;
              return (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => onSelect(avatar.id)}
                  aria-label={`Chọn ${avatar.label}`}
                  aria-pressed={isSelected}
                  className="relative aspect-square rounded-[12px] overflow-hidden active:scale-95"
                  style={{
                    border: isSelected ? '2px solid #E89B3C' : '2px solid transparent',
                    boxShadow: isSelected ? '0 0 0 1px rgba(232,155,60,0.3)' : undefined,
                  }}
                >
                  <img
                    src={avatar.url}
                    alt=""
                    draggable={false}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {isSelected && (
                    <div
                      className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: '#E89B3C' }}
                      aria-hidden
                    >
                      <Check size={12} color="#1F2419" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <div className="text-text-secondary text-[10px] text-center mt-1">
        {AVATARS.length} ảnh đại diện · Bấm để chọn
      </div>
    </div>
  );
}
