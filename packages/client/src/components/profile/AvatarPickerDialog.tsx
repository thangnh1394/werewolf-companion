import { useState } from 'react';
import { X } from 'lucide-react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { AvatarPicker } from './AvatarPicker';

interface AvatarPickerDialogProps {
  open: boolean;
  onClose: () => void;
  /** Currently selected avatar id (used to pre-select on open). */
  initialAvatarId: string;
  /** Called with the new id when user confirms. */
  onSave: (avatarId: string) => void;
}

/**
 * Lightweight dialog showing just the avatar picker. Used in forms where
 * name input is already on the form itself (CreateRoomForm, JoinRoomForm).
 *
 * For the full profile editor (name + avatar together), use ProfileDialog.
 */
export function AvatarPickerDialog({
  open,
  onClose,
  initialAvatarId,
  onSave,
}: AvatarPickerDialogProps) {
  const [avatarId, setAvatarId] = useState(initialAvatarId);

  const handleSave = () => {
    onSave(avatarId);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} ariaLabel="Chọn ảnh đại diện">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-text-primary text-lg font-medium m-0">Chọn ảnh đại diện</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="bg-transparent border-none p-1 text-text-secondary active:scale-95"
        >
          <X size={20} />
        </button>
      </div>

      <div className="mb-4 max-h-[60vh] overflow-y-auto scrollable pr-1">
        <AvatarPicker selectedId={avatarId} onSelect={setAvatarId} />
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" fullWidth onClick={onClose}>
          Hủy
        </Button>
        <Button fullWidth onClick={handleSave}>
          Xong
        </Button>
      </div>
    </Dialog>
  );
}
