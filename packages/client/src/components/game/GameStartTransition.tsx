import { useEffect, useRef, useState } from 'react';
import type { TransitionVariant } from '@werewolf/shared';

interface GameStartTransitionProps {
  variant: TransitionVariant;
  onComplete: () => void;
}

/**
 * Per-variant video assets. Files live in `packages/client/public/transitions/`
 * and are served at the matching path in production.
 *
 * - night: Veo-generated (8s) — sunset → night, moon rises, wolf silhouette
 * - campfire: Veo-generated (8s) — fire grows, animals gather, sparks
 * - dealing: Headless-rendered CSS animation (7s) — cards fan into ring,
 *   ring rotates, central card emerges
 */
const VARIANT_VIDEOS: Record<TransitionVariant, { url: string; durationMs: number }> = {
  night: { url: '/transitions/night.mp4', durationMs: 8_000 },
  campfire: { url: '/transitions/campfire.mp4', durationMs: 8_000 },
  dealing: { url: '/transitions/dealing.mp4', durationMs: 7_000 },
};

/** How long to fade out after the video ends, before unmounting. */
const FADE_OUT_MS = 400;

/**
 * Fullscreen game-start transition overlay (Phase 3.4).
 *
 * Uses pre-rendered MP4 videos for high-quality animations. The server picks
 * a variant in GAME_STARTED and broadcasts it so every player in the room
 * sees the same animation.
 *
 * The video plays once (no loop), then fades out and calls onComplete.
 *
 * Edge cases handled:
 * - Video fails to load → fallback timer based on variant duration still
 *   triggers onComplete so user isn't stuck on a black screen
 * - User skips/refreshes mid-transition → see PlayingScreen logic (skips
 *   transition when transitionVariant arrives as null on reconnect)
 *
 * Mobile requirements baked in:
 * - `muted` is required for autoplay on iOS/Android
 * - `playsInline` prevents iOS Safari from going fullscreen
 * - `preload="auto"` so the file is buffered before play() resolves
 */
export function GameStartTransition({ variant, onComplete }: GameStartTransitionProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [fadingOut, setFadingOut] = useState(false);
  const { url, durationMs } = VARIANT_VIDEOS[variant];

  useEffect(() => {
    // Fallback timer: if `onEnded` never fires (asset 404, codec issue, etc.),
    // still complete the transition after the expected duration + a buffer.
    const fallback = setTimeout(() => {
      setFadingOut(true);
    }, durationMs + 500);

    return () => clearTimeout(fallback);
  }, [durationMs]);

  // After fade-out animation finishes, call onComplete to unmount.
  useEffect(() => {
    if (!fadingOut) return;
    const t = setTimeout(onComplete, FADE_OUT_MS);
    return () => clearTimeout(t);
  }, [fadingOut, onComplete]);

  const handleEnded = () => {
    setFadingOut(true);
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 50,
        background: '#1F2419',
        overflow: 'hidden',
        opacity: fadingOut ? 0 : 1,
        transition: `opacity ${FADE_OUT_MS}ms ease-out`,
      }}
      aria-live="polite"
      role="status"
      aria-label="Đang bắt đầu ván đấu"
    >
      <video
        ref={videoRef}
        src={url}
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={handleEnded}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    </div>
  );
}
