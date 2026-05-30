import { useState } from 'react';
import { X } from 'lucide-react';
import { findAvatar } from '@werewolf/shared';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { AvatarPicker } from './AvatarPicker';

interface ProfileDialogProps {
  open: boolean;
  onClose: () => void;
  initialName: string;
  initialAvatarId: string;
  onSave: (name: string, avatarId: string) => void;
}

/**
 * Profile editor dialog. Lets the user change display name + avatar.
 *
 * Layout: flex column with sticky header + sticky footer (buttons always visible),
 * scrollable middle (avatar picker). Capped at 90vh to ensure no clipping on
 * small screens.
 */
export function ProfileDialog({
  open,
  onClose,
  initialName,
  initialAvatarId,
  onSave,
}: ProfileDialogProps) {
  const [name, setName] = useState(initialName);
  const [avatarId, setAvatarId] = useState(initialAvatarId);
  const currentAvatar = findAvatar(avatarId);

  const trimmed = name.trim();
  const canSave = trimmed.length >= 2 && trimmed.length <= 20;
  const changed = trimmed !== initialName || avatarId !== initialAvatarId;

  const handleSave = () => {
    if (!canSave || !changed) return;
    onSave(trimmed, avatarId);
    onClose();
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} ariaLabel="Hồ sơ người chơi">
      <div
        className="flex flex-col"
        style={{ maxHeight: 'min(90vh, 720px)' }}
      >
        {/* ---------- Sticky header ---------- */}
        <div className="shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-text-primary text-lg font-medium m-0">Hồ sơ của bạn</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="bg-transparent border-none p-1 text-text-secondary active:scale-95"
            >
              <X size={20} />
            </button>
          </div>

          {/* Preview header — compact */}
          <div className="bg-bg-base border border-bg-surface-hi rounded-[12px] p-2.5 mb-3 flex items-center gap-2.5">
            <img
              src={currentAvatar.url}
              alt=""
              className="w-11 h-11 rounded-full object-cover shrink-0"
              style={{ border: '2px solid rgba(232,155,60,0.4)' }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-text-primary text-[14px] font-medium truncate">
                {trimmed || 'Chưa có tên'}
              </div>
              <div className="text-text-secondary text-[11px]">{currentAvatar.label}</div>
            </div>
          </div>

          {/* Name input — compact */}
          <div className="mb-3">
            <label className="text-text-secondary text-[10px] font-medium tracking-widest block mb-1.5">
              TÊN HIỂN THỊ
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tên của bạn"
              maxLength={20}
              className="w-full bg-bg-base border border-bg-surface-hi rounded-[10px] px-3 py-2 text-text-primary text-[14px] focus:outline-none focus:border-accent"
            />
          </div>

          <div className="text-text-secondary text-[10px] font-medium tracking-widest mb-2">
            ẢNH ĐẠI DIỆN
          </div>
        </div>

        {/* ---------- Scrollable middle: avatar picker ---------- */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollable pr-1">
          <AvatarPicker selectedId={avatarId} onSelect={setAvatarId} />
        </div>

        {/* ---------- Sticky footer ---------- */}
        <div className="shrink-0 pt-3 mt-1 border-t border-bg-surface flex gap-2">
          <Button variant="secondary" fullWidth onClick={onClose}>
            Hủy
          </Button>
          <Button fullWidth onClick={handleSave} disabled={!canSave || !changed}>
            Lưu
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
