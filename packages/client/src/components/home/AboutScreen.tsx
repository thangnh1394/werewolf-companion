import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, ExternalLink } from 'lucide-react';
import { CARDS } from '@werewolf/shared';

/**
 * About / Credits screen — accessible from home page footer.
 * Lists asset credits and project metadata.
 *
 * Follows Golden Rule 1: sticky header + scrollable body.
 */
export function AboutScreen() {
  const navigate = useNavigate();

  const creditedPhotos = CARDS.filter((c) => c.photographer);

  return (
    <div className="flex-1 flex flex-col min-h-0 animate-fade-in">
      {/* Sticky header */}
      <div className="shrink-0 px-4 pt-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            aria-label="Quay lại"
            className="w-9 h-9 bg-transparent border border-bg-surface-hi rounded-[10px] text-text-primary inline-flex items-center justify-center active:scale-95"
          >
            <ArrowLeft size={18} aria-hidden />
          </button>
          <div>
            <h1 className="text-text-primary text-lg font-medium m-0">Giới thiệu</h1>
            <p className="text-text-secondary text-xs m-0">Về Sói Đêm</p>
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="scrollable flex-1 min-h-0 overflow-y-auto px-5 pt-5 pb-7">
        <section className="mb-6">
          <h2 className="text-text-primary text-base font-medium mb-2">
            Sói Đêm
          </h2>
          <p className="text-text-secondary text-sm leading-relaxed">
            Ứng dụng chia bài ma sói qua điện thoại — không cần đem bộ bài vật lý.
            Mỗi người chơi dùng điện thoại riêng, chủ phòng tạo phòng và chia sẻ
            code/QR cho bạn bè. Miễn phí. Không quảng cáo.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-text-primary text-base font-medium mb-3">
            Tín dụng
          </h2>
          <ul className="list-none p-0 m-0 space-y-2">
            <li className="bg-bg-surface border border-bg-surface-hi rounded-[10px] px-3.5 py-2.5">
              <div className="text-text-primary text-sm font-medium">Tranh minh họa thẻ bài</div>
              <div className="text-text-secondary text-[11px]">AI-generated — Google ImageFX</div>
            </li>
            <li className="bg-bg-surface border border-bg-surface-hi rounded-[10px] px-3.5 py-2.5">
              <div className="text-text-primary text-sm font-medium">Avatar nhân vật</div>
              <div className="text-text-secondary text-[11px]">AI-generated — Google ImageFX</div>
            </li>
            <li className="bg-bg-surface border border-bg-surface-hi rounded-[10px] px-3.5 py-2.5">
              <div className="text-text-primary text-sm font-medium">Video chuyển cảnh</div>
              <div className="text-text-secondary text-[11px]">AI-generated — Google Veo · CSS animation</div>
            </li>
            {creditedPhotos.map((card) => (
              <li
                key={card.id}
                className="bg-bg-surface border border-bg-surface-hi rounded-[10px] px-3.5 py-2.5 flex items-center justify-between"
              >
                <div className="min-w-0">
                  <div className="text-text-primary text-sm font-medium truncate">
                    {card.name}
                  </div>
                  <div className="text-text-secondary text-[11px] truncate">
                    {card.photographer} · Pexels
                  </div>
                </div>
                {card.photoUrl && (
                  <a
                    href={card.photoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Xem ảnh gốc của ${card.photographer} trên Pexels`}
                    className="text-accent shrink-0 active:scale-95"
                  >
                    <ExternalLink size={14} aria-hidden />
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-text-primary text-base font-medium mb-2">
            Nguồn tham khảo
          </h2>
          <p className="text-text-secondary text-sm leading-relaxed">
            Luật chơi và mô tả vai trò được tham khảo từ cộng đồng ma sói Việt Nam:
            dienmayxanh.com, xtmobile.vn, playplus.vn, hoanghamobile.com.
          </p>
        </section>

        <section>
          <div className="text-text-secondary text-xs flex items-center justify-center gap-1.5">
            Made with <Heart size={12} className="text-accent" aria-hidden /> for ma sói
            nights
          </div>
        </section>
      </div>
    </div>
  );
}
