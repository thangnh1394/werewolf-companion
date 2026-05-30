import { motion } from 'framer-motion';

/**
 * Night Falls (10s) — slow ambient transition:
 *  - 0-2s: Amber sunset gradient fills screen
 *  - 1-4s: Pine tree silhouettes rise from bottom
 *  - 3-7s: Moon climbs from horizon to upper-center
 *  - 5-7s: Wolves silhouettes howl briefly
 *  - 7-10s: Typewriter line "Đêm đã xuống..."
 */
export function NightFallsTransition() {
  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* Sunset → night gradient */}
      <motion.div
        className="absolute inset-0"
        initial={{ background: 'linear-gradient(180deg, #E89B3C 0%, #5A3F26 60%, #1F2419 100%)' }}
        animate={{
          background: [
            'linear-gradient(180deg, #E89B3C 0%, #5A3F26 60%, #1F2419 100%)',
            'linear-gradient(180deg, #B47020 0%, #3D2A1A 50%, #1F2419 100%)',
            'linear-gradient(180deg, #1F2419 0%, #1F2419 100%)',
          ],
        }}
        transition={{ duration: 6, times: [0, 0.5, 1], ease: 'easeInOut' }}
      />

      {/* Moon — rises from below-center to upper-center */}
      <motion.div
        className="absolute"
        style={{
          width: 'min(40vw, 200px)',
          height: 'min(40vw, 200px)',
          left: '50%',
          marginLeft: 'min(-20vw, -100px)',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 45%, #F5EFE0 0%, #E89B3C 70%, #5A3F26 100%)',
          boxShadow: '0 0 80px rgba(232,155,60,0.5)',
        }}
        initial={{ top: '80%', opacity: 0 }}
        animate={{
          top: ['80%', '80%', '30%'],
          opacity: [0, 0.8, 1],
        }}
        transition={{ duration: 7, times: [0, 0.3, 1], ease: 'easeOut' }}
        aria-hidden
      />

      {/* Pine tree silhouettes — rise from bottom */}
      <motion.svg
        className="absolute bottom-0 left-0 w-full"
        viewBox="0 0 400 200"
        preserveAspectRatio="xMidYMax slice"
        style={{ height: '40%' }}
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 3, delay: 1, ease: 'easeOut' }}
        aria-hidden
      >
        <g fill="#0A0C08">
          <polygon points="20,200 50,80 80,200" />
          <polygon points="60,200 100,40 140,200" />
          <polygon points="120,200 160,90 200,200" />
          <polygon points="180,200 220,30 260,200" />
          <polygon points="240,200 280,75 320,200" />
          <polygon points="300,200 340,45 380,200" />
        </g>
      </motion.svg>

      {/* Wolves silhouettes — appear briefly at 5s */}
      <motion.div
        className="absolute"
        style={{ bottom: '15%', left: '50%', transform: 'translateX(-50%)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 0.6, 0.6, 0] }}
        transition={{ duration: 10, times: [0, 0.45, 0.55, 0.75, 0.85] }}
        aria-hidden
      >
        <svg viewBox="0 0 100 40" style={{ width: '120px', height: '48px' }}>
          <g fill="#0A0C08">
            {/* Two stylized wolf silhouettes */}
            <path d="M 10 30 L 12 18 L 8 20 L 14 14 L 18 18 L 22 14 L 26 18 L 28 20 L 24 18 L 26 30 Z" />
            <path d="M 60 30 L 62 18 L 58 20 L 64 14 L 68 18 L 72 14 L 76 18 L 78 20 L 74 18 L 76 30 Z" />
          </g>
        </svg>
      </motion.div>

      {/* Typewriter text — appears late */}
      <motion.div
        className="absolute"
        style={{
          bottom: '8%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '85%',
          textAlign: 'center',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 6.5 }}
      >
        <div
          style={{
            color: '#F5EFE0',
            fontFamily: '"Be Vietnam Pro", system-ui, sans-serif',
            fontSize: 'clamp(15px, 4vw, 19px)',
            fontStyle: 'italic',
            lineHeight: 1.4,
          }}
        >
          <Typewriter text="Đêm đã xuống..." startDelay={6800} />
          <br />
          <Typewriter text="Bàn gỗ kể chuyện bắt đầu." startDelay={8000} />
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Simple typewriter — reveals one character at a time using
 * CSS character-count-driven width animation isn't reliable on mobile,
 * so we use a JS-based approach via animated index.
 */
function Typewriter({ text, startDelay }: { text: string; startDelay: number }) {
  return (
    <motion.span
      initial={{ width: 0 }}
      animate={{ width: '100%' }}
      transition={{ duration: text.length * 0.05, delay: startDelay / 1000, ease: 'linear' }}
      style={{
        display: 'inline-block',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        verticalAlign: 'bottom',
      }}
    >
      {text}
    </motion.span>
  );
}
