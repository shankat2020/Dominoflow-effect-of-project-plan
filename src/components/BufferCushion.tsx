import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, ShieldAlert, Zap, AlertCircle } from 'lucide-react';

interface BufferCushionProps {
  startDay: number;
  remainingDays: number;
  baselineDays: number;
  dayWidth: number;
  sourceTaskName: string;
  targetName: string;
}

export const BufferCushion: React.FC<BufferCushionProps> = ({
  startDay,
  remainingDays,
  baselineDays,
  dayWidth,
  sourceTaskName,
  targetName,
}) => {
  // If there was never any float/buffer between these tasks, nothing to render
  if (baselineDays <= 0 && remainingDays <= 0) {
    return null;
  }

  const isExhausted = remainingDays <= 0;
  const isNarrow = remainingDays === 1;
  const pixelWidth = Math.max(remainingDays, 0) * dayWidth;
  const leftPosition = startDay * dayWidth;

  const percentRemaining = baselineDays > 0 ? Math.round((remainingDays / baselineDays) * 100) : 0;

  // Cushion is depleted (exhausted)
  if (isExhausted) {
    return (
      <div
        className="absolute top-1/2 -translate-y-1/2 z-20 pointer-events-auto"
        style={{ left: `${leftPosition - 8}px` }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="group relative flex items-center"
        >
          {/* Physical Domino Impact Point */}
          <div className="w-4 h-12 rounded bg-rose-500/20 border-2 border-dashed border-rose-500 flex items-center justify-center animate-pulse shadow-lg shadow-rose-500/30">
            <span className="text-[10px] text-rose-300 font-bold">⚡</span>
          </div>

          {/* Depleted Indicator Badge floating above */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded bg-rose-950/90 border border-rose-500/60 text-[9px] font-bold text-rose-200 flex items-center gap-1 shadow-md">
            <span>0d cushion (absorbed {baselineDays}d)</span>
          </div>

          {/* Detailed hover card */}
          <div className="absolute left-1/2 -translate-x-1/2 top-14 hidden group-hover:block z-50 w-52 p-2.5 rounded-lg bg-slate-900 border border-rose-500/40 shadow-xl text-left pointer-events-none">
            <div className="flex items-center gap-1 text-[11px] font-bold text-rose-300">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Buffer Cushion Depleted!</span>
            </div>
            <p className="text-[10px] text-slate-300 mt-1 leading-snug">
              The original <strong>{baselineDays}d safety cushion</strong> between &ldquo;{sourceTaskName}&rdquo; and &ldquo;{targetName}&rdquo; has been completely eaten by delays. Any further delay bumps downstream tasks!
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Active Cushion (safe or tight)
  return (
    <motion.div
      layout
      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
      className="absolute top-1/2 -translate-y-1/2 z-15 pointer-events-auto group"
      style={{
        left: `${leftPosition}px`,
        width: `${pixelWidth}px`,
        height: '42px',
      }}
    >
      <div
        className={`w-full h-full rounded-lg border flex items-center justify-center relative overflow-hidden transition-all ${
          isNarrow
            ? 'buffer-stripe-warn border-amber-500/40 bg-amber-950/20 shadow-amber-500/10'
            : 'buffer-stripe-safe border-emerald-500/40 bg-emerald-950/20 shadow-emerald-500/10'
        } hover:border-emerald-400 hover:shadow-lg`}
      >
        {/* Soft edge caps */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500/50 rounded-l" />
        <div className="absolute right-0 top-0 bottom-0 w-1 bg-emerald-500/50 rounded-r" />

        {/* Cushion Label inside the block */}
        <div className="px-1 text-center whitespace-nowrap overflow-hidden text-ellipsis flex items-center justify-center gap-1">
          {pixelWidth > 75 ? (
            <span className={`text-[11px] font-bold tracking-tight flex items-center gap-1 tabular-nums ${
              isNarrow ? 'text-amber-300' : 'text-emerald-300'
            }`}>
              <ShieldCheck className="w-3 h-3 shrink-0" />
              <span>{remainingDays}d safety buffer</span>
            </span>
          ) : pixelWidth > 38 ? (
            <span className={`text-[10px] font-bold tabular-nums ${
              isNarrow ? 'text-amber-300' : 'text-emerald-300'
            }`}>
              {remainingDays}d safe
            </span>
          ) : (
            <span className="text-[9px] font-black text-emerald-300 tabular-nums">
              {remainingDays}d
            </span>
          )}
        </div>

        {/* Subtle progress indicator line at bottom of cushion */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-800">
          <div
            className={`h-full ${isNarrow ? 'bg-amber-400' : 'bg-emerald-400'}`}
            style={{ width: `${percentRemaining}%` }}
          />
        </div>
      </div>

      {/* Floating Tooltip */}
      <div className="absolute left-1/2 -translate-x-1/2 -top-12 opacity-0 group-hover:opacity-100 transition-opacity z-40 pointer-events-none whitespace-nowrap px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 shadow-xl text-left">
        <div className="text-[11px] font-semibold text-slate-200 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{remainingDays} Safe Float Days Available</span>
        </div>
        <p className="text-[10px] text-slate-400 mt-0.5">
          Delays in &ldquo;{sourceTaskName}&rdquo; up to {remainingDays}d will be absorbed here safely.
        </p>
      </div>
    </motion.div>
  );
};
