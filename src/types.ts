export interface Swimlane {
  id: string;
  name: string;
  category: string;
  theme: {
    bg: string;
    border: string;
    accent: string;
    light: string;
    text: string;
    badge: string;
    ring: string;
  };
  iconName: 'palette' | 'server' | 'shield-check' | 'rocket' | 'code' | 'cpu';
}

export interface Task {
  id: string;
  name: string;
  swimlaneId: string;
  duration: number; // in days
  delay: number; // in days (positive = delayed, negative = finished early)
  dependsOn: string[]; // IDs of tasks that must finish before this can start
  owner: {
    name: string;
    role: string;
    avatar: string;
  };
  description?: string;
}

export interface CalculatedTask extends Task {
  // Baseline schedule (no delays)
  baselineStart: number;
  baselineEnd: number;
  baselineBuffer: number; // float to next dependent or launch

  // Simulated schedule (with delays)
  simulatedStart: number;
  simulatedEnd: number;
  effectiveDuration: number;
  
  // Domino physics state
  isPushedByDependency: boolean;
  pushedDays: number;
  remainingBuffer: number;
  isBufferExhausted: boolean;
  isCriticalPath: boolean;
  dependentTaskIds: string[];
}

export interface SimulationSummary {
  baselineLaunchDay: number;
  simulatedLaunchDay: number;
  netSlip: number; // simulatedLaunchDay - baselineLaunchDay
  criticalPathIds: string[];
  totalBaselineBuffer: number;
  totalRemainingBuffer: number;
  isDelayed: boolean;
  bumpedTaskCount: number;
}
