import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookmarkCheck,
  Image,
  Link as LinkIcon,
  User,
} from 'lucide-react';
import {
  MAX_NAME_LENGTH,
  ROOM_CODE_PATTERN,
  findAvatar,
} from '@werewolf/shared';
import { Button } from '../ui/Button';
import { TextInput } from '../ui/TextInput';
import { CodeInput } from '../ui/CodeInput';
import { usePersistedName } from '../../hooks/usePersistedName';
import { usePersistedAvatar } from '../../hooks/usePersistedAvatar';
import { saveLastRoomCode } from '../../lib/storage';
import { AvatarPickerDialog } from '../profile/AvatarPickerDialog';

export function JoinRoomForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const codeFromUrl = searchParams.get('code') ?? '';

  const { name, setName, persist } = usePersistedName();
  const { avatarId, setAvatarId } = usePersistedAvatar();
  const [code, setCode] = useState<string>(() =>
    /^\d{1,6}$/.test(codeFromUrl) ? codeFromUrl : '',
  );
  const [submitting, setSubmitting] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);

  const cameFromLink = code === codeFromUrl && codeFromUrl.length > 0;
  const nameWasPersisted = name.length > 0;
  const avatar = findAvatar(avatarId);

  // If URL code becomes valid, reflect into local state
  useEffect(() => {
    if (/^\d{1,6}$/.test(codeFromUrl) && codeFromUrl !== code) {
      setCode(codeFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeFromUrl]);

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
    navigate(`/lobby/${code}`, {
      state: { displayName: trimmedName, avatarId },
    });
  };

  return (
    <div className="flex-1 flex flex-col px-5 pt-5 pb-7 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => navigate('/')}
          aria-label="Quay lại"
          className="w-9 h-9 bg-transparent border border-bg-surface-hi rounded-[10px] text-text-primary inline-flex items-center justify-center active:scale-95"
        >
          <ArrowLeft size={18} aria-hidden />
        </button>
        <div>
          <h1 className="text-text-primary text-lg font-medium">Tham gia phòng</h1>
          <p className="text-text-secondary text-xs">Có ai đó đang đợi bạn</p>
        </div>
      </div>

      {cameFromLink && (
        <div className="bg-[rgba(232,155,60,0.1)] border border-[rgba(232,155,60,0.3)] rounded-[12px] px-3.5 py-3 mb-5 flex items-center gap-2.5">
          <LinkIcon size={18} className="text-accent shrink-0" aria-hidden />
          <p className="text-text-primary text-[13px] leading-snug">
            Bạn vừa mở link mời. Code đã được điền sẵn.
          </p>
        </div>
      )}

      <div className="mb-6">
        <label className="block text-[13px] font-medium text-text-primary mb-2">
          Code phòng
        </label>
        <CodeInput value={code} onChange={setCode} autoFocus={!cameFromLink} />
      </div>

      <div className="mb-5">
        <TextInput
          label="Tên hiển thị của bạn"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ví dụ: Minh"
          maxLength={MAX_NAME_LENGTH}
          leadingIcon={<User size={18} />}
          helper={
            nameWasPersisted ? (
              <>
                <BookmarkCheck size={12} aria-hidden />
                Đã nhớ tên từ lần trước. Bạn có thể đổi.
              </>
            ) : undefined
          }
        />
      </div>

      {/* Avatar selector */}
      <div className="mb-7">
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

      <Button fullWidth onClick={handleSubmit} disabled={!isValid || submitting}>
        Vào phòng
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
