import React from 'react';
import { motion } from 'motion/react';
import { CalculatedTask, Swimlane } from '../types';
import { Minus, Plus, AlertCircle, Sparkles, User, ArrowRight } from 'lucide-react';

interface DominoBlockProps {
  task: CalculatedTask;
  swimlane: Swimlane;
  dayWidth: number;
  isSelected: boolean;
  onSelect: () => void;
  onQuickAdjustDelay: (delta: number, e: React.MouseEvent) => void;
  highlightCriticalPath: boolean;
}

export const DominoBlock: React.FC<DominoBlockProps> = ({
  task,
  swimlane,
  dayWidth,
  isSelected,
  onSelect,
  onQuickAdjustDelay,
  highlightCriticalPath,
}) => {
  const pixelLeft = task.simulatedStart * dayWidth;
  const pixelWidth = task.effectiveDuration * dayWidth;

  const baselinePixelLeft = task.baselineStart * dayWidth;
  const baselinePixelWidth = task.duration * dayWidth;

  // Did this task move or stretch from baseline?
  const hasMovedFromBaseline = 
    task.simulatedStart !== task.baselineStart || 
    task.effectiveDuration !== task.duration;

  const isCritical = highlightCriticalPath && task.isCriticalPath;
  const isDelayed = (task.delay || 0) > 0;
  const isAhead = (task.delay || 0) < 0;

  return (
    <>
      {/* 1. Ghost Outline of Original Baseline Position */}
      {hasMovedFromBaseline && (
        <div
          className="absolute top-1/2 -translate-y-1/2 h-14 rounded-xl border-2 border-dashed border-slate-600/40 bg-slate-800/10 z-5 pointer-events-none transition-all flex items-center justify-between px-2.5"
          style={{
            left: `${baselinePixelLeft}px`,
            width: `${baselinePixelWidth}px`,
          }}
          title={`Original Baseline: Day ${task.baselineStart} - ${task.baselineEnd} (${task.duration}d)`}
        >
          <div className="flex items-center gap-1.5 opacity-60">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span className="text-[10px] font-mono text-slate-400 font-medium whitespace-nowrap">
              Baseline: {task.duration}d
            </span>
          </div>
          {pixelLeft > baselinePixelLeft && (
            <div className="text-[9px] font-mono text-slate-500 flex items-center gap-0.5">
              <span>+{task.simulatedStart - task.baselineStart}d shift</span>
              <ArrowRight className="w-2.5 h-2.5" />
            </div>
          )}
        </div>
      )}

      {/* 2. Physical Simulated Domino Block */}
      <motion.div
        layout
        transition={{
          type: 'spring',
          stiffness: 340,
          damping: 28,
        }}
        onClick={onSelect}
        className={`absolute top-1/2 -translate-y-1/2 z-20 cursor-pointer select-none group`}
        style={{
          left: `${pixelLeft}px`,
          width: `${pixelWidth}px`,
          height: '62px',
        }}
      >
        <div
          className={`w-full h-full rounded-xl border p-2.5 flex flex-col justify-between relative shadow-md transition-all ${
            isSelected
              ? 'ring-2 ring-indigo-400 shadow-indigo-500/30 scale-[1.02]'
              : 'hover:shadow-lg hover:scale-[1.01]'
          } ${
            isCritical
              ? 'border-amber-400/80 bg-slate-900 shadow-amber-500/20 ring-1 ring-amber-400/50'
              : task.isPushedByDependency
              ? 'border-rose-500/60 bg-slate-900/95 shadow-rose-500/15'
              : `${swimlane.theme.border} bg-slate-900/95`
          }`}
        >
          {/* Subtle top edge specular highlight (domino physical bevel) */}
          <div className="absolute top-0 left-3 right-3 h-[1px] bg-white/20 rounded-full" />

          {/* Top Row: Task Name + Domino Delay Badges */}
          <div className="flex items-center justify-between gap-1.5 min-w-0">
            <span
              className="text-xs font-bold text-slate-100 truncate tracking-tight"
              title={task.name}
            >
              {task.name}
            </span>

            {/* Delay or Ahead Indicator */}
            {isDelayed ? (
              <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 tabular-nums">
                +{task.delay}d delay
              </span>
            ) : isAhead ? (
              <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 tabular-nums">
                {task.delay}d ahead
              </span>
            ) : null}
          </div>

          {/* Bottom Row: Duration, Assignee & Domino Bump Status */}
          <div className="flex items-center justify-between gap-1 text-[10px] text-slate-400">
            {/* Days Duration */}
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-semibold text-slate-300 tabular-nums">
                {task.effectiveDuration}d
              </span>

              {/* Pushed by Domino Predecessor Alert */}
              {task.isPushedByDependency && (
                <span className="flex items-center gap-0.5 px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold border border-amber-500/30 animate-pulse">
                  <span>Knocked +{task.pushedDays}d</span>
                </span>
              )}

              {/* Critical Path Indicator */}
              {isCritical && (
                <span className="text-[9px] font-bold text-amber-400 flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Critical</span>
                </span>
              )}
            </div>

            {/* Assignee / Quick +/- Scrub Steppers */}
            <div className="flex items-center gap-1">
              {/* Quick Stepper Buttons visible on hover */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-slate-800 rounded p-0.5 border border-slate-700">
                <button
                  type="button"
                  onClick={(e) => onQuickAdjustDelay(-1, e)}
                  title="Reduce 1 day of delay"
                  className="w-4 h-4 rounded hover:bg-slate-700 text-slate-300 flex items-center justify-center hover:text-white transition-colors cursor-pointer"
                >
                  <Minus className="w-2.5 h-2.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => onQuickAdjustDelay(1, e)}
                  title="Add 1 day delay (bumps cushion/timeline)"
                  className="w-4 h-4 rounded hover:bg-indigo-600 text-slate-300 flex items-center justify-center hover:text-white transition-colors cursor-pointer"
                >
                  <Plus className="w-2.5 h-2.5" />
                </button>
              </div>

              {/* Owner Avatar Pill */}
              <div
                className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-300 shadow-sm"
                title={`${task.owner.name} (${task.owner.role})`}
              >
                {task.owner.avatar}
              </div>
            </div>
          </div>

          {/* Domino Grip dots on the right edge */}
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-25 group-hover:opacity-75 transition-opacity pointer-events-none">
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="w-1 h-1 rounded-full bg-slate-300" />
          </div>
        </div>
      </motion.div>
    </>
  );
};
