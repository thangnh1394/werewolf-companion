import { useNavigate } from 'react-router-dom';
import { Flame, Plus, KeyRound, Users } from 'lucide-react';
import { Button } from '../ui/Button';

export function HomeScreen() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col px-5 pt-8 pb-7 animate-fade-in">
      <div className="text-center mt-8 mb-10">
        <div className="w-[72px] h-[72px] bg-bg-surface border border-bg-surface-hi rounded-[20px] inline-flex items-center justify-center mb-5">
          <Flame className="text-accent" size={36} aria-hidden />
        </div>
        <h1 className="text-text-primary text-[26px] font-medium mb-2 tracking-tight">
          Sói Đêm
        </h1>
        <p className="text-text-secondary text-sm italic leading-snug">
          Chia bài ma sói qua điện thoại,
          <br />
          không cần đem bộ bài theo nữa
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Button fullWidth onClick={() => navigate('/create')}>
          <Plus size={18} aria-hidden />
          Tạo phòng mới
        </Button>
        <Button fullWidth variant="secondary" onClick={() => navigate('/join')}>
          <KeyRound size={18} aria-hidden />
          Nhập code phòng
        </Button>
      </div>

      <div className="flex-1" />

      <div className="border-t border-bg-surface pt-4 flex items-center justify-center gap-2">
        <Users size={14} className="text-text-secondary" aria-hidden />
        <span className="text-text-secondary text-xs">5–20 người chơi mỗi phòng</span>
      </div>
    </div>
  );
}
