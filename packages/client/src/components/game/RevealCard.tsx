import { useRef, useState, type PointerEvent } from 'react';
import { Moon, Eye } from 'lucide-react';
import type { Card } from '@werewolf/shared';
import { TEAM_INFO } from '@werewolf/shared';

interface RevealCardProps {
  card: Card;
}

/**
 * Tap-and-hold reveal card.
 *
 * Front (mặt mở): role image + team badge + name + shortAbility
 * Back  (mặt úp): card back image (forest moon) + "SÓI ĐÊM" label
 *
 * Same frame size (aspect 0.7) for both faces, so the visual swap feels like
 * flipping a physical card.
 *
 * Interactions:
 *  - pointerdown (anywhere on the card) → reveal
 *  - pointerup / pointercancel / pointerleave → hide
 *
 * Transition: card briefly rotates Y (~90deg) during the swap, settling flat
 * on the new face. Not a full 360° spin — a quick tilt that suggests flipping.
 *
 * Card scope: tap-and-hold listener is bound to the card element only —
 * outside the card (header, "Xem chi tiết" button) does NOT trigger reveal.
 */
export function RevealCard({ card }: RevealCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [animating, setAnimating] = useState(false);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const teamInfo = TEAM_INFO[card.team];
  const gradientByTeam = {
    wolf: 'linear-gradient(180deg, #3A2A2A, #1F2419)',
    village: 'linear-gradient(180deg, #2D3225, #1F2419)',
    solo: 'linear-gradient(180deg, #2A2A3A, #1F2419)',
  } as const;

  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(12);
      } catch {
        // ignore
      }
    }
  };

  /**
   * Run a brief tilt animation, then commit the new state.
   * We don't preserve a tilt afterwards — settled card sits flat.
   */
  const flipTo = (toRevealed: boolean) => {
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
    setAnimating(true);
    // Mid-animation, swap the face. Total animation = 280ms.
    animTimerRef.current = setTimeout(() => {
      setRevealed(toRevealed);
      animTimerRef.current = setTimeout(() => {
        setAnimating(false);
        animTimerRef.current = null;
      }, 140);
    }, 140);
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    // Capture pointer so we keep getting events even if finger drifts slightly
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    if (revealed) return;
    triggerHaptic();
    flipTo(true);
  };

  const handlePointerRelease = () => {
    if (!revealed) return;
    flipTo(false);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  // Transform: during animation, rotateY 0 → 90 → 0 (peaks at swap moment).
  // Outside animation, rotateY(0) — flat card.
  const transform = animating ? 'perspective(800px) rotateY(85deg)' : 'perspective(800px) rotateY(0deg)';

  const borderColor = revealed ? teamInfo.accentColor : '#3D4533';
  const shadowColor = revealed
    ? `0 12px 28px ${teamInfo.accentColor}33`
    : '0 12px 28px rgba(0,0,0,0.45)';

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerRelease}
      onPointerCancel={handlePointerRelease}
      onPointerLeave={handlePointerRelease}
      onContextMenu={handleContextMenu}
      aria-label={revealed ? `Vai của bạn: ${card.name}` : 'Giữ để xem vai của bạn'}
      role="button"
      tabIndex={0}
      style={{
        aspectRatio: '0.7',
        width: '100%',
        maxWidth: '240px',
        borderRadius: '18px',
        background: revealed ? '#2D3225' : 'linear-gradient(160deg, #2D3225, #1F2419)',
        border: `2px solid ${borderColor}`,
        boxShadow: shadowColor,
        position: 'relative',
        cursor: 'pointer',
        margin: '0 auto',
        padding: revealed ? '14px' : '0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transform,
        transition: 'transform 140ms ease-in-out, border-color 180ms ease, box-shadow 180ms ease, background 180ms ease',
        transformStyle: 'preserve-3d',
        willChange: 'transform',
        touchAction: 'none',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
    >
      {/* Inner border filigree (always present) */}
      <div
        style={{
          position: 'absolute',
          inset: '8px',
          border: `1px solid ${revealed ? `${teamInfo.accentColor}4D` : 'rgba(232,155,60,0.25)'}`,
          borderRadius: '12px',
          pointerEvents: 'none',
        }}
      />

      {revealed ? (
        <>
          {/* Role image */}
          <div
            style={{
              width: '52%',
              aspectRatio: '1',
              borderRadius: '12px',
              background: gradientByTeam[card.team],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '10px',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <img
              src={card.imageUrl}
              alt=""
              draggable={false}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              aria-hidden
            />
          </div>

          {/* Team badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              background: `${teamInfo.accentColor}26`,
              border: `1px solid ${teamInfo.accentColor}59`,
              borderRadius: '5px',
              padding: '2px 9px',
              marginBottom: '6px',
            }}
          >
            <div
              style={{
                width: '5px',
                height: '5px',
                background: teamInfo.accentColor,
                borderRadius: '50%',
              }}
              aria-hidden
            />
            <span
              style={{
                color: teamInfo.accentColor,
                fontSize: '10px',
                fontWeight: 500,
                letterSpacing: '0.5px',
              }}
            >
              {teamInfo.label.toUpperCase()}
            </span>
          </div>

          {/* Role name */}
          <div
            style={{
              color: '#F5EFE0',
              fontSize: '19px',
              fontWeight: 500,
              marginBottom: '6px',
              textAlign: 'center',
              lineHeight: 1.1,
            }}
          >
            {card.name}
          </div>

          {/* Short ability */}
          <p
            style={{
              color: '#8A8674',
              fontSize: '11px',
              lineHeight: 1.4,
              textAlign: 'center',
              margin: 0,
              padding: '0 4px',
            }}
          >
            {card.shortAbility}
          </p>
        </>
      ) : (
        <>
          {/* Card back — placeholder SVG or Gemini-generated WebP via <img> below */}
          <img
            src="/cards/card-back.webp"
            onError={(e) => {
              // Fallback to placeholder SVG if WebP not yet generated
              (e.currentTarget as HTMLImageElement).src = '/cards/card-back.svg';
            }}
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              inset: '8px',
              width: 'calc(100% - 16px)',
              height: 'calc(100% - 16px)',
              objectFit: 'cover',
              borderRadius: '12px',
              pointerEvents: 'none',
            }}
            aria-hidden
          />
          {/* "Held to reveal" eye indicator overlay (shown briefly on the back) */}
        </>
      )}

      {/* "Đang hiện" overlay indicator when revealed */}
      {revealed && !animating && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: `${teamInfo.accentColor}E6`,
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
          aria-hidden
        >
          <Eye size={13} style={{ color: '#1F2419' }} />
        </div>
      )}

      {/* Decorative moon icon on the back is via SVG image; no extra icon needed */}
      <Moon style={{ display: 'none' }} aria-hidden />
    </div>
  );
}
