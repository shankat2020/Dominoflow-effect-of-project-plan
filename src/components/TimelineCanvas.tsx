import React, { useMemo } from 'react';
import { Swimlane, CalculatedTask, SimulationSummary } from '../types';
import { SwimlaneRow } from './SwimlaneRow';
import { FinalLaunchMilestone } from './FinalLaunchMilestone';
import { dayToDate } from '../utils/simulation';

interface TimelineCanvasProps {
  swimlanes: Swimlane[];
  tasks: CalculatedTask[];
  summary: SimulationSummary;
  dayWidth: number;
  startDate?: string;
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
  onQuickAdjustDelay: (taskId: string, delta: number, e: React.MouseEvent) => void;
  highlightCriticalPath: boolean;
}

export const TimelineCanvas: React.FC<TimelineCanvasProps> = ({
  swimlanes,
  tasks,
  summary,
  dayWidth,
  startDate = '2026-11-02',
  selectedTaskId,
  onSelectTask,
  onQuickAdjustDelay,
  highlightCriticalPath,
}) => {
  // Determine total visible timeline days (with extra cushion on the right for final launch pill and room to scrub)
  const maxEndDay = Math.max(summary.baselineLaunchDay, summary.simulatedLaunchDay);
  const totalDays = Math.max(32, maxEndDay + 8);
  const totalPixelWidth = totalDays * dayWidth;

  const rowHeight = 96; // 96px per swimlane row
  const totalHeight = swimlanes.length * rowHeight;

  // Map each swimlane ID to its row vertical center
  const laneYMap = useMemo(() => {
    const map = new Map<string, number>();
    swimlanes.forEach((lane, idx) => {
      map.set(lane.id, idx * rowHeight + rowHeight / 2);
    });
    return map;
  }, [swimlanes]);

  // Tasks map for fast lookup
  const taskMap = useMemo(() => {
    const map = new Map<string, CalculatedTask>();
    tasks.forEach((t) => map.set(t.id, t));
    return map;
  }, [tasks]);

  // Build dependency connector lines
  const dependencyLinks = useMemo(() => {
    const links: Array<{
      id: string;
      startX: number;
      startY: number;
      endX: number;
      endY: number;
      isCritical: boolean;
      isBumped: boolean;
    }> = [];

    tasks.forEach((child) => {
      const childY = laneYMap.get(child.swimlaneId) || 0;
      const childX = child.simulatedStart * dayWidth;

      child.dependsOn.forEach((parentId) => {
        const parent = taskMap.get(parentId);
        if (!parent) return;

        const parentY = laneYMap.get(parent.swimlaneId) || 0;
        const parentX = parent.simulatedEnd * dayWidth;

        const isCritical =
          highlightCriticalPath &&
          parent.isCriticalPath &&
          child.isCriticalPath;

        const isBumped = child.isPushedByDependency;

        links.push({
          id: `${parent.id}->${child.id}`,
          startX: parentX,
          startY: parentY,
          endX: childX,
          endY: childY,
          isCritical,
          isBumped,
        });
      });
    });

    return links;
  }, [tasks, laneYMap, dayWidth, taskMap, highlightCriticalPath]);

  // Days array for the ruler header
  const daysArray = useMemo(() => {
    return Array.from({ length: totalDays }, (_, i) => i);
  }, [totalDays]);

  return (
    <div className="relative overflow-x-auto overflow-y-hidden bg-slate-950 select-none pb-28">
      <div
        className="relative"
        style={{ width: `${totalPixelWidth + 224}px`, minWidth: '100%' }}
      >
        {/* 1. Time Ruler Header */}
        <div className="flex border-b border-slate-800 bg-slate-950 sticky top-0 z-35 shadow-sm">
          {/* Top Left Corner Anchor */}
          <div className="w-56 shrink-0 sticky left-0 z-40 bg-slate-950 p-2.5 border-r border-slate-800 flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Swimlane Track</span>
            <span className="text-[10px] font-mono text-slate-500">Day Scale</span>
          </div>

          {/* Timeline Days Ruler */}
          <div
            className="relative h-11 flex items-center grow"
            style={{ minWidth: `${totalPixelWidth}px` }}
          >
            {daysArray.map((day) => {
              const isEven = day % 2 === 0;
              const date = dayToDate(day, startDate);
              const isBaseline = day === summary.baselineLaunchDay;
              const isSimulated = day === summary.simulatedLaunchDay;

              return (
                <div
                  key={day}
                  className={`absolute top-0 bottom-0 border-l flex flex-col justify-between px-1 py-1 ${
                    isBaseline
                      ? 'border-slate-500/80 bg-slate-800/30'
                      : isSimulated
                      ? summary.netSlip > 0
                        ? 'border-rose-500/80 bg-rose-950/20'
                        : 'border-emerald-500/80 bg-emerald-950/20'
                      : day % 5 === 0
                      ? 'border-slate-700/80'
                      : 'border-slate-800/40'
                  }`}
                  style={{
                    left: `${day * dayWidth}px`,
                    width: `${dayWidth}px`,
                  }}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono font-semibold text-slate-400">
                    <span>{isEven || day === 0 ? `D${day}` : ''}</span>
                  </div>
                  {day % 4 === 0 && (
                    <span className="text-[9px] text-slate-500 truncate whitespace-nowrap">
                      {date.short}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Main Swimlanes Container with Vertical Grid Guidelines */}
        <div className="relative">
          {/* Vertical Grid lines running through background */}
          <div
            className="absolute top-0 bottom-0 pointer-events-none z-0"
            style={{ left: '224px', width: `${totalPixelWidth}px` }}
          >
            {daysArray.map((day) => (
              <div
                key={`grid-${day}`}
                className={`absolute top-0 bottom-0 border-l ${
                  day % 5 === 0
                    ? 'border-slate-800/80'
                    : 'border-slate-900/60'
                }`}
                style={{ left: `${day * dayWidth}px` }}
              />
            ))}
          </div>

          {/* SVG Dependency Connector Curves */}
          <svg
            className="absolute top-0 bottom-0 pointer-events-none z-10"
            style={{
              left: '224px',
              width: `${totalPixelWidth}px`,
              height: `${totalHeight}px`,
            }}
          >
            <defs>
              <marker
                id="arrow-normal"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 8 5 L 0 9 z" fill="#64748b" />
              </marker>
              <marker
                id="arrow-critical"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 8 5 L 0 9 z" fill="#f59e0b" />
              </marker>
              <marker
                id="arrow-bumped"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 8 5 L 0 9 z" fill="#ef4444" />
              </marker>
            </defs>

            {dependencyLinks.map((link) => {
              const dx = Math.abs(link.endX - link.startX);
              const controlOffset = Math.max(24, dx * 0.45);
              const path = `M ${link.startX} ${link.startY} C ${link.startX + controlOffset} ${link.startY}, ${link.endX - controlOffset} ${link.endY}, ${link.endX} ${link.endY}`;

              return (
                <path
                  key={link.id}
                  d={path}
                  fill="none"
                  stroke={
                    link.isBumped
                      ? '#ef4444'
                      : link.isCritical
                      ? '#f59e0b'
                      : '#475569'
                  }
                  strokeWidth={link.isBumped || link.isCritical ? 2.5 : 1.5}
                  strokeDasharray={link.isBumped ? '4 3' : 'none'}
                  opacity={link.isBumped || link.isCritical ? 0.9 : 0.4}
                  markerEnd={
                    link.isBumped
                      ? 'url(#arrow-bumped)'
                      : link.isCritical
                      ? 'url(#arrow-critical)'
                      : 'url(#arrow-normal)'
                  }
                  className="transition-all duration-300"
                />
              );
            })}
          </svg>

          {/* Swimlane Rows */}
          <div className="relative z-10">
            {swimlanes.map((lane) => {
              const laneTasks = tasks.filter((t) => t.swimlaneId === lane.id);
              return (
                <SwimlaneRow
                  key={lane.id}
                  swimlane={lane}
                  tasks={laneTasks}
                  allTasks={tasks}
                  dayWidth={dayWidth}
                  totalDays={totalDays}
                  selectedTaskId={selectedTaskId}
                  onSelectTask={onSelectTask}
                  onQuickAdjustDelay={onQuickAdjustDelay}
                  highlightCriticalPath={highlightCriticalPath}
                />
              );
            })}
          </div>

          {/* Final Launch Milestone on the far right of the timeline */}
          <div
            className="absolute top-0 bottom-0 pointer-events-none"
            style={{ left: '224px', width: `${totalPixelWidth}px` }}
          >
            <FinalLaunchMilestone
              baselineLaunchDay={summary.baselineLaunchDay}
              simulatedLaunchDay={summary.simulatedLaunchDay}
              dayWidth={dayWidth}
              totalHeight={totalHeight}
              netSlip={summary.netSlip}
              startDate={startDate}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
