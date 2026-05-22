import { motion } from 'motion/react';

export function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="vote-progress">
      <div className="vote-progress-text">
        <span>{current}/{total} personagens</span>
      </div>
      <div className="vote-progress-track">
        <motion.div
          className="vote-progress-fill"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

export function ConfettiBurst({ active }: { active: boolean }) {
  if (!active) return null;

  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 600,
    y: -(100 + Math.random() * 300),
    rotate: Math.random() * 720 - 360,
    scale: 0.5 + Math.random(),
    color: ['#FF2D6B', '#FFD700', '#4ECDC4', '#C44DFF', '#FF6B35', '#5DADE2'][
      Math.floor(Math.random() * 6)
    ],
  }));

  return (
    <div className="confetti-burst-container">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          style={{
            position: 'absolute',
            width: 8,
            height: 8,
            backgroundColor: p.color,
            borderRadius: '2px',
          }}
          initial={{ x: 0, y: 0, rotate: 0, scale: 0, opacity: 1 }}
          animate={{ x: p.x, y: p.y, rotate: p.rotate, scale: p.scale, opacity: 0 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}