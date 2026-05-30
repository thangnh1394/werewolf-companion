import { motion } from 'framer-motion';

/**
 * Card Dealing (7s):
 *  - 0-1s: Dark background, single amber glow at center
 *  - 1-4s: Cards fan out from center to surrounding positions, with amber trails
 *  - 4-5s: Cards "land", small rumble (shake)
 *  - 5-6s: One central card zooms toward viewer, then fades
 *  - 6-7s: Text appears
 */

// 8 cards fanning outward at different angles & distances.
const CARDS = Array.from({ length: 8 }, (_, i) => {
  const angle = (i / 8) * Math.PI * 2 - Math.PI / 2; // start at top
  const distance = 32; // % of viewport from center
  return {
    angle: (angle * 180) / Math.PI,
    targetX: Math.cos(angle) * distance,
    targetY: Math.sin(angle) * distance,
  };
});

export function CardDealingTransition() {
  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* Background — slight radial glow that pulses */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            'radial-gradient(circle at 50% 50%, rgba(232,155,60,0.05) 0%, #1F2419 70%)',
            'radial-gradient(circle at 50% 50%, rgba(232,155,60,0.25) 0%, #1F2419 60%)',
            'radial-gradient(circle at 50% 50%, rgba(232,155,60,0.12) 0%, #1F2419 65%)',
          ],
        }}
        transition={{ duration: 7, times: [0, 0.4, 1], ease: 'easeInOut' }}
      />

      {/* Center origin pulse */}
      <motion.div
        className="absolute"
        style={{
          left: '50%',
          top: '50%',
          width: 60,
          height: 60,
          marginLeft: -30,
          marginTop: -30,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(232,155,60,0.6) 0%, transparent 70%)',
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: [0, 1.5, 1, 1, 0],
          opacity: [0, 1, 0.8, 0.6, 0],
        }}
        transition={{ duration: 5, times: [0, 0.15, 0.3, 0.6, 1] }}
        aria-hidden
      />

      {/* 8 cards fanning out */}
      {CARDS.map((card, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: '50%',
            top: '50%',
            width: 'min(13vw, 60px)',
            aspectRatio: '0.7',
            borderRadius: '8px',
            background: 'linear-gradient(160deg, #2D3225, #1F2419)',
            border: '1.5px solid rgba(232,155,60,0.5)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5), 0 0 8px rgba(232,155,60,0.3)',
            marginLeft: 'min(-6.5vw, -30px)',
            marginTop: 'min(-9.2vw, -42px)',
            transformStyle: 'preserve-3d',
          }}
          initial={{
            x: 0,
            y: 0,
            rotate: 0,
            scale: 0,
            opacity: 0,
          }}
          animate={{
            x: [0, 0, `${card.targetX}vw`, `${card.targetX}vw`, `${card.targetX}vw`],
            y: [0, 0, `${card.targetY}vw`, `${card.targetY}vw`, `${card.targetY}vw`],
            rotate: [0, 0, card.angle + 90, card.angle + 88, card.angle + 90],
            scale: [0, 1, 1, 1.05, 0.95],
            opacity: [0, 1, 1, 1, 0.6],
          }}
          transition={{
            duration: 5,
            times: [0, 0.2, 0.6, 0.7, 1],
            delay: 0.5 + i * 0.05,
            ease: 'easeOut',
          }}
          aria-hidden
        >
          {/* Tiny moon emblem on card back */}
          <div
            style={{
              position: 'absolute',
              inset: 4,
              borderRadius: '5px',
              border: '0.5px solid rgba(232,155,60,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
            }}
          >
            <span style={{ color: '#E89B3C', opacity: 0.6 }}>☾</span>
          </div>
        </motion.div>
      ))}

      {/* Central card — zooms toward viewer at end */}
      <motion.div
        className="absolute"
        style={{
          left: '50%',
          top: '50%',
          width: 'min(20vw, 100px)',
          aspectRatio: '0.7',
          borderRadius: '12px',
          background: 'linear-gradient(160deg, #3A2A2A, #1F2419)',
          border: '2px solid #E89B3C',
          boxShadow: '0 8px 24px rgba(0,0,0,0.6), 0 0 24px rgba(232,155,60,0.5)',
          marginLeft: 'min(-10vw, -50px)',
          marginTop: 'min(-14.3vw, -71px)',
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: [0, 0, 1, 1.4, 2.5],
          opacity: [0, 0, 1, 1, 0],
        }}
        transition={{ duration: 7, times: [0, 0.55, 0.7, 0.85, 1], ease: 'easeOut' }}
        aria-hidden
      >
        <div
          style={{
            position: 'absolute',
            inset: 6,
            borderRadius: '8px',
            border: '1px solid rgba(232,155,60,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 36,
            color: '#E89B3C',
          }}
        >
          ☾
        </div>
      </motion.div>

      {/* Text overlay — appears at 5s */}
      <motion.div
        className="absolute"
        style={{
          bottom: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '85%',
          textAlign: 'center',
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 5 }}
      >
        <div
          style={{
            color: '#F5EFE0',
            fontFamily: '"Be Vietnam Pro", system-ui, sans-serif',
            fontSize: 'clamp(15px, 4vw, 19px)',
            fontStyle: 'italic',
            lineHeight: 1.4,
            textShadow: '0 2px 8px rgba(0,0,0,0.6)',
          }}
        >
          Bài đã được chia...
          <br />
          Vai trò của bạn đang chờ.
        </div>
      </motion.div>
    </div>
  );
}
