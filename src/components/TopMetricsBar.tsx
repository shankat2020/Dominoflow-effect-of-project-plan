import React from 'react';
import { 
  Calendar, 
  RotateCcw, 
  Plus, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Zap,
  Sliders,
  Layers,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { SimulationSummary } from '../types';
import { SCENARIO_PRESETS, ScenarioPreset } from '../data/initialData';
import { dayToDate } from '../utils/simulation';
import { motion, AnimatePresence } from 'motion/react';

interface TopMetricsBarProps {
  projectName: string;
  startDate: string;
  summary: SimulationSummary;
  onResetDelays: () => void;
  onSelectScenario: (scenario: ScenarioPreset) => void;
  activeScenarioId: string | null;
  onOpenAddTask: () => void;
  onOpenUploadCharter: () => void;
  onExportPlan: () => void;
  highlightCriticalPath: boolean;
  onToggleCriticalPath: () => void;
  dayWidth: number;
  onChangeDayWidth: (width: number) => void;
}

export const TopMetricsBar: React.FC<TopMetricsBarProps> = ({
  projectName,
  startDate,
  summary,
  onResetDelays,
  onSelectScenario,
  activeScenarioId,
  onOpenAddTask,
  onOpenUploadCharter,
  onExportPlan,
  highlightCriticalPath,
  onToggleCriticalPath,
  dayWidth,
  onChangeDayWidth,
}) => {
  const originalDate = dayToDate(summary.baselineLaunchDay, startDate);
  const simulatedDate = dayToDate(summary.simulatedLaunchDay, startDate);

  const isDelayed = summary.netSlip > 0;
  const isEarly = summary.netSlip < 0;
  const isSafe = summary.netSlip === 0;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 shadow-xl">
      {/* Top Banner & Title Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        
        {/* Brand & Active Project Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-black text-lg shrink-0">
            <span>⚅</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                DominoFlow
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 truncate max-w-[200px]" title={projectName}>
                {projectName}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Visualizing buffer cushions, delay bumps &amp; launch impact
            </p>
          </div>
        </div>

        {/* Dynamic Key Metric Pill & Dates Island */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Baseline Launch Anchor */}
          <div className="px-3.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-left flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-slate-400" />
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Original Target</div>
              <div className="text-xs font-semibold text-slate-200 tabular-nums">
                {originalDate.formatted} <span className="text-slate-500 font-normal">(Day {summary.baselineLaunchDay})</span>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="text-slate-600 font-mono text-sm hidden sm:block">➔</div>

          {/* Simulated Launch Anchor */}
          <div className={`px-3.5 py-1.5 rounded-lg border text-left flex items-center gap-2.5 transition-colors ${
            isDelayed 
              ? 'bg-rose-950/40 border-rose-500/40 text-rose-200' 
              : isEarly
              ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200'
              : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
          }`}>
            <Calendar className={`w-3.5 h-3.5 ${
              isDelayed ? 'text-rose-400' : isEarly ? 'text-cyan-400' : 'text-emerald-400'
            }`} />
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Simulated Launch</div>
              <div className="text-xs font-bold tabular-nums">
                {simulatedDate.formatted} <span className="text-slate-400 font-normal">(Day {summary.simulatedLaunchDay})</span>
              </div>
            </div>
          </div>

          {/* Large Dynamic Net Slip Pill */}
          <motion.div
            key={summary.netSlip}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`px-4 py-2 rounded-full flex items-center gap-2 font-bold text-sm shadow-lg transition-all ${
              isDelayed
                ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-rose-600/30 ring-2 ring-rose-400/50'
                : isEarly
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-cyan-600/30 ring-2 ring-cyan-400/50'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-600/25 ring-2 ring-emerald-400/50'
            }`}
          >
            {isDelayed ? (
              <>
                <AlertTriangle className="w-4 h-4 animate-bounce text-amber-200" />
                <span className="tabular-nums">+{summary.netSlip} {summary.netSlip === 1 ? 'Day' : 'Days'} Delayed</span>
              </>
            ) : isEarly ? (
              <>
                <Zap className="w-4 h-4 text-cyan-200" />
                <span className="tabular-nums">{summary.netSlip} Days Ahead!</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>+0 Days Safe</span>
              </>
            )}
          </motion.div>
        </div>

        {/* Actions & Primary Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Import Project Charter / Plan */}
          <button
            onClick={onOpenUploadCharter}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/25 rounded-lg transition-all active:scale-95 cursor-pointer"
            title="Upload or paste a Project Charter / Plan to dynamically define the timeline"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Import Charter</span>
          </button>

          {/* Export Plan */}
          <button
            onClick={onExportPlan}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-all cursor-pointer"
            title="Export timeline plan as JSON"
          >
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Reset Delays Button */}
          <button
            onClick={onResetDelays}
            title="Reset all scrubbed delays back to baseline"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-all active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400 group-hover:rotate-180 transition-transform" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Add Task Button */}
          <button
            onClick={onOpenAddTask}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Sub-bar: Simulation Presets, Critical Path, and Buffer Float Health */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 border-t border-slate-900 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Preset Scenarios */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            Simulation Presets:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {SCENARIO_PRESETS.map((scenario) => {
              const isActive = activeScenarioId === scenario.id;
              return (
                <button
                  key={scenario.id}
                  onClick={() => onSelectScenario(scenario)}
                  title={scenario.description}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                      : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  {scenario.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* View Options & Buffer Summary */}
        <div className="flex items-center gap-3">
          {/* Critical Path Toggle */}
          <button
            onClick={onToggleCriticalPath}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer border ${
              highlightCriticalPath
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Highlight Critical Path ({summary.criticalPathIds.length})</span>
          </button>

          {/* Buffer Health Indicator */}
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900/80 border border-slate-800 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="tabular-nums">
              Remaining Cushion Float: <strong className="text-emerald-300 font-semibold">{summary.totalRemainingBuffer} days</strong>
            </span>
          </div>

          {/* Zoom / Day Width Controller */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-md p-0.5">
            <button
              onClick={() => onChangeDayWidth(Math.max(22, dayWidth - 4))}
              disabled={dayWidth <= 22}
              title="Zoom out timeline"
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 disabled:opacity-40 cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] text-slate-400 px-1 font-mono">{dayWidth}px/d</span>
            <button
              onClick={() => onChangeDayWidth(Math.min(50, dayWidth + 4))}
              disabled={dayWidth >= 50}
              title="Zoom in timeline"
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 disabled:opacity-40 cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
