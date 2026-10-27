import { Task, CalculatedTask, SimulationSummary } from '../types';

export function calculateSimulation(tasks: Task[]): {
  tasks: CalculatedTask[];
  summary: SimulationSummary;
} {
  if (tasks.length === 0) {
    return {
      tasks: [],
      summary: {
        baselineLaunchDay: 0,
        simulatedLaunchDay: 0,
        netSlip: 0,
        criticalPathIds: [],
        totalBaselineBuffer: 0,
        totalRemainingBuffer: 0,
        isDelayed: false,
        bumpedTaskCount: 0,
      },
    };
  }

  // Build dependency mappings
  const taskMap = new Map<string, Task>();
  const childrenMap = new Map<string, string[]>();

  tasks.forEach((t) => {
    taskMap.set(t.id, t);
    childrenMap.set(t.id, []);
  });

  tasks.forEach((t) => {
    t.dependsOn.forEach((parentId) => {
      if (childrenMap.has(parentId)) {
        childrenMap.get(parentId)!.push(t.id);
      }
    });
  });

  // Topological sorting (Kahn's algorithm)
  const inDegree = new Map<string, number>();
  tasks.forEach((t) => {
    inDegree.set(t.id, 0);
  });
  tasks.forEach((t) => {
    t.dependsOn.forEach((parentId) => {
      if (taskMap.has(parentId)) {
        inDegree.set(t.id, (inDegree.get(t.id) || 0) + 1);
      }
    });
  });

  const queue: string[] = [];
  inDegree.forEach((deg, id) => {
    if (deg === 0) queue.push(id);
  });

  const topoOrder: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    topoOrder.push(id);
    const children = childrenMap.get(id) || [];
    for (const childId of children) {
      const curDeg = inDegree.get(childId)! - 1;
      inDegree.set(childId, curDeg);
      if (curDeg === 0) {
        queue.push(childId);
      }
    }
  }

  // If cycle detected, fallback to original order
  const finalOrder = topoOrder.length === tasks.length ? topoOrder : tasks.map((t) => t.id);

  // 1. Calculate Baseline (without any delays)
  const baselineStartMap = new Map<string, number>();
  const baselineEndMap = new Map<string, number>();

  for (const id of finalOrder) {
    const t = taskMap.get(id)!;
    let maxParentEnd = 0;
    for (const parentId of t.dependsOn) {
      const pEnd = baselineEndMap.get(parentId);
      if (pEnd !== undefined && pEnd > maxParentEnd) {
        maxParentEnd = pEnd;
      }
    }
    baselineStartMap.set(id, maxParentEnd);
    baselineEndMap.set(id, maxParentEnd + Math.max(1, t.duration));
  }

  let baselineLaunchDay = 0;
  baselineEndMap.forEach((end) => {
    if (end > baselineLaunchDay) baselineLaunchDay = end;
  });

  // 2. Calculate Simulated Schedule (with user delays)
  const simulatedStartMap = new Map<string, number>();
  const simulatedEndMap = new Map<string, number>();
  const effectiveDurationMap = new Map<string, number>();

  for (const id of finalOrder) {
    const t = taskMap.get(id)!;
    let maxParentEnd = 0;
    for (const parentId of t.dependsOn) {
      const pEnd = simulatedEndMap.get(parentId);
      if (pEnd !== undefined && pEnd > maxParentEnd) {
        maxParentEnd = pEnd;
      }
    }
    const effectiveDur = Math.max(1, t.duration + (t.delay || 0));
    effectiveDurationMap.set(id, effectiveDur);
    simulatedStartMap.set(id, maxParentEnd);
    simulatedEndMap.set(id, maxParentEnd + effectiveDur);
  }

  let rawSimulatedLaunchDay = 0;
  simulatedEndMap.forEach((end) => {
    if (end > rawSimulatedLaunchDay) rawSimulatedLaunchDay = end;
  });

  // Final launch date is at least the baseline target date
  const simulatedLaunchDay = rawSimulatedLaunchDay;
  const netSlip = simulatedLaunchDay - baselineLaunchDay;

  // 3. Backward Pass for Float / Critical Path (CPM)
  const latestFinishMap = new Map<string, number>();
  const latestStartMap = new Map<string, number>();

  for (let i = finalOrder.length - 1; i >= 0; i--) {
    const id = finalOrder[i];
    const children = childrenMap.get(id) || [];
    let minChildStart = simulatedLaunchDay;

    for (const childId of children) {
      const cStart = latestStartMap.get(childId);
      if (cStart !== undefined && cStart < minChildStart) {
        minChildStart = cStart;
      }
    }

    latestFinishMap.set(id, minChildStart);
    const effDur = effectiveDurationMap.get(id)!;
    latestStartMap.set(id, minChildStart - effDur);
  }

  const criticalPathIds: string[] = [];
  finalOrder.forEach((id) => {
    const totalFloat = (latestStartMap.get(id) ?? 0) - (simulatedStartMap.get(id) ?? 0);
    if (totalFloat <= 0.001) {
      criticalPathIds.push(id);
    }
  });

  // 4. Calculate Buffer / Cushion per task
  // Free Float: remaining days before this specific task directly pushes its downstream dependents or the launch line
  let totalBaselineBuffer = 0;
  let totalRemainingBuffer = 0;
  let bumpedTaskCount = 0;

  const calculatedTasks: CalculatedTask[] = tasks.map((t) => {
    const bStart = baselineStartMap.get(t.id) ?? 0;
    const bEnd = baselineEndMap.get(t.id) ?? t.duration;
    const sStart = simulatedStartMap.get(t.id) ?? 0;
    const sEnd = simulatedEndMap.get(t.id) ?? (t.duration + (t.delay || 0));
    const children = childrenMap.get(t.id) || [];

    // Baseline buffer before next dependent or milestone
    let baselineNextStart = baselineLaunchDay;
    if (children.length > 0) {
      baselineNextStart = Math.min(...children.map((cId) => baselineStartMap.get(cId) ?? baselineLaunchDay));
    }
    const baselineBuffer = Math.max(0, baselineNextStart - bEnd);
    totalBaselineBuffer += baselineBuffer;

    // Simulated remaining buffer
    let simulatedNextStart = simulatedLaunchDay;
    if (children.length > 0) {
      simulatedNextStart = Math.min(...children.map((cId) => simulatedStartMap.get(cId) ?? simulatedLaunchDay));
    }
    const remainingBuffer = Math.max(0, simulatedNextStart - sEnd);
    totalRemainingBuffer += remainingBuffer;

    const pushedDays = Math.max(0, sStart - bStart);
    const isPushedByDependency = pushedDays > 0;
    if (isPushedByDependency) {
      bumpedTaskCount++;
    }

    const isBufferExhausted = remainingBuffer === 0 && baselineBuffer > 0;
    const isCritical = criticalPathIds.includes(t.id);

    return {
      ...t,
      baselineStart: bStart,
      baselineEnd: bEnd,
      baselineBuffer,
      simulatedStart: sStart,
      simulatedEnd: sEnd,
      effectiveDuration: effectiveDurationMap.get(t.id) ?? t.duration,
      isPushedByDependency,
      pushedDays,
      remainingBuffer,
      isBufferExhausted,
      isCriticalPath: isCritical,
      dependentTaskIds: children,
    };
  });

  return {
    tasks: calculatedTasks,
    summary: {
      baselineLaunchDay,
      simulatedLaunchDay,
      netSlip,
      criticalPathIds,
      totalBaselineBuffer,
      totalRemainingBuffer,
      isDelayed: netSlip > 0,
      bumpedTaskCount,
    },
  };
}

// Convert day index to formatted calendar date (e.g. Day 0 = Nov 1, 2026)
export function dayToDate(dayIndex: number, startDateStr: string = '2026-11-02'): {
  formatted: string;
  short: string;
  weekday: string;
} {
  const base = new Date(startDateStr);
  const target = new Date(base.getTime() + dayIndex * 24 * 60 * 60 * 1000);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return {
    formatted: `${months[target.getMonth()]} ${target.getDate()}, ${target.getFullYear()}`,
    short: `${months[target.getMonth()]} ${target.getDate()}`,
    weekday: days[target.getDay()],
  };
}
