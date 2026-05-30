import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { TransitionVariant } from '@werewolf/shared';
import { NightFallsTransition } from './NightFallsTransition';
import { CampfireTransition } from './CampfireTransition';
import { CardDealingTransition } from './CardDealingTransition';

interface GameStartTransitionProps {
  variant: TransitionVariant;
  onComplete: () => void;
}

/**
 * Per-variant duration tuning (Phase 3.4).
 *
 * Picked to match the natural feel of each animation: night-falls is the
 * slowest fade with a typewriter at the end so it gets the most time;
 * campfire's particle work peaks faster; card-dealing is the punchiest.
 */
const VARIANT_DURATION_MS: Record<TransitionVariant, number> = {
  night: 10_000,
  campfire: 8_000,
  dealing: 7_000,
};

/**
 * Fullscreen game-start transition overlay (Phase 3.4).
 *
 * Receives a server-chosen variant so every player in the room sees the same
 * animation. Auto-dismisses after the variant's duration (no tap-to-skip per
 * UX decision — players wait through the full transition).
 *
 * Calls `onComplete` once the animation finishes. The caller (PlayingScreen)
 * uses this to switch from the transition overlay to the actual card UI.
 */
export function GameStartTransition({ variant, onComplete }: GameStartTransitionProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const duration = VARIANT_DURATION_MS[variant];
    const timer = setTimeout(() => {
      setVisible(false);
    }, duration);
    return () => clearTimeout(timer);
  }, [variant]);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {visible && (
        <motion.div
          key={variant}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 50,
            background: '#1F2419',
            overflow: 'hidden',
          }}
          aria-live="polite"
          role="status"
          aria-label="Đang bắt đầu ván đấu"
        >
          {variant === 'night' && <NightFallsTransition />}
          {variant === 'campfire' && <CampfireTransition />}
          {variant === 'dealing' && <CardDealingTransition />}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
