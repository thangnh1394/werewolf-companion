import { Crown } from 'lucide-react';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';

interface TransferGmConfirmDialogProps {
  open: boolean;
  targetName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function TransferGmConfirmDialog({
  open,
  targetName,
  onConfirm,
  onCancel,
}: TransferGmConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} ariaLabel="Xác nhận trao quyền quản trò">
      <div className="w-14 h-14 bg-[rgba(216,90,48,0.15)] rounded-[14px] flex items-center justify-center mb-4">
        <Crown className="text-accent" size={28} aria-hidden />
      </div>
      <h2 className="text-text-primary text-lg font-medium mb-2">
        Trao quyền cho {targetName}?
      </h2>
      <p className="text-text-secondary text-[13px] leading-relaxed mb-6">
        {targetName} sẽ trở thành quản trò. Bạn sẽ không còn là quản trò và sẽ cần sẵn sàng như các người chơi khác.
      </p>

      <div className="flex flex-col gap-2">
        <Button fullWidth onClick={onConfirm}>
          Trao cho {targetName}
        </Button>
        <Button fullWidth variant="ghost" onClick={onCancel}>
          Hủy
        </Button>
      </div>
    </Dialog>
  );
}
