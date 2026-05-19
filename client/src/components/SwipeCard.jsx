import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import FoodImage from './FoodImage';

const THRESHOLD = 100;

export default function SwipeCard({ item, cardKey, onVote, disabled }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-18, 0, 18]);
  const yesOpacity = useTransform(x, [0, 80], [0, 1]);
  const noOpacity = useTransform(x, [-80, 0], [1, 0]);
  const yesTint = useTransform(x, [0, 120], ['rgba(34,197,94,0)', 'rgba(34,197,94,0.3)']);
  const noTint = useTransform(x, [-120, 0], ['rgba(239,68,68,0.3)', 'rgba(239,68,68,0)']);

  const dragging = useRef(false);
  const startX = useRef(0);
  const lockedRef = useRef(false);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    lockedRef.current = false;
    setLocked(false);
    x.set(0);
  }, [item.id, cardKey, x]);

  const commitSwipe = useCallback(
    async (direction) => {
      if (disabled || lockedRef.current) return;
      lockedRef.current = true;
      setLocked(true);
      const choice = direction === 'right' ? 'yes' : 'no';
      try {
        await onVote(choice, item);
      } catch {
        lockedRef.current = false;
        setLocked(false);
        await animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
      }
    },
    [disabled, item, onVote, x]
  );

  const onPointerDown = (e) => {
    if (disabled || locked || lockedRef.current) return;
    dragging.current = true;
    startX.current = e.clientX - x.get();
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!dragging.current || lockedRef.current) return;
    x.set(e.clientX - startX.current);
  };

  const onPointerUp = (e) => {
    if (!dragging.current || lockedRef.current) return;
    dragging.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    const pos = x.get();
    if (pos > THRESHOLD) commitSwipe('right');
    else if (pos < -THRESHOLD) commitSwipe('left');
    else animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
  };

  const isLocked = disabled || locked;

  return (
    <motion.div
      style={{ x, rotate }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={`absolute inset-0 rounded-3xl overflow-hidden shadow-2xl shadow-black/50 touch-none bg-zinc-900 ${
        isLocked ? 'pointer-events-none' : 'cursor-grab active:cursor-grabbing'
      }`}
    >
      <FoodImage
        src={item.image_url}
        alt={item.label}
        loading="eager"
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
      <motion.div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: yesTint }} />
      <motion.div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: noTint }} />
      <motion.div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent pointer-events-none" />

      <motion.span
        style={{ opacity: yesOpacity }}
        className="absolute top-8 left-6 z-10 border-4 border-green-400 text-green-400 font-black text-2xl px-3 py-1 rounded-lg -rotate-12"
      >
        YES
      </motion.span>
      <motion.span
        style={{ opacity: noOpacity }}
        className="absolute top-8 right-6 z-10 border-4 border-red-400 text-red-400 font-black text-2xl px-3 py-1 rounded-lg rotate-12"
      >
        NOPE
      </motion.span>

      <motion.div className="absolute bottom-0 left-0 right-0 p-5 z-10 pointer-events-none">
        <h2 className="text-2xl font-bold text-white">{item.label}</h2>
        <p className="text-zinc-300 text-sm mt-1 line-clamp-2">{item.description}</p>
      </motion.div>
    </motion.div>
  );
}

export function VoteButtons({ onVote, disabled }) {
  return (
    <div className="flex justify-center gap-8 mt-6">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onVote('no')}
        className="w-14 h-14 rounded-full bg-zinc-800 border-2 border-red-500/60 text-red-400 text-xl font-bold shadow-lg active:scale-95 disabled:opacity-40"
        aria-label="Vote no"
      >
        ✕
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onVote('yes')}
        className="w-14 h-14 rounded-full bg-zinc-800 border-2 border-green-500/60 text-green-400 text-xl font-bold shadow-lg active:scale-95 disabled:opacity-40"
        aria-label="Vote yes"
      >
        ♥
      </button>
    </div>
  );
}
