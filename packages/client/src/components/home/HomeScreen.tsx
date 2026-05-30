import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Plus, KeyRound, Users, UserRound } from 'lucide-react';
import { findAvatar } from '@werewolf/shared';
import { Button } from '../ui/Button';
import { ProfileDialog } from '../profile/ProfileDialog';
import { usePersistedName } from '../../hooks/usePersistedName';
import { usePersistedAvatar } from '../../hooks/usePersistedAvatar';

export function HomeScreen() {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  // Use hooks for live updates — when ProfileDialog saves, these refresh automatically.
  const { name, setName, persist: persistName } = usePersistedName();
  const { avatarId, setAvatarId } = usePersistedAvatar();

  const hasHistory = name.trim().length > 0;
  const avatar = findAvatar(avatarId);

  const handleSaveProfile = (newName: string, newAvatarId: string) => {
    setName(newName);
    persistName();
    setAvatarId(newAvatarId);
  };

  return (
    <div className="flex-1 flex flex-col px-5 pt-8 pb-7 animate-fade-in relative">
      {/* Profile button top-right — only when user has history (per spec) */}
      {hasHistory && (
        <button
          type="button"
          onClick={() => setProfileOpen(true)}
          aria-label="Sửa hồ sơ của bạn"
          className="absolute top-4 right-4 w-11 h-11 rounded-full overflow-hidden bg-bg-surface active:scale-95 z-10"
          style={{ border: '2px solid rgba(232,155,60,0.4)' }}
        >
          <img
            src={avatar.url}
            alt=""
            draggable={false}
            className="w-full h-full object-cover"
          />
        </button>
      )}

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
        {hasHistory && (
          <div className="mt-4 inline-flex items-center gap-1.5 bg-bg-surface border border-bg-surface-hi rounded-full px-3 py-1">
            <UserRound size={12} className="text-text-secondary" aria-hidden />
            <span className="text-text-secondary text-[12px]">
              Chào, <span className="text-text-primary">{name}</span>
            </span>
          </div>
        )}
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

      <div className="border-t border-bg-surface pt-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Users size={14} className="text-text-secondary" aria-hidden />
          <span className="text-text-secondary text-xs">5–20 người chơi mỗi phòng</span>
        </div>
        <div className="text-center">
          <button
            type="button"
            onClick={() => navigate('/about')}
            className="bg-transparent border-0 text-text-secondary text-[11px] underline-offset-2 hover:underline active:scale-95"
          >
            Giới thiệu · Tín dụng ảnh
          </button>
        </div>
      </div>

      <ProfileDialog
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        initialName={name}
        initialAvatarId={avatarId}
        onSave={handleSaveProfile}
      />
    </div>
  );
}
