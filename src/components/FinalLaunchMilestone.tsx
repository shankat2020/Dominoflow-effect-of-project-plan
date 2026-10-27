import React from 'react';
import { motion } from 'motion/react';
import { Rocket, Sparkles, AlertTriangle, CheckCircle, Flag } from 'lucide-react';
import { dayToDate } from '../utils/simulation';
import confetti from 'canvas-confetti';

interface FinalLaunchMilestoneProps {
  baselineLaunchDay: number;
  simulatedLaunchDay: number;
  dayWidth: number;
  totalHeight: number;
  netSlip: number;
  startDate?: string;
}

export const FinalLaunchMilestone: React.FC<FinalLaunchMilestoneProps> = ({
  baselineLaunchDay,
  simulatedLaunchDay,
  dayWidth,
  totalHeight,
  netSlip,
  startDate = '2026-11-02',
}) => {
  const baselineLeft = baselineLaunchDay * dayWidth;
  const simulatedLeft = simulatedLaunchDay * dayWidth;

  const baselineDate = dayToDate(baselineLaunchDay, startDate);
  const simulatedDate = dayToDate(simulatedLaunchDay, startDate);

  const isDelayed = netSlip > 0;
  const isEarly = netSlip < 0;
  const hasMoved = simulatedLaunchDay !== baselineLaunchDay;

  const handleTriggerCelebration = () => {
    if (!isDelayed) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10b981', '#6366f1', '#ec4899', '#38bdf8'],
      });
    }
  };

  return (
    <>
      {/* 1. Original Baseline Vertical Guide Line & Ghost Pin */}
      <div
        className="absolute top-0 bottom-0 z-10 pointer-events-none transition-all flex flex-col items-center"
        style={{
          left: `${baselineLeft}px`,
        }}
      >
        {/* Baseline ruler dashed line */}
        <div className="w-[1px] h-full border-r border-dashed border-slate-500/40" />

        {/* Ghost Baseline Flag floating at top ruler */}
        {hasMoved && (
          <div className="absolute top-1 -translate-x-1/2 px-2 py-0.5 rounded bg-slate-900/90 border border-dashed border-slate-600 text-[10px] text-slate-400 font-mono flex items-center gap-1 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>Target: Day {baselineLaunchDay}</span>
          </div>
        )}
      </div>

      {/* 2. Ghost Outline Pill if Milestone Has Slipped */}
      {hasMoved && (
        <div
          className="absolute z-10 pointer-events-none opacity-40 top-1/2 -translate-y-1/2 -translate-x-1/2"
          style={{ left: `${baselineLeft}px` }}
        >
          <div className="px-4 py-2.5 rounded-2xl border-2 border-dashed border-slate-500 bg-slate-900/40 text-slate-400 text-xs font-bold flex items-center gap-2 whitespace-nowrap shadow-inner">
            <Flag className="w-3.5 h-3.5 text-slate-500" />
            <span>Original Target ({baselineDate.short})</span>
          </div>
        </div>
      )}

      {/* 3. Physical Simulated Launch Line & Dynamic Milestone Pill */}
      <motion.div
        layout
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 26,
        }}
        className="absolute top-0 bottom-0 z-25 pointer-events-none flex flex-col items-center"
        style={{ left: `${simulatedLeft}px` }}
      >
        {/* Vertical Finish Line */}
        <div
          className={`w-[2px] h-full shadow-lg ${
            isDelayed
              ? 'bg-gradient-to-b from-rose-500 via-rose-500/80 to-transparent shadow-rose-500/50'
              : isEarly
              ? 'bg-gradient-to-b from-cyan-400 via-cyan-400/80 to-transparent shadow-cyan-400/50'
              : 'bg-gradient-to-b from-emerald-400 via-emerald-400/80 to-transparent shadow-emerald-400/50'
          }`}
        />

        {/* Top Header Pin on the Time Ruler */}
        <div className="absolute top-0 -translate-x-1/2">
          <div
            className={`px-2.5 py-0.5 rounded-b-md text-[10px] font-bold tracking-tight shadow-md flex items-center gap-1 whitespace-nowrap ${
              isDelayed
                ? 'bg-rose-600 text-white shadow-rose-500/30'
                : 'bg-emerald-600 text-white shadow-emerald-500/30'
            }`}
          >
            <Rocket className="w-3 h-3" />
            <span>Launch Day {simulatedLaunchDay}</span>
          </div>
        </div>

        {/* Centered Large Dynamic "Final Launch" Milestone Pill */}
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-auto">
          <motion.button
            type="button"
            onClick={handleTriggerCelebration}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`group px-5 py-3 rounded-2xl border-2 flex items-center gap-3 shadow-2xl transition-all cursor-pointer whitespace-nowrap ${
              isDelayed
                ? 'bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 border-rose-500 text-white shadow-rose-600/30 ring-2 ring-rose-500/40'
                : isEarly
                ? 'bg-gradient-to-r from-cyan-950 via-slate-900 to-cyan-950 border-cyan-400 text-white shadow-cyan-500/30 ring-2 ring-cyan-400/40'
                : 'bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-emerald-400 text-white shadow-emerald-500/30 ring-2 ring-emerald-400/40'
            }`}
          >
            {/* Pulsing Rocket / Icon Avatar */}
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-inner ${
                isDelayed
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              <Rocket className={`w-5 h-5 ${isDelayed ? 'rotate-45' : '-rotate-45 group-hover:scale-110'} transition-transform`} />
            </div>

            {/* Launch Text & Net Slip Details */}
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-wide uppercase text-slate-300">
                  Final Launch
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    isDelayed
                      ? 'bg-rose-500/30 text-rose-300'
                      : 'bg-emerald-500/30 text-emerald-300'
                  }`}
                >
                  {isDelayed ? `+${netSlip}d Slip` : 'On Target'}
                </span>
              </div>
              <div className="text-sm font-bold text-white tabular-nums">
                {simulatedDate.formatted}
              </div>
            </div>

            {/* Domino Ripple Animation Ring when bumped */}
            {isDelayed && (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
              </span>
            )}
          </motion.button>
        </div>
      </motion.div>
    </>
  );
};
