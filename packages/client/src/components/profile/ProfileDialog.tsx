import { useState } from 'react';
import { X } from 'lucide-react';
import { findAvatar } from '@werewolf/shared';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { AvatarPicker } from './AvatarPicker';

interface ProfileDialogProps {
  open: boolean;
  onClose: () => void;
  /** Current display name to pre-fill */
  initialName: string;
  /** Current avatar id to pre-select */
  initialAvatarId: string;
  /**
   * Called when user saves. Persistence to localStorage is the caller's responsibility.
   * If used inside a room, the caller should ALSO send UPDATE_PROFILE to the server.
   */
  onSave: (name: string, avatarId: string) => void;
  /** If true, the dialog shows the in-room note ("applies immediately"). Otherwise shows the home-screen note. */
  inRoom?: boolean;
}

/**
 * Profile editor dialog. Lets the user change display name + avatar.
 *
 * Changes are saved to localStorage immediately. To propagate to other players
 * in the current room, the user must leave and rejoin (server only reads
 * profile from JOIN message — no live update messages for simplicity).
 */
export function ProfileDialog({
  open,
  onClose,
  initialName,
  initialAvatarId,
  onSave,
  inRoom = false,
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

  return (
    <Dialog open={open} onClose={onClose} ariaLabel="Hồ sơ người chơi">
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

      {/* Preview header */}
      <div className="bg-bg-base border border-bg-surface-hi rounded-[12px] p-3 mb-4 flex items-center gap-3">
        <img
          src={currentAvatar.url}
          alt=""
          className="w-14 h-14 rounded-full object-cover shrink-0"
          style={{ border: '2px solid rgba(232,155,60,0.4)' }}
        />
        <div className="flex-1 min-w-0">
          <div className="text-text-primary text-[15px] font-medium truncate">
            {trimmed || 'Chưa có tên'}
          </div>
          <div className="text-text-secondary text-[11px]">{currentAvatar.label}</div>
        </div>
      </div>

      {/* Name input */}
      <div className="mb-4">
        <label className="text-text-secondary text-[11px] font-medium tracking-widest block mb-2">
          TÊN HIỂN THỊ
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên của bạn"
          maxLength={20}
          className="w-full bg-bg-base border border-bg-surface-hi rounded-[10px] px-3 py-2.5 text-text-primary text-[14px] focus:outline-none focus:border-accent"
        />
        <div className="text-text-secondary text-[10px] mt-1">2–20 ký tự</div>
      </div>

      {/* Avatar picker */}
      <div className="mb-5 max-h-[55vh] overflow-y-auto scrollable pr-1">
        <AvatarPicker selectedId={avatarId} onSelect={setAvatarId} />
      </div>

      <div className="bg-bg-base/50 border border-bg-surface-hi rounded-[10px] p-2.5 mb-4">
        <div className="text-text-secondary text-[11px] leading-relaxed">
          {inRoom
            ? 'Thay đổi sẽ áp dụng ngay trong phòng. Mọi người sẽ thấy ảnh + tên mới.'
            : 'Thay đổi sẽ được áp dụng cho các phòng tiếp theo.'}
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" fullWidth onClick={onClose}>
          Hủy
        </Button>
        <Button fullWidth onClick={handleSave} disabled={!canSave || !changed}>
          Lưu
        </Button>
      </div>
    </Dialog>
  );
}
