import { UserMinus } from 'lucide-react';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';

interface KickConfirmDialogProps {
  open: boolean;
  targetName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function KickConfirmDialog({
  open,
  targetName,
  onConfirm,
  onCancel,
}: KickConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} ariaLabel="Xác nhận mời người chơi ra">
      <div className="w-14 h-14 bg-[rgba(216,90,48,0.15)] rounded-[14px] flex items-center justify-center mb-4">
        <UserMinus className="text-danger" size={28} aria-hidden />
      </div>
      <h2 className="text-text-primary text-lg font-medium mb-2">
        Mời {targetName} ra khỏi phòng?
      </h2>
      <p className="text-text-secondary text-[13px] leading-relaxed mb-6">
        {targetName} sẽ bị đưa về màn hình chính. Họ có thể quay lại nếu biết code phòng.
      </p>

      <div className="flex flex-col gap-2">
        <Button fullWidth variant="danger" onClick={onConfirm}>
          Mời {targetName} ra
        </Button>
        <Button fullWidth variant="ghost" onClick={onCancel}>
          Hủy
        </Button>
      </div>
    </Dialog>
  );
}
