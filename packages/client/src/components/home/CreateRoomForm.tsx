import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Dices, User, Info, Image } from 'lucide-react';
import {
  MAX_NAME_LENGTH,
  ROOM_CODE_PATTERN,
  ROOM_CODE_LENGTH,
  findAvatar,
} from '@werewolf/shared';
import { Button } from '../ui/Button';
import { TextInput } from '../ui/TextInput';
import { CodeInput } from '../ui/CodeInput';
import { usePersistedName } from '../../hooks/usePersistedName';
import { usePersistedAvatar } from '../../hooks/usePersistedAvatar';
import { saveLastRoomCode } from '../../lib/storage';
import { AvatarPickerDialog } from '../profile/AvatarPickerDialog';

function randomCode(): string {
  const n = Math.floor(Math.random() * 1_000_000);
  return n.toString().padStart(ROOM_CODE_LENGTH, '0');
}

export function CreateRoomForm() {
  const navigate = useNavigate();
  const { name, setName, persist } = usePersistedName();
  const { avatarId, setAvatarId } = usePersistedAvatar();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);

  const avatar = findAvatar(avatarId);
  const trimmedName = name.trim();
  const isValid =
    trimmedName.length > 0 &&
    trimmedName.length <= MAX_NAME_LENGTH &&
    ROOM_CODE_PATTERN.test(code);

  const handleSubmit = () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    persist();
    saveLastRoomCode(code);
    navigate(`/lobby/${code}?host=1`, {
      state: { displayName: trimmedName, avatarId },
    });
  };

  return (
    <div className="flex-1 flex flex-col px-5 pt-5 pb-7 animate-fade-in">
      <div className="flex items-center gap-3 mb-7">
        <button
          type="button"
          onClick={() => navigate('/')}
          aria-label="Quay lại"
          className="w-9 h-9 bg-transparent border border-bg-surface-hi rounded-[10px] text-text-primary inline-flex items-center justify-center active:scale-95"
        >
          <ArrowLeft size={18} aria-hidden />
        </button>
        <div>
          <h1 className="text-text-primary text-lg font-medium">Tạo phòng mới</h1>
          <p className="text-text-secondary text-xs">Bạn sẽ là quản trò</p>
        </div>
      </div>

      <div className="mb-4">
        <TextInput
          label="Tên hiển thị của bạn"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ví dụ: Hoàng"
          maxLength={MAX_NAME_LENGTH}
          leadingIcon={<User size={18} />}
          helper={
            <span>Tên này sẽ hiện trong phòng. Có thể trùng người khác.</span>
          }
        />
      </div>

      {/* Avatar selector */}
      <div className="mb-6">
        <label className="block text-[13px] font-medium text-text-primary mb-2">
          Ảnh đại diện
        </label>
        <button
          type="button"
          onClick={() => setAvatarPickerOpen(true)}
          className="w-full bg-bg-surface border border-bg-surface-hi rounded-[12px] px-3 py-2.5 flex items-center gap-3 active:scale-[0.99]"
        >
          <img
            src={avatar.url}
            alt=""
            draggable={false}
            className="w-11 h-11 rounded-full object-cover shrink-0"
            style={{ border: '2px solid rgba(232,155,60,0.4)' }}
          />
          <div className="flex-1 min-w-0 text-left">
            <div className="text-text-primary text-[14px] font-medium truncate">
              {avatar.label}
            </div>
            <div className="text-text-secondary text-[11px]">Bấm để đổi ảnh khác</div>
          </div>
          <Image size={16} className="text-accent shrink-0" aria-hidden />
        </button>
      </div>

      <div className="mb-6">
        <label className="block text-[13px] font-medium text-text-primary mb-2">
          Code 6 số cho phòng
        </label>
        <CodeInput value={code} onChange={setCode} />
        <div className="text-[11px] text-text-secondary mt-2 flex items-center gap-1.5">
          <Info size={13} aria-hidden />
          Đây là mật khẩu phòng. Chia sẻ với bạn bè để họ vào.
        </div>
      </div>

      <button
        type="button"
        onClick={() => setCode(randomCode())}
        className="w-full bg-transparent border border-dashed border-bg-surface-hi rounded-[12px] py-3 text-accent text-[13px] font-medium flex items-center justify-center gap-1.5 mb-7 active:scale-[0.98]"
      >
        <Dices size={16} aria-hidden />
        Tạo code ngẫu nhiên
      </button>

      <Button fullWidth onClick={handleSubmit} disabled={!isValid || submitting}>
        Tạo phòng
        <ArrowRight size={18} aria-hidden />
      </Button>

      <AvatarPickerDialog
        open={avatarPickerOpen}
        onClose={() => setAvatarPickerOpen(false)}
        initialAvatarId={avatarId}
        onSave={setAvatarId}
      />
    </div>
  );
}
