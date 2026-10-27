import { Swimlane, Task } from '../types';

export interface ParsedProjectPlan {
  id: string;
  projectName: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  swimlanes: Swimlane[];
  tasks: Task[];
}

// Preset color themes for auto-generated or parsed swimlanes
const SWIMLANE_THEMES = [
  {
    bg: 'bg-violet-950/25',
    border: 'border-violet-500/30',
    accent: 'bg-violet-500',
    light: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    text: 'text-violet-400',
    badge: 'bg-violet-500/20 text-violet-200 border-violet-500/40',
    ring: 'focus:ring-violet-400',
  },
  {
    bg: 'bg-sky-950/25',
    border: 'border-sky-500/30',
    accent: 'bg-sky-500',
    light: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    text: 'text-sky-400',
    badge: 'bg-sky-500/20 text-sky-200 border-sky-500/40',
    ring: 'focus:ring-sky-400',
  },
  {
    bg: 'bg-emerald-950/25',
    border: 'border-emerald-500/30',
    accent: 'bg-emerald-500',
    light: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    text: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40',
    ring: 'focus:ring-emerald-400',
  },
  {
    bg: 'bg-amber-950/25',
    border: 'border-amber-500/30',
    accent: 'bg-amber-500',
    light: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    text: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-200 border-amber-500/40',
    ring: 'focus:ring-amber-400',
  },
  {
    bg: 'bg-rose-950/25',
    border: 'border-rose-500/30',
    accent: 'bg-rose-500',
    light: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    text: 'text-rose-400',
    badge: 'bg-rose-500/20 text-rose-200 border-rose-500/40',
    ring: 'focus:ring-rose-400',
  },
];

const ICONS_POOL: Array<Swimlane['iconName']> = [
  'palette',
  'server',
  'code',
  'shield-check',
  'rocket',
  'cpu',
];

export function buildSwimlane(
  id: string,
  name: string,
  category: string,
  index: number,
  iconName?: Swimlane['iconName']
): Swimlane {
  const theme = SWIMLANE_THEMES[index % SWIMLANE_THEMES.length];
  const icon = iconName || ICONS_POOL[index % ICONS_POOL.length];
  return {
    id: id.toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
    name: name.trim(),
    category: category.trim() || 'Workstream',
    theme,
    iconName: icon,
  };
}

/**
 * 1. Parse JSON project plan or charter
 */
export function parseJsonCharter(jsonString: string): ParsedProjectPlan {
  const data = JSON.parse(jsonString);

  const projectName = data.projectName || data.name || data.title || 'Imported Project Plan';
  const description = data.description || data.projectDescription || 'Custom project charter timeline';
  const startDate = data.startDate || '2026-11-02';

  // Process swimlanes
  let swimlanes: Swimlane[] = [];
  if (Array.isArray(data.swimlanes) && data.swimlanes.length > 0) {
    swimlanes = data.swimlanes.map((lane: any, idx: number) =>
      buildSwimlane(
        lane.id || `lane-${idx}`,
        lane.name || `Workstream ${idx + 1}`,
        lane.category || lane.department || 'Stream',
        idx,
        lane.iconName
      )
    );
  }

  // Process tasks
  const rawTasks = Array.isArray(data.tasks) ? data.tasks : [];
  if (rawTasks.length === 0) {
    throw new Error('Project plan JSON must contain a non-empty "tasks" array.');
  }

  // If swimlanes were not specified explicitly, infer them from task swimlaneId / category
  if (swimlanes.length === 0) {
    const laneIds = Array.from(new Set(rawTasks.map((t: any) => t.swimlaneId || t.swimlane || 'general')));
    swimlanes = laneIds.map((lId: any, idx: number) =>
      buildSwimlane(String(lId), String(lId).replace(/[-_]/g, ' ').toUpperCase(), 'Track', idx)
    );
  }

  const tasks: Task[] = rawTasks.map((t: any, idx: number) => {
    const ownerName = t.owner?.name || t.owner || 'Project Contributor';
    const initials = ownerName
      .split(' ')
      .map((w: string) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || `T${idx + 1}`;

    return {
      id: t.id ? String(t.id) : `task-${idx + 1}`,
      name: t.name || t.title || `Task ${idx + 1}`,
      swimlaneId: t.swimlaneId || t.swimlane || swimlanes[0]?.id || 'design',
      duration: Math.max(1, parseInt(t.duration, 10) || 4),
      delay: parseInt(t.delay, 10) || 0,
      dependsOn: Array.isArray(t.dependsOn) ? t.dependsOn.map(String) : [],
      owner: {
        name: ownerName,
        role: t.owner?.role || 'Lead',
        avatar: t.owner?.avatar || initials,
      },
      description: t.description || '',
    };
  });

  return {
    id: `project-${Date.now()}`,
    projectName,
    description,
    startDate,
    swimlanes,
    tasks,
  };
}

/**
 * 2. Parse CSV Project Plan
 * Expected columns: Task Name, Swimlane, Duration, Prerequisites (comma-separated IDs or names), Owner
 */
export function parseCsvCharter(csvString: string, projectName: string = 'CSV Project Plan'): ParsedProjectPlan {
  const lines = csvString
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    throw new Error('CSV must contain a header row and at least one task row.');
  }

  const header = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/["']/g, ''));
  
  const nameIdx = header.findIndex((h) => h.includes('task') || h.includes('name') || h.includes('title'));
  const laneIdx = header.findIndex((h) => h.includes('swimlane') || h.includes('lane') || h.includes('track') || h.includes('category'));
  const durIdx = header.findIndex((h) => h.includes('duration') || h.includes('days') || h.includes('length') || h.includes('est'));
  const depsIdx = header.findIndex((h) => h.includes('depend') || h.includes('prereq') || h.includes('after'));
  const ownerIdx = header.findIndex((h) => h.includes('owner') || h.includes('assignee') || h.includes('lead'));

  const parsedRawTasks: any[] = [];
  const foundLanes = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    // Basic comma splitter handling quotes
    const regex = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
    const cols = lines[i].split(',').map((c) => c.trim().replace(/^"(.*)"$/, '$1'));

    if (cols.length === 0 || !cols[nameIdx >= 0 ? nameIdx : 0]) continue;

    const taskTitle = (nameIdx >= 0 ? cols[nameIdx] : cols[0]) || `Task ${i}`;
    const laneName = (laneIdx >= 0 ? cols[laneIdx] : 'Core Work') || 'Core Work';
    const duration = parseInt(durIdx >= 0 ? cols[durIdx] : '4', 10) || 4;
    const depsRaw = depsIdx >= 0 && cols[depsIdx] ? cols[depsIdx] : '';
    const ownerName = (ownerIdx >= 0 && cols[ownerIdx] ? cols[ownerIdx] : 'Team Lead') || 'Team Lead';

    foundLanes.add(laneName);

    parsedRawTasks.push({
      id: `task-${i}`,
      name: taskTitle,
      laneName,
      duration,
      depsRaw,
      ownerName,
    });
  }

  // Create swimlanes
  const swimlanes: Swimlane[] = Array.from(foundLanes).map((lName, idx) =>
    buildSwimlane(`lane-${idx + 1}`, lName, 'Workstream', idx)
  );

  const laneNameToId = new Map<string, string>();
  swimlanes.forEach((l) => laneNameToId.set(l.name.toLowerCase(), l.id));

  // Build task map for title matching in dependencies
  const taskTitleToId = new Map<string, string>();
  parsedRawTasks.forEach((t) => {
    taskTitleToId.set(t.name.toLowerCase(), t.id);
    taskTitleToId.set(t.id.toLowerCase(), t.id);
  });

  const tasks: Task[] = parsedRawTasks.map((t, idx) => {
    const laneId = laneNameToId.get(t.laneName.toLowerCase()) || swimlanes[0].id;
    const dependsOn: string[] = [];

    if (t.depsRaw) {
      const parts = t.depsRaw.split(/;|\//).map((s: string) => s.trim().toLowerCase());
      parts.forEach((p: string) => {
        if (taskTitleToId.has(p)) {
          dependsOn.push(taskTitleToId.get(p)!);
        } else {
          // If referenced by row number like "1" or "task-1"
          const num = parseInt(p.replace(/[^0-9]/g, ''), 10);
          if (num > 0 && num < parsedRawTasks.length + 1) {
            dependsOn.push(`task-${num}`);
          }
        }
      });
    }

    const initials = t.ownerName
      .split(' ')
      .map((w: string) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || `T${idx + 1}`;

    return {
      id: t.id,
      name: t.name,
      swimlaneId: laneId,
      duration: Math.max(1, t.duration),
      delay: 0,
      dependsOn,
      owner: {
        name: t.ownerName,
        role: 'Deliverable Owner',
        avatar: initials,
      },
      description: `Task from CSV import: ${t.laneName}`,
    };
  });

  return {
    id: `csv-${Date.now()}`,
    projectName,
    description: `Imported from CSV with ${tasks.length} tasks`,
    startDate: '2026-11-02',
    swimlanes,
    tasks,
  };
}

/**
 * 3. Client-side fallback heuristic parser for raw text/markdown charters
 */
export function parseRawCharterText(rawText: string, projectNameHint?: string): ParsedProjectPlan {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

  let title = projectNameHint || 'Project Charter Plan';
  // Try to find title in first lines (e.g. # Project Name or Title:)
  for (const line of lines.slice(0, 5)) {
    if (line.startsWith('# ')) {
      title = line.replace(/^#\s+/, '').trim();
      break;
    }
    if (line.toLowerCase().startsWith('project:') || line.toLowerCase().startsWith('project name:')) {
      title = line.split(':')[1].trim();
      break;
    }
  }

  // Look for sections or bullets
  interface RawItem {
    section: string;
    text: string;
    days: number;
  }

  const items: RawItem[] = [];
  let currentSection = 'Engineering';

  lines.forEach((line) => {
    if (line.startsWith('## ') || line.startsWith('### ')) {
      currentSection = line.replace(/^#+\s+/, '').replace(/:$/, '').trim();
      return;
    }

    if (line.startsWith('- ') || line.startsWith('* ') || /^\d+\.\s/.test(line)) {
      const clean = line.replace(/^[-*]\s+|\d+\.\s+/, '').trim();
      // Try to extract duration like "(4 days)", "5d", "[3 days]"
      let days = 5;
      const matchDays = clean.match(/(\d+)\s*(days?|d)\b/i);
      if (matchDays) {
        days = parseInt(matchDays[1], 10);
      }
      const taskName = clean.replace(/\((\d+)\s*(days?|d)\)/i, '').replace(/\[(.*?)\]/g, '').trim();

      if (taskName.length > 2) {
        items.push({
          section: currentSection,
          text: taskName,
          days: Math.max(2, Math.min(14, days)),
        });
      }
    }
  });

  // If no bullet items found, chunk paragraphs
  if (items.length < 3) {
    const sentences = rawText
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 15 && s.length < 100);

    const fallbackSections = ['Product & UX', 'Core Engine', 'QA & Delivery', 'GTM Operations'];
    sentences.slice(0, 7).forEach((sent, idx) => {
      items.push({
        section: fallbackSections[idx % fallbackSections.length],
        text: sent.replace(/[.]+$/, ''),
        days: 4 + (idx % 4),
      });
    });
  }

  // Ensure at least 4 items
  if (items.length === 0) {
    items.push(
      { section: 'Discovery & UX', text: 'System Architecture & UX Specs', days: 6 },
      { section: 'Core Platform', text: 'Backend Services & Database Sync', days: 8 },
      { section: 'Client Apps', text: 'Frontend UI Implementation', days: 7 },
      { section: 'Quality Assurance', text: 'Security Audit & Compliance Testing', days: 5 },
      { section: 'Launch Ops', text: 'Production Deployment & Rollout', days: 4 }
    );
  }

  // Group into distinct swimlanes
  const uniqueSections = Array.from(new Set(items.map((i) => i.section)));
  const swimlanes: Swimlane[] = uniqueSections.map((sec, idx) =>
    buildSwimlane(`lane-${idx}`, sec, 'Stream', idx)
  );

  const sectionToLaneId = new Map<string, string>();
  swimlanes.forEach((l) => sectionToLaneId.set(l.name, l.id));

  // Build sequential + cross-dependencies
  const tasks: Task[] = items.slice(0, 8).map((item, idx) => {
    const laneId = sectionToLaneId.get(item.section) || swimlanes[0].id;
    const taskId = `task-${idx + 1}`;
    const dependsOn: string[] = [];

    // Create realistic dependency chain
    if (idx > 0) {
      // Find previous task in same lane, or previous task in previous lane
      const prevInSameLane = items.slice(0, idx).reduce<number | null>((acc, curr, cIdx) => {
        return curr.section === item.section ? cIdx : acc;
      }, null);

      if (prevInSameLane !== null) {
        dependsOn.push(`task-${prevInSameLane + 1}`);
      } else if (idx >= 2) {
        dependsOn.push(`task-${idx}`);
      }
    }

    return {
      id: taskId,
      name: item.text,
      swimlaneId: laneId,
      duration: item.days,
      delay: 0,
      dependsOn,
      owner: {
        name: `Lead ${idx + 1}`,
        role: 'Workstream Lead',
        avatar: `L${idx + 1}`,
      },
      description: `Deliverable extracted from ${item.section}`,
    };
  });

  return {
    id: `charter-${Date.now()}`,
    projectName: title,
    description: 'Dynamic timeline extracted from project charter',
    startDate: '2026-11-02',
    swimlanes,
    tasks,
  };
}

/**
 * 4. Realistic Preloaded Project Charters for instant one-click testing
 */
export const SAMPLE_CHARTERS = [
  {
    id: 'charter-fintech',
    name: 'NeoBank Mobile Pay & Debit Card',
    category: 'Fintech & Banking',
    description: 'Next-generation digital banking platform with virtual cards, instant ledger settlements, and biometric compliance.',
    content: `# NeoBank Mobile Pay & Debit Card Charter
Project Goal: Deliver a PCI-DSS certified mobile banking application with instant Apple Pay provisioning.

## Design & Experience
- Design Token System & Onboarding KYC Flow (5 days)
- Biometric Verification & Card Activation UI (4 days)

## Banking Core & Cloud
- Double-Entry Ledger & Realtime Balance API (8 days)
- Visa Direct Settlement & Webhook Gateway (6 days)

## Compliance & Security
- SOC2 Type II & Penetration Testing (5 days)
- Fraud Detection Anomaly Engine (4 days)

## Go-To-Market & Banking Ops
- App Store Fast-Track & Card Bureau Production Run (5 days)`,
  },
  {
    id: 'charter-healthtech',
    name: 'AI Diagnostic Radiology Portal',
    category: 'Healthcare & MedTech',
    description: 'HIPAA-compliant cloud DICOM viewer with automated lung nodule detection and clinical report generation.',
    content: `# AI Diagnostic Radiology Portal Charter
Project Goal: Deploy an FDA Software-as-a-Medical-Device (SaMD) radiology decision support cockpit.

## Clinical Algorithms
- Deep Learning Lung Nodule Model Validation (7 days)
- Radiologist Sensitivity & Specificity Clinical Study (5 days)

## Cloud PACS Infrastructure
- HIPAA Compliant DICOM Web Ingestion Gateway (8 days)
- Encrypted GPU Inference Pipeline (6 days)

## Clinician Experience
- Zero-Footprint 3D DICOM Web Viewer (6 days)
- Automated Structured Diagnostic Report Generator (4 days)

## Regulatory & Pilot
- Hospital IRB Review & 3-Site Clinical Pilot Rollout (5 days)`,
  },
  {
    id: 'charter-autonomous',
    name: 'Autonomous Delivery Drone Flight Stack',
    category: 'Aerospace & Robotics',
    description: 'Commercial delivery drone flight software, fail-safe collision avoidance, and FAA Part 107 telemetry.',
    content: `# Autonomous Delivery Drone Flight Stack Charter
Project Goal: Autonomous last-mile delivery drone flight controller firmware and ground telemetry cockpit.

## Sensors & Calibration
- Dual LiDAR & Optical Flow Ground Calibration (6 days)
- Brushless Motor ESC PID Controller Tuning (4 days)

## Flight Controller Firmware
- Real-Time RTOS Flight Management Computer (8 days)
- VFH+ Dynamic Collision Avoidance SLAM Engine (6 days)

## Fleet Operations & Telemetry
- Cellular 5G Multi-Carrier Failover Telemetry (5 days)
- Cloud Airspace Fleet Dispatch Cockpit (5 days)

## Flight Range Certification
- Autonomous 15-Mile BVLOS Test Flight Clearance (5 days)`,
  },
];
