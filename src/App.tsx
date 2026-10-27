import React, { useState, useMemo, useCallback } from 'react';
import { 
  INITIAL_SWIMLANES, 
  INITIAL_TASKS, 
  SCENARIO_PRESETS, 
  ScenarioPreset 
} from './data/initialData';
import { Task, Swimlane } from './types';
import { calculateSimulation } from './utils/simulation';
import { ParsedProjectPlan } from './utils/charterParser';
import { TopMetricsBar } from './components/TopMetricsBar';
import { TimelineCanvas } from './components/TimelineCanvas';
import { TaskDelayDrawer } from './components/TaskDelayDrawer';
import { AddTaskModal } from './components/AddTaskModal';
import { UploadCharterModal } from './components/UploadCharterModal';
import { 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  Zap, 
  RefreshCw,
  FolderKanban,
  Upload,
  Calendar
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [projectName, setProjectName] = useState('Product Launch MVP');
  const [projectDescription, setProjectDescription] = useState('Interactive DominoFlow timeline with 5 parallel workstreams');
  const [startDate, setStartDate] = useState('2026-11-02');
  const [swimlanes, setSwimlanes] = useState<Swimlane[]>(INITIAL_SWIMLANES);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>('baseline');
  const [highlightCriticalPath, setHighlightCriticalPath] = useState(true);
  const [dayWidth, setDayWidth] = useState(32); // default comfortable 32px per day
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isUploadCharterOpen, setIsUploadCharterOpen] = useState(false);
  const [showPrimer, setShowPrimer] = useState(false);

  // Compute live simulation state
  const { tasks: calculatedTasks, summary } = useMemo(() => {
    return calculateSimulation(tasks);
  }, [tasks]);

  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return calculatedTasks.find((t) => t.id === selectedTaskId) || null;
  }, [calculatedTasks, selectedTaskId]);

  // Handle delay scrub update
  const handleUpdateDelay = useCallback((taskId: string, newDelay: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, delay: newDelay } : t))
    );
    setActiveScenarioId(null); // customized
  }, []);

  // Quick inline +/- adjust
  const handleQuickAdjustDelay = useCallback((taskId: string, delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updated = Math.max(-2, Math.min(16, (t.delay || 0) + delta));
          return { ...t, delay: updated };
        }
        return t;
      })
    );
    setActiveScenarioId(null);
  }, []);

  // Reset all scrubbed delays to 0
  const handleResetDelays = useCallback(() => {
    setTasks((prev) => prev.map((t) => ({ ...t, delay: 0 })));
    setActiveScenarioId('baseline');
    confetti({
      particleCount: 50,
      spread: 50,
      origin: { y: 0.3 },
      colors: ['#10b981', '#6366f1'],
    });
  }, []);

  // Select scenario preset
  const handleSelectScenario = useCallback((scenario: ScenarioPreset) => {
    setActiveScenarioId(scenario.id);
    setTasks((prev) =>
      prev.map((t) => {
        const presetDelay = scenario.delays[t.id];
        return {
          ...t,
          delay: presetDelay !== undefined ? presetDelay : 0,
        };
      })
    );
  }, []);

  // Update task metadata
  const handleUpdateTask = useCallback((updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
  }, []);

  // Delete task
  const handleDeleteTask = useCallback((taskId: string) => {
    setTasks((prev) => {
      // Remove task and clean up dependencies from others
      return prev
        .filter((t) => t.id !== taskId)
        .map((t) => ({
          ...t,
          dependsOn: t.dependsOn.filter((id) => id !== taskId),
        }));
    });
    if (selectedTaskId === taskId) {
      setSelectedTaskId(null);
    }
  }, [selectedTaskId]);

  // Add new task
  const handleAddTask = useCallback((newTaskData: Omit<Task, 'id'>) => {
    const newId = `task-${Date.now()}`;
    const newTask: Task = {
      ...newTaskData,
      id: newId,
    };
    setTasks((prev) => [...prev, newTask]);
    setSelectedTaskId(newId);
  }, []);

  // Load newly uploaded/parsed project charter
  const handleLoadProject = useCallback((project: ParsedProjectPlan) => {
    setProjectName(project.projectName);
    setProjectDescription(project.description);
    if (project.startDate) setStartDate(project.startDate);
    setSwimlanes(project.swimlanes);
    setTasks(project.tasks);
    setSelectedTaskId(null);
    setActiveScenarioId('baseline');

    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.4 },
      colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899'],
    });
  }, []);

  // Export current project timeline as JSON
  const handleExportPlan = useCallback(() => {
    const projectExport = {
      projectName,
      description: projectDescription,
      startDate,
      swimlanes: swimlanes.map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        iconName: s.iconName,
      })),
      tasks: tasks.map((t) => ({
        id: t.id,
        name: t.name,
        swimlaneId: t.swimlaneId,
        duration: t.duration,
        delay: t.delay || 0,
        dependsOn: t.dependsOn,
        owner: t.owner,
        description: t.description || '',
      })),
    };

    const blob = new Blob([JSON.stringify(projectExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}-charter.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [projectName, projectDescription, startDate, swimlanes, tasks]);

  // Restore factory sample plan
  const handleRestoreInitialPlan = useCallback(() => {
    setProjectName('Product Launch MVP');
    setProjectDescription('Interactive DominoFlow timeline with 5 parallel workstreams');
    setStartDate('2026-11-02');
    setSwimlanes(INITIAL_SWIMLANES);
    setTasks(INITIAL_TASKS);
    setActiveScenarioId('baseline');
    setSelectedTaskId(null);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* 1. Persistent Top Metrics Bar */}
      <TopMetricsBar
        projectName={projectName}
        startDate={startDate}
        summary={summary}
        onResetDelays={handleResetDelays}
        onSelectScenario={handleSelectScenario}
        activeScenarioId={activeScenarioId}
        onOpenAddTask={() => setIsAddTaskOpen(true)}
        onOpenUploadCharter={() => setIsUploadCharterOpen(true)}
        onExportPlan={handleExportPlan}
        highlightCriticalPath={highlightCriticalPath}
        onToggleCriticalPath={() => setHighlightCriticalPath(!highlightCriticalPath)}
        dayWidth={dayWidth}
        onChangeDayWidth={setDayWidth}
      />

      {/* 2. Interactive Guide / Dynamic Project Plan Banner */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 sm:px-6 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex items-center gap-1.5 font-bold text-indigo-400 shrink-0">
              <Zap className="w-3.5 h-3.5" />
              <span>Domino Timeline:</span>
            </span>
            <span className="text-slate-300 truncate">
              {projectDescription}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsUploadCharterOpen(true)}
              className="text-xs font-semibold text-indigo-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Upload className="w-3 h-3 text-indigo-400" />
              <span>Upload Charter / Plan</span>
            </button>
            <span className="text-slate-700">|</span>
            <button
              onClick={() => setShowPrimer(!showPrimer)}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-xs font-medium cursor-pointer"
            >
              <span>{showPrimer ? 'Hide Guide' : 'Explain Concepts'}</span>
              {showPrimer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Collapsible Primer Cards */}
        {showPrimer && (
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 pb-1">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>1. Soft Buffer Cushions</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Striped cushions show available float/slack. Delays within this buffer are fully absorbed without shifting downstream tasks or the final launch date.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                <span className="text-sm">💥</span>
                <span>2. Domino Knock Reaction</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Once a track&apos;s buffer hits 0, added delays physically bump subsequent tasks to the right. Any delay on the Critical Path immediately impacts the Final Launch date.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <span className="text-sm">👻</span>
                <span>3. Ghost Baseline Markers</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Faint, dashed ghost outlines stay fixed at original baseline positions, allowing you to instantly compare the original plan versus the simulated outcome.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. Main Timeline Workspace */}
      <main className="grow flex flex-col relative">
        <TimelineCanvas
          swimlanes={swimlanes}
          tasks={calculatedTasks}
          summary={summary}
          dayWidth={dayWidth}
          startDate={startDate}
          selectedTaskId={selectedTaskId}
          onSelectTask={(id) => setSelectedTaskId(id)}
          onQuickAdjustDelay={handleQuickAdjustDelay}
          highlightCriticalPath={highlightCriticalPath}
        />
      </main>

      {/* 4. Active Task Delay Scrub Drawer */}
      <TaskDelayDrawer
        task={selectedTask}
        allTasks={calculatedTasks}
        swimlanes={swimlanes}
        onClose={() => setSelectedTaskId(null)}
        onUpdateDelay={handleUpdateDelay}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
      />

      {/* 5. Add Task Modal */}
      <AddTaskModal
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        onAddTask={handleAddTask}
        swimlanes={swimlanes}
        existingTasks={tasks}
      />

      {/* 6. Upload Project Plan or Charter Modal */}
      <UploadCharterModal
        isOpen={isUploadCharterOpen}
        onClose={() => setIsUploadCharterOpen(false)}
        onLoadProject={handleLoadProject}
      />

      {/* 7. Discreet Footer with Restore & Stats */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-4 sm:px-6 py-2.5 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Kickoff: {startDate}</span>
          </span>
          <span>·</span>
          <span>{tasks.length} tasks modeled across {swimlanes.length} horizontal swimlanes</span>
          <span>·</span>
          <span>Baseline Launch: Day {summary.baselineLaunchDay}</span>
          <span>·</span>
          <span className="text-slate-400">
            Current Status: {summary.netSlip === 0 ? 'On Time' : summary.netSlip > 0 ? `+${summary.netSlip}d Slip` : `${summary.netSlip}d Early`}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsUploadCharterOpen(true)}
            className="text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Upload className="w-3 h-3" />
            <span>Upload New Charter</span>
          </button>
          <span>·</span>
          <button
            onClick={handleRestoreInitialPlan}
            className="text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
            title="Reset tasks to initial 7-task product launch plan"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Restore Default Plan</span>
          </button>
        </div>
      </footer>

    </div>
  );
}
