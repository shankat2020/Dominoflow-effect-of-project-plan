import React from 'react';
import { 
  Palette, 
  Server, 
  Code2, 
  ShieldCheck, 
  Rocket, 
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';
import { Swimlane, CalculatedTask } from '../types';
import { DominoBlock } from './DominoBlock';
import { BufferCushion } from './BufferCushion';

interface SwimlaneRowProps {
  swimlane: Swimlane;
  tasks: CalculatedTask[];
  allTasks: CalculatedTask[];
  dayWidth: number;
  totalDays: number;
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
  onQuickAdjustDelay: (taskId: string, delta: number, e: React.MouseEvent) => void;
  highlightCriticalPath: boolean;
}

export const SwimlaneRow: React.FC<SwimlaneRowProps> = ({
  swimlane,
  tasks,
  allTasks,
  dayWidth,
  totalDays,
  selectedTaskId,
  onSelectTask,
  onQuickAdjustDelay,
  highlightCriticalPath,
}) => {
  const getIcon = () => {
    switch (swimlane.iconName) {
      case 'palette': return <Palette className="w-4 h-4" />;
      case 'server': return <Server className="w-4 h-4" />;
      case 'code': return <Code2 className="w-4 h-4" />;
      case 'shield-check': return <ShieldCheck className="w-4 h-4" />;
      case 'rocket': return <Rocket className="w-4 h-4" />;
      default: return <Cpu className="w-4 h-4" />;
    }
  };

  // Check track health
  const bumpedTasksInLane = tasks.filter((t) => t.isPushedByDependency);
  const criticalTasksInLane = tasks.filter((t) => t.isCriticalPath);
  const laneBufferTotal = tasks.reduce((sum, t) => sum + t.remainingBuffer, 0);

  return (
    <div className="flex border-b border-slate-800/80 hover:bg-slate-900/30 transition-colors group">
      
      {/* 1. Left Fixed Swimlane Header */}
      <div className="w-56 shrink-0 sticky left-0 z-30 bg-slate-950/95 backdrop-blur-md p-3.5 border-r border-slate-800 flex flex-col justify-between shadow-lg">
        <div className="flex items-start gap-2.5">
          <div className={`p-2 rounded-lg ${swimlane.theme.light} shrink-0`}>
            {getIcon()}
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block truncate">
              {swimlane.category}
            </span>
            <h4 className="text-xs font-bold text-slate-200 tracking-tight leading-tight truncate">
              {swimlane.name}
            </h4>
          </div>
        </div>

        {/* Track Float / Status Footnote */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-900">
          <span className="tabular-nums font-mono">
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
          </span>

          {bumpedTasksInLane.length > 0 ? (
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <span>{bumpedTasksInLane.length} bumped</span>
            </span>
          ) : laneBufferTotal > 0 ? (
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <span>{laneBufferTotal}d float safe</span>
            </span>
          ) : (
            <span className="text-slate-500 font-medium">0d float</span>
          )}
        </div>
      </div>

      {/* 2. Horizontal Timeline Track */}
      <div 
        className="relative h-24 flex items-center grow"
        style={{ minWidth: `${totalDays * dayWidth}px` }}
      >
        {/* Subtle lane midline guide */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] bg-slate-800/40 pointer-events-none" />

        {/* Render Buffer Cushions for tasks in this lane */}
        {tasks.map((task) => {
          // Identify target task name for buffer cushion tooltip
          let targetName = 'Final Launch';
          if (task.dependentTaskIds.length > 0) {
            const firstChild = allTasks.find((t) => task.dependentTaskIds.includes(t.id));
            if (firstChild) targetName = firstChild.name;
          }

          return (
            <BufferCushion
              key={`cushion-${task.id}`}
              startDay={task.simulatedEnd}
              remainingDays={task.remainingBuffer}
              baselineDays={task.baselineBuffer}
              dayWidth={dayWidth}
              sourceTaskName={task.name}
              targetName={targetName}
            />
          );
        })}

        {/* Render Domino Blocks */}
        {tasks.map((task) => (
          <DominoBlock
            key={task.id}
            task={task}
            swimlane={swimlane}
            dayWidth={dayWidth}
            isSelected={selectedTaskId === task.id}
            onSelect={() => onSelectTask(task.id)}
            onQuickAdjustDelay={(delta, e) => {
              e.stopPropagation();
              onQuickAdjustDelay(task.id, delta, e);
            }}
            highlightCriticalPath={highlightCriticalPath}
          />
        ))}
      </div>
    </div>
  );
};
