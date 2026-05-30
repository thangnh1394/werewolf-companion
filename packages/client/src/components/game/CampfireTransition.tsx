import { motion } from 'framer-motion';

/**
 * Campfire (8s):
 *  - 0-2s: Dark forest, faint silhouettes appear around a center point
 *  - 2-5s: Fire ignites in center, particles rise
 *  - 5-7s: Fire grows, "zoom in" feel via scale
 *  - 7-8s: Text appears
 */

// Pre-computed spark positions/timings so they look natural but render stably.
const SPARKS = Array.from({ length: 14 }, (_, i) => ({
  delay: (i * 0.35) % 4,
  duration: 2.4 + (i % 3) * 0.4,
  xOffset: (i % 2 === 0 ? -1 : 1) * (15 + (i * 7) % 25),
  startX: 50 + (i % 5 - 2) * 4,
}));

export function CampfireTransition() {
  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* Dark background with subtle radial glow */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            'radial-gradient(circle at 50% 65%, rgba(216,90,48,0) 0%, #1F2419 60%)',
            'radial-gradient(circle at 50% 65%, rgba(216,90,48,0.4) 0%, #1F2419 50%)',
            'radial-gradient(circle at 50% 65%, rgba(216,90,48,0.6) 0%, #1F2419 45%)',
          ],
        }}
        transition={{ duration: 5, times: [0, 0.5, 1], ease: 'easeIn' }}
      />

      {/* Player silhouettes around fire (6 figures) */}
      <motion.svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.5, 0.7] }}
        transition={{ duration: 6, times: [0, 0.3, 1] }}
        aria-hidden
      >
        <g fill="#0A0C08" opacity={0.85}>
          {[0, 60, 120, 180, 240, 300].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            const cx = 50 + Math.cos(rad) * 32;
            const cy = 65 + Math.sin(rad) * 18;
            return (
              <g key={deg} transform={`translate(${cx}, ${cy})`}>
                <ellipse cx="0" cy="-4" rx="2.5" ry="3" />
                <path d="M -4 0 L 4 0 L 5 8 L -5 8 Z" />
              </g>
            );
          })}
        </g>
      </motion.svg>

      {/* Campfire base — logs */}
      <motion.svg
        className="absolute"
        style={{
          left: '50%',
          top: '60%',
          width: 'min(28vw, 140px)',
          transform: 'translateX(-50%)',
        }}
        viewBox="0 0 100 30"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        aria-hidden
      >
        <g>
          <rect x="20" y="18" width="60" height="6" rx="2" fill="#3D2A1A" />
          <rect x="25" y="22" width="50" height="5" rx="2" fill="#2D1F12" transform="rotate(-3 50 24)" />
        </g>
      </motion.svg>

      {/* Flames */}
      <motion.svg
        className="absolute"
        style={{
          left: '50%',
          top: '40%',
          width: 'min(30vw, 160px)',
          height: 'min(40vw, 200px)',
          transform: 'translateX(-50%)',
        }}
        viewBox="0 0 80 100"
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: [0, 1.1, 1, 1.15, 1, 1.2, 1],
          opacity: [0, 1, 1, 1, 1, 1, 1],
        }}
        transition={{
          duration: 5,
          delay: 2,
          times: [0, 0.15, 0.3, 0.5, 0.7, 0.85, 1],
        }}
        aria-hidden
      >
        <defs>
          <radialGradient id="flame" cx="50%" cy="80%" r="60%">
            <stop offset="0%" stopColor="#FFD580" />
            <stop offset="40%" stopColor="#E89B3C" />
            <stop offset="80%" stopColor="#D85A30" />
            <stop offset="100%" stopColor="#7A2A15" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path
          d="M 40 95 Q 20 70 30 50 Q 35 30 40 25 Q 45 30 50 50 Q 60 70 40 95 Z"
          fill="url(#flame)"
        />
      </motion.svg>

      {/* Sparks rising */}
      {SPARKS.map((spark, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: `${spark.startX}%`,
            bottom: '30%',
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: '#FFD580',
            boxShadow: '0 0 6px #E89B3C',
          }}
          initial={{ opacity: 0, y: 0, x: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            y: [-10, -180],
            x: [0, spark.xOffset],
          }}
          transition={{
            duration: spark.duration,
            delay: 2.5 + spark.delay,
            repeat: Infinity,
            repeatDelay: 0.2,
            ease: 'easeOut',
          }}
          aria-hidden
        />
      ))}

      {/* Text overlay — appears at 6s */}
      <motion.div
        className="absolute"
        style={{
          bottom: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '85%',
          textAlign: 'center',
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 6 }}
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
          Ngọn lửa đã được nhóm...
          <br />
          Hãy quan sát kỹ những người xung quanh.
        </div>
      </motion.div>
    </div>
  );
}
