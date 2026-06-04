import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Layers as Cards, Check, DoorOpen, Flame, LogOut, Spade } from 'lucide-react';
import { MIN_PLAYERS, type PublicPlayer, type SessionId } from '@werewolf/shared';
import { Button } from '../ui/Button';
import { Toast } from '../ui/Toast';
import { useLobby } from '../../hooks/useLobby';
import { ShareRoom } from './ShareRoom';
import { PlayerList } from './PlayerList';
import { KickConfirmDialog } from './KickConfirmDialog';
import { TransferGmConfirmDialog } from './TransferGmConfirmDialog';
import { RoomDeskPreview } from './RoomDeskPreview';
import { MainDeskScreen } from '../cards/MainDeskScreen';
import { RoomDeskEditor } from '../cards/RoomDeskEditor';
import { PlayingScreen } from '../game/PlayingScreen';
import { formatRoomCode } from '../../lib/format';
import { clearLastRoomCode, getSavedAvatarId } from '../../lib/storage';

interface LocationState {
  displayName?: string;
  avatarId?: string;
}

export function LobbyScreen() {
  const navigate = useNavigate();
  const { code = '' } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const isHostRoute = searchParams.get('host') === '1';
  const location = useLocation();
  const displayName = (location.state as LocationState | null)?.displayName?.trim() ?? '';
  const avatarIdFromState = (location.state as LocationState | null)?.avatarId;
  // Fallback to localStorage if router state is missing (e.g. direct deep link or refresh).
  const avatarId = avatarIdFromState ?? getSavedAvatarId() ?? undefined;

  // Always call hooks unconditionally. If no name, we'll redirect inside an effect.
  const lobby = useLobby({
    roomCode: code,
    displayName: displayName || 'guest',
    isHost: isHostRoute,
    ...(avatarId ? { avatarId } : {}),
  });

  const [pendingKick, setPendingKick] = useState<PublicPlayer | null>(null);
  const [pendingTransferGm, setPendingTransferGm] = useState<PublicPlayer | null>(null);
  const [showMainDesk, setShowMainDesk] = useState(false);
  const [showRoomDeskEditor, setShowRoomDeskEditor] = useState(false);
  const [startErrorToast, setStartErrorToast] = useState<{
    expected: number;
    actual: number;
  } | null>(null);

  // If we landed here without a name (e.g., shared link opened directly), bounce to join form.
  if (!displayName) {
    navigate(`/join?code=${code}`, { replace: true });
    return null;
  }

  const { phase, context, actions, sessionId } = lobby;

  const self = useMemo(
    () => context.players.find((p) => p.sessionId === sessionId) ?? null,
    [context.players, sessionId],
  );

  const hostSessionId = useMemo<SessionId | null>(
    () => context.players.find((p) => p.isHost)?.sessionId ?? null,
    [context.players],
  );

  const viewerIsHost = self?.isHost === true;

  // Phase 2.3: deck size derived from context (must be above early returns to
  // keep hook order consistent across renders — React Rules of Hooks).
  const deckSize = useMemo(
    () => Object.values(context.roomDesk).reduce((sum, n) => sum + n, 0),
    [context.roomDesk],
  );

  // Phase 4.1: GM is excluded from card dealing — deck must match non-GM player count.
  const nonGmCount = useMemo(
    () => context.players.filter((p) => !p.isHost).length,
    [context.players],
  );

  // Phase 2.4: when game is playing, show the dealt-card screen.
  if (phase === 'playing') {
    return (
      <PlayingScreen
        roomCode={code}
        cardId={context.yourCard}
        isHost={viewerIsHost}
        onEndGame={actions.endGame}
        transitionVariant={context.transitionVariant}
      />
    );
  }

  // Edge / terminal states
  if (phase === 'joining_error') {
    return <JoinErrorScreen reason={context.joinError} onHome={() => navigate('/')} />;
  }
  if (phase === 'kicked') {
    return <KickedScreen onHome={() => navigate('/')} />;
  }
  if (phase === 'room_closed') {
    return <RoomClosedScreen onHome={() => navigate('/')} />;
  }

  // Connecting / disconnected: show small overlay banner, but still render lobby chrome if we have a snapshot
  const showConnectingBanner = phase === 'connecting' || phase === 'disconnected';

  const readyCount = context.players.filter((p) => p.isReady).length;
  const totalCount = context.players.length;
  const enoughPlayers = totalCount >= MIN_PLAYERS;
  const allReady = totalCount > 0 && readyCount === totalCount;

  // Phase 4.1: deck must match non-GM player count, not total.
  const deckMatched = nonGmCount > 0 && deckSize === nonGmCount;
  const canStart = enoughPlayers && allReady && deckMatched;

  const handleLeave = () => {
    clearLastRoomCode();
    actions.leave();
    navigate('/');
  };

  const handleStartGame = () => {
    if (deckSize !== nonGmCount) {
      setStartErrorToast({ expected: nonGmCount, actual: deckSize });
      return;
    }
    actions.startGame();
  };

  const handleTransferGmConfirm = () => {
    if (pendingTransferGm) {
      actions.transferGm(pendingTransferGm.sessionId);
      setPendingTransferGm(null);
    }
  };

  const handleIncrement = (cardId: string) => {
    const currentCount = context.roomDesk[cardId] ?? 0;
    actions.setCardCount(cardId, currentCount + 1);
  };

  const handleDecrement = (cardId: string) => {
    const currentCount = context.roomDesk[cardId] ?? 0;
    if (currentCount <= 0) return; // already at 0, no-op
    actions.setCardCount(cardId, currentCount - 1);
  };

  const handleKickConfirm = () => {
    if (pendingKick) {
      actions.kickPlayer(pendingKick.sessionId);
      setPendingKick(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 px-4 pt-5 pb-7 animate-fade-in">
      {/* ----- STICKY HEADER ----- */}
      <div className="shrink-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Flame className="text-accent" size={18} aria-hidden />
            <span className="text-text-primary text-sm font-medium">
              Phòng {formatRoomCode(code)}
            </span>
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setShowMainDesk(true)}
              aria-label="Xem bộ bài"
              className="w-8 h-8 bg-transparent border border-bg-surface-hi rounded-[8px] text-text-primary inline-flex items-center justify-center active:scale-95"
            >
              <Spade size={15} aria-hidden />
            </button>
            <button
              type="button"
              onClick={handleLeave}
              aria-label="Rời phòng"
              className="w-8 h-8 bg-transparent border border-bg-surface-hi rounded-[8px] text-text-primary inline-flex items-center justify-center active:scale-95"
            >
              <LogOut size={15} aria-hidden />
            </button>
          </div>
        </div>
        <p className="text-text-secondary text-xs italic mb-4">
          {allReady && enoughPlayers
            ? '"Tất cả đã sẵn sàng. Đêm sắp buông xuống..."'
            : totalCount === 1
              ? '"Chờ thêm vài dân làng đến..."'
              : '"Đêm về, dân làng tụ họp..."'}
        </p>

        <div className="mb-3.5">
          <ShareRoom code={code} isHost={viewerIsHost} />
        </div>

        <RoomDeskPreview
          roomDesk={context.roomDesk}
          isHost={viewerIsHost}
          onEdit={() => setShowRoomDeskEditor(true)}
        />

        <div className="flex items-center justify-between mb-2">
          <div className="text-text-secondary text-[11px] font-medium tracking-wider">
            {totalCount} DÂN LÀNG QUANH BÀN
          </div>
          {allReady && enoughPlayers ? (
            <div className="text-ready-bg text-[11px] font-medium flex items-center gap-1">
              <Check size={12} aria-hidden /> {readyCount}/{totalCount} sẵn sàng
            </div>
          ) : (
            <div className="text-text-secondary text-[11px]">
              {readyCount} / {totalCount} sẵn sàng
            </div>
          )}
        </div>

        {showConnectingBanner && (
          <div className="text-text-secondary text-[11px] text-center py-1 mb-1.5 italic">
            {phase === 'connecting' ? 'Đang kết nối...' : 'Mất kết nối, đang thử lại...'}
          </div>
        )}
      </div>

      {/* ----- SCROLLABLE PLAYER LIST ----- */}
      <div className="scrollable flex-1 min-h-0 overflow-y-auto mb-3.5 pr-1">
        <PlayerList
          players={context.players}
          selfSessionId={sessionId}
          hostSessionId={hostSessionId}
          onKick={
            viewerIsHost
              ? (targetId) => {
                  const target = context.players.find((p) => p.sessionId === targetId);
                  if (target) setPendingKick(target);
                }
              : undefined
          }
          onTransferGm={
            viewerIsHost
              ? (targetId) => {
                  const target = context.players.find((p) => p.sessionId === targetId);
                  if (target) setPendingTransferGm(target);
                }
              : undefined
          }
        />
      </div>

      {/* ----- STICKY FOOTER ----- */}
      <div className="shrink-0">
        {viewerIsHost ? (
          <>
            {!enoughPlayers ? (
              <Button fullWidth disabled>
                Cần ít nhất {MIN_PLAYERS} người chơi
              </Button>
            ) : !allReady ? (
              <Button fullWidth disabled>
                Chờ mọi người sẵn sàng
              </Button>
            ) : (
              <Button fullWidth onClick={handleStartGame}>
                <Cards size={20} aria-hidden />
                Bắt đầu chia bài
              </Button>
            )}
            {!canStart && (
              <p className="text-text-secondary text-[11px] text-center mt-2">
                {!enoughPlayers || !allReady
                  ? 'Khi tất cả sẵn sàng, bạn có thể bắt đầu'
                  : `Cần đúng ${nonGmCount} thẻ trong bộ bài (hiện ${deckSize})`}
              </p>
            )}
          </>
        ) : (
          <Button
            fullWidth
            variant={self?.isReady ? 'secondary' : 'primary'}
            onClick={() => actions.setReady(!self?.isReady)}
          >
            <Check size={20} aria-hidden />
            {self?.isReady ? 'Bỏ sẵn sàng' : 'Tôi đã sẵn sàng'}
          </Button>
        )}
      </div>

      <KickConfirmDialog
        open={pendingKick !== null}
        targetName={pendingKick?.displayName ?? ''}
        onConfirm={handleKickConfirm}
        onCancel={() => setPendingKick(null)}
      />

      <TransferGmConfirmDialog
        open={pendingTransferGm !== null}
        targetName={pendingTransferGm?.displayName ?? ''}
        onConfirm={handleTransferGmConfirm}
        onCancel={() => setPendingTransferGm(null)}
      />

      {showMainDesk && <MainDeskScreen onClose={() => setShowMainDesk(false)} />}

      {showRoomDeskEditor && viewerIsHost && (
        <RoomDeskEditor
          roomDesk={context.roomDesk}
          playerCount={nonGmCount}
          onIncrement={handleIncrement}
          onDecrement={handleDecrement}
          onClose={() => setShowRoomDeskEditor(false)}
        />
      )}

      <Toast
        open={startErrorToast !== null}
        title="Số thẻ không khớp"
        message={
          startErrorToast
            ? `Cần đúng ${startErrorToast.expected} thẻ trong bộ bài. Hiện tại có ${startErrorToast.actual}.`
            : ''
        }
        onClose={() => setStartErrorToast(null)}
      />
    </div>
  );
}

// ---------- Edge state screens ----------

function JoinErrorScreen({
  reason,
  onHome,
}: {
  reason: ReturnType<typeof useLobby>['context']['joinError'];
  onHome: () => void;
}) {
  const messages: Record<NonNullable<typeof reason>, { title: string; body: string }> = {
    room_full: {
      title: 'Phòng đã đầy',
      body: 'Phòng đã có tối đa người chơi. Bạn không thể vào lúc này.',
    },
    room_not_found: {
      title: 'Không tìm thấy phòng',
      body: 'Code phòng không tồn tại. Kiểm tra lại với chủ phòng.',
    },
    room_in_progress: {
      title: 'Trận đấu đang diễn ra',
      body: 'Trận đấu đã bắt đầu. Hãy chờ chủ phòng kết thúc rồi vào lại.',
    },
    invalid_code: {
      title: 'Code không hợp lệ',
      body: 'Code phải đủ 6 chữ số.',
    },
    invalid_name: {
      title: 'Tên không hợp lệ',
      body: 'Tên không được để trống.',
    },
  };
  const msg = reason ? messages[reason] : { title: 'Không thể vào phòng', body: '' };

  return <EdgeScreen icon={<DoorOpen />} title={msg.title} body={msg.body} onHome={onHome} />;
}

function KickedScreen({ onHome }: { onHome: () => void }) {
  return (
    <EdgeScreen
      icon={<DoorOpen />}
      title="Bạn đã bị mời ra khỏi phòng"
      body="Chủ phòng đã quyết định mời bạn ra. Bạn có thể tạo phòng mới hoặc tham gia phòng khác."
      onHome={onHome}
    />
  );
}

function RoomClosedScreen({ onHome }: { onHome: () => void }) {
  return (
    <EdgeScreen
      icon={<Flame />}
      iconMuted
      title="Phòng đã đóng"
      body="Chủ phòng đã rời đi và không quay lại trong 5 phút. Ngọn lửa đã tắt."
      onHome={onHome}
    />
  );
}

function EdgeScreen({
  icon,
  iconMuted = false,
  title,
  body,
  onHome,
}: {
  icon: React.ReactNode;
  iconMuted?: boolean;
  title: string;
  body: string;
  onHome: () => void;
}) {
  return (
    <div className="flex-1 flex items-center justify-center px-5 animate-fade-in">
      <div className="text-center max-w-[320px]">
        <div
          className={[
            'w-16 h-16 rounded-[18px] inline-flex items-center justify-center mb-4',
            iconMuted ? 'bg-[rgba(138,134,116,0.12)]' : 'bg-[rgba(216,90,48,0.12)]',
          ].join(' ')}
        >
          <span
            className={iconMuted ? 'text-text-secondary' : 'text-danger'}
            aria-hidden
          >
            {icon}
          </span>
        </div>
        <h2 className="text-text-primary text-lg font-medium mb-1.5">{title}</h2>
        <p className="text-text-secondary text-[13px] leading-relaxed mb-6">{body}</p>
        <Button fullWidth onClick={onHome}>
          Về màn hình chính
        </Button>
      </div>
    </div>
  );
}
