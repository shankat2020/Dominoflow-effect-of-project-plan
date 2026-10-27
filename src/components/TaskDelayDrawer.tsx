import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Minus, 
  Plus, 
  RotateCcw, 
  Trash2, 
  ShieldCheck, 
  ShieldAlert, 
  Sparkles, 
  GitCommit, 
  ArrowRight,
  Check,
  Edit2
} from 'lucide-react';
import { CalculatedTask, Swimlane, Task } from '../types';

interface TaskDelayDrawerProps {
  task: CalculatedTask | null;
  allTasks: CalculatedTask[];
  swimlanes: Swimlane[];
  onClose: () => void;
  onUpdateDelay: (taskId: string, newDelay: number) => void;
  onUpdateTask: (updatedTask: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export const TaskDelayDrawer: React.FC<TaskDelayDrawerProps> = ({
  task,
  allTasks,
  swimlanes,
  onClose,
  onUpdateDelay,
  onUpdateTask,
  onDeleteTask,
}) => {
  if (!task) return null;

  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editedName, setEditedName] = useState(task.name);
  const [editedDuration, setEditedDuration] = useState(task.duration);
  const [editedLane, setEditedLane] = useState(task.swimlaneId);
  const [editedDependsOn, setEditedDependsOn] = useState<string[]>(task.dependsOn);

  // Sync state when task changes
  React.useEffect(() => {
    setEditedName(task.name);
    setEditedDuration(task.duration);
    setEditedLane(task.swimlaneId);
    setEditedDependsOn(task.dependsOn);
    setIsEditingDetails(false);
  }, [task.id]);

  const currentLane = swimlanes.find((l) => l.id === task.swimlaneId) || swimlanes[0];

  const handleSaveDetails = () => {
    onUpdateTask({
      ...task,
      name: editedName.trim() || task.name,
      duration: Math.max(1, editedDuration),
      swimlaneId: editedLane,
      dependsOn: editedDependsOn,
    });
    setIsEditingDetails(false);
  };

  const toggleDependency = (depId: string) => {
    if (editedDependsOn.includes(depId)) {
      setEditedDependsOn(editedDependsOn.filter((id) => id !== depId));
    } else {
      setEditedDependsOn([...editedDependsOn, depId]);
    }
  };

  // Buffer math analysis
  const delay = task.delay || 0;
  const isBufferCushioned = delay > 0 && delay <= task.baselineBuffer;
  const isKnockedDownstream = delay > task.baselineBuffer;
  const downstreamImpact = Math.max(0, delay - task.baselineBuffer);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none flex justify-center pb-4 px-4">
      <motion.div
        initial={{ y: 150, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 150, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className="w-full max-w-4xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/80 pointer-events-auto p-5 text-slate-200"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <span
              className={`w-3 h-3 rounded-full ${currentLane.theme.accent}`}
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {task.name}
                </h3>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {currentLane.name}
                </span>
                {task.isCriticalPath && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Critical Path</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulated Days {task.simulatedStart}–{task.simulatedEnd} (Baseline: Days {task.baselineStart}–{task.baselineEnd})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditingDetails(!isEditingDetails)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Edit2 className="w-3 h-3" />
              <span>{isEditingDetails ? 'Cancel Edit' : 'Edit Task'}</span>
            </button>
            <button
              onClick={() => onDeleteTask(task.id)}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Edit Task Form Accordion (if open) */}
        {isEditingDetails && (
          <div className="p-3 mb-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">
                  Task Name
                </label>
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">
                  Baseline Duration (days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="40"
                  value={editedDuration}
                  onChange={(e) => setEditedDuration(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">
                  Swimlane Track
                </label>
                <select
                  value={editedLane}
                  onChange={(e) => setEditedLane(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {swimlanes.map((lane) => (
                    <option key={lane.id} value={lane.id}>
                      {lane.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Prerequisites */}
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">
                Prerequisites (Must finish before this task starts)
              </label>
              <div className="flex flex-wrap gap-2">
                {allTasks
                  .filter((t) => t.id !== task.id)
                  .map((t) => {
                    const isChecked = editedDependsOn.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleDependency(t.id)}
                        className={`px-2.5 py-1 rounded text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer ${
                          isChecked
                            ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded flex items-center justify-center text-[10px] ${isChecked ? 'bg-indigo-500 text-white' : 'border border-slate-600'}`}>
                          {isChecked && <Check className="w-2.5 h-2.5" />}
                        </span>
                        <span>{t.name}</span>
                      </button>
                    );
                  })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleSaveDetails}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow cursor-pointer transition-colors"
              >
                Save Details
              </button>
            </div>
          </div>
        )}

        {/* Main Delay Scrubbing Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          
          {/* Left: Interactive Scrub Slider */}
          <div className="md:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <span>Task Delay Scrub Slider</span>
              </span>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateDelay(task.id, 0)}
                  disabled={delay === 0}
                  className="px-2 py-0.5 text-xs text-slate-400 hover:text-slate-200 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear Delay</span>
                </button>
                <span className={`text-base font-black px-2.5 py-0.5 rounded-lg tabular-nums border ${
                  delay > 0
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : delay < 0
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}>
                  {delay > 0 ? `+${delay} Days Delay` : delay < 0 ? `${delay} Days Ahead` : '0 Days (On Baseline)'}
                </span>
              </div>
            </div>

            {/* Slider track with step markings */}
            <div className="relative pt-1">
              <input
                type="range"
                min="-2"
                max="14"
                step="1"
                value={delay}
                onChange={(e) => onUpdateDelay(task.id, parseInt(e.target.value) || 0)}
                className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-ew-resize accent-indigo-500 focus:outline-none"
              />
              
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>-2d</span>
                <span>0d (Baseline)</span>
                <span>+4d</span>
                <span>+8d</span>
                <span>+12d</span>
                <span>+14d</span>
              </div>
            </div>

            {/* Quick-Preset Stepper Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] text-slate-400 mr-1">Quick:</span>
              {[-2, -1, 0, 1, 2, 3, 5, 7, 10].map((step) => {
                const isSelected = delay === step;
                return (
                  <button
                    key={step}
                    type="button"
                    onClick={() => onUpdateDelay(task.id, step)}
                    className={`px-2 py-1 text-xs font-semibold rounded-md tabular-nums transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow ring-1 ring-indigo-400'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {step > 0 ? `+${step}d` : step === 0 ? '0' : `${step}d`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Real-time Domino Cushion & Downstream Impact Breakdown */}
          <div className="md:col-span-5 bg-slate-950/80 rounded-xl p-3.5 border border-slate-800 space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Domino Buffer Mechanics
            </div>

            {/* Float Cushion Diagnostic Card */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Initial Available Buffer:</span>
                <span className="font-semibold text-slate-200 tabular-nums">
                  {task.baselineBuffer} days
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Remaining Safe Float:</span>
                <span className={`font-bold tabular-nums ${task.remainingBuffer > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {task.remainingBuffer} days
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Downstream Domino Bump:</span>
                <span className={`font-bold tabular-nums ${downstreamImpact > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {downstreamImpact > 0 ? `+${downstreamImpact} days pushed` : '0 days (absorbed)'}
                </span>
              </div>
            </div>

            {/* Dynamic Status Explainer */}
            <div className={`p-2.5 rounded-lg border text-xs leading-relaxed ${
              downstreamImpact > 0
                ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                : delay > 0
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : 'bg-slate-900 border-slate-800 text-slate-300'
            }`}>
              {downstreamImpact > 0 ? (
                <div className="flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Cushion depleted!</strong> This task delay exceeded the {task.baselineBuffer}d buffer by <strong>{downstreamImpact} days</strong>, knocking downstream tasks rightward toward the launch date!
                  </div>
                </div>
              ) : delay > 0 ? (
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Buffer is absorbing the delay!</strong> You added +{delay}d, but the track cushion has {task.remainingBuffer}d remaining. Downstream tasks have NOT moved!
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-slate-400">
                  <GitCommit className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    Task is running on baseline schedule. Scrub the slider to test how much delay this track can safely withstand.
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
};
