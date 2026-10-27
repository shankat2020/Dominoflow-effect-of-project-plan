import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  FileCode, 
  FileSpreadsheet, 
  Loader2, 
  Zap,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { 
  parseJsonCharter, 
  parseCsvCharter, 
  parseRawCharterText, 
  ParsedProjectPlan, 
  SAMPLE_CHARTERS 
} from '../utils/charterParser';

interface UploadCharterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadProject: (project: ParsedProjectPlan) => void;
}

export const UploadCharterModal: React.FC<UploadCharterModalProps> = ({
  isOpen,
  onClose,
  onLoadProject,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'samples'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [projectNameHint, setProjectNameHint] = useState('');
  const [startDate, setStartDate] = useState('2026-11-02');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Process text or file content through server Gemini or client parser
  const processCharterContent = async (
    rawContent: string,
    fileName: string = 'charter.txt',
    customName?: string
  ) => {
    setIsLoading(true);
    setErrorMessage(null);
    setLoadingStep('Analyzing document structure...');

    try {
      const lowerName = fileName.toLowerCase();

      // 1. If JSON file
      if (lowerName.endsWith('.json') || rawContent.trim().startsWith('{')) {
        setLoadingStep('Parsing structured JSON timeline schema...');
        const parsed = parseJsonCharter(rawContent);
        if (startDate) parsed.startDate = startDate;
        if (customName) parsed.projectName = customName;
        onLoadProject(parsed);
        setIsLoading(false);
        onClose();
        return;
      }

      // 2. If CSV file
      if (lowerName.endsWith('.csv') || (rawContent.includes(',') && rawContent.includes('\n'))) {
        try {
          setLoadingStep('Parsing tabular CSV deliverables and prerequisites...');
          const parsed = parseCsvCharter(rawContent, customName || 'Imported CSV Timeline');
          if (startDate) parsed.startDate = startDate;
          onLoadProject(parsed);
          setIsLoading(false);
          onClose();
          return;
        } catch (e: any) {
          // If CSV parser fails, fall through to text/AI parser
          console.log('CSV parse failed, falling back to charter text extractor:', e.message);
        }
      }

      // 3. For narrative text, markdown, charter docs: Try Gemini AI via server endpoint
      setLoadingStep('Connecting to AI Charter Analysis engine...');
      try {
        const response = await fetch('/api/parse-charter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            charterText: rawContent,
            projectNameHint: customName || projectNameHint,
            startDateHint: startDate,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.project) {
            setLoadingStep('Synthesizing domino timeline & buffer cushions...');
            const p = result.project;
            // Ensure swimlanes have themes
            const parsed: ParsedProjectPlan = parseJsonCharter(JSON.stringify(p));
            if (startDate) parsed.startDate = startDate;
            onLoadProject(parsed);
            setIsLoading(false);
            onClose();
            return;
          }
        }
      } catch (err) {
        console.warn('Server AI endpoint unavailable, using local heuristic extractor:', err);
      }

      // 4. Local heuristic fallback parser (always succeeds instantly)
      setLoadingStep('Synthesizing workstreams & dependency chain...');
      const fallbackProject = parseRawCharterText(rawContent, customName || projectNameHint);
      if (startDate) fallbackProject.startDate = startDate;
      onLoadProject(fallbackProject);
      setIsLoading(false);
      onClose();
    } catch (err: any) {
      console.error('Error parsing project charter:', err);
      setErrorMessage(err.message || 'Could not parse project charter. Please check format or try a sample.');
      setIsLoading(false);
    }
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        processCharterContent(content, file.name);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read file from disk.');
    };
    reader.readAsText(file);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDownloadSampleJson = () => {
    const sample = {
      projectName: 'Quantum Next-Gen Cloud Platform',
      description: 'Distributed microservices architecture rollout with zero-trust security',
      startDate: '2026-11-02',
      swimlanes: [
        { id: 'arch', name: 'Architecture & RFCs', category: 'Systems' },
        { id: 'backend', name: 'Core Microservices', category: 'Backend' },
        { id: 'security', name: 'Zero-Trust Auth', category: 'Security' },
        { id: 'gtm', name: 'Canary Deployment', category: 'Ops' },
      ],
      tasks: [
        {
          id: 'task-1',
          name: 'RFC & Protocol Specifications',
          swimlaneId: 'arch',
          duration: 6,
          dependsOn: [],
          owner: { name: 'Elena Rostova', role: 'Chief Architect', avatar: 'ER' },
        },
        {
          id: 'task-2',
          name: 'High-Throughput Gateway Engine',
          swimlaneId: 'backend',
          duration: 8,
          dependsOn: ['task-1'],
          owner: { name: 'Dev Patel', role: 'Systems Lead', avatar: 'DP' },
        },
        {
          id: 'task-3',
          name: 'Mutual TLS & mTLS Encryption',
          swimlaneId: 'security',
          duration: 5,
          dependsOn: ['task-1'],
          owner: { name: 'Jordan Vance', role: 'Security Lead', avatar: 'JV' },
        },
        {
          id: 'task-4',
          name: 'Multi-Region Load Balancing',
          swimlaneId: 'backend',
          duration: 6,
          dependsOn: ['task-2'],
          owner: { name: 'Sarah Chen', role: 'Staff SRE', avatar: 'SC' },
        },
        {
          id: 'task-5',
          name: 'Global Canary Traffic Cutover',
          swimlaneId: 'gtm',
          duration: 4,
          dependsOn: ['task-3', 'task-4'],
          owner: { name: 'Marcus Brody', role: 'Release Director', avatar: 'MB' },
        },
      ],
    };

    const blob = new Blob([JSON.stringify(sample, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'domino-project-charter-template.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSampleCsv = () => {
    const csvContent = `Task Name,Swimlane,Duration (Days),Prerequisites,Owner,Role
UX Design System,Design & UX,6,,Maya Lin,Staff Designer
Interactive Prototypes,Design & UX,4,UX Design System,Alex Rivera,UX Researcher
Core API Gateway,Backend & Cloud,8,,Dev Patel,Infra Architect
Client State Hydration,Frontend & Mobile,7,Core API Gateway,Sarah Chen,Frontend Staff
SOC2 Pen Testing,Security & QA,5,Core API Gateway,Jordan Vance,Security Lead
E2E Regression Testing,Security & QA,4,Client State Hydration;SOC2 Pen Testing,Elena Rostova,QA Specialist
App Store Production Rollout,Launch Ops,5,Interactive Prototypes;E2E Regression Testing,Marcus Brody,Product Director
`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'domino-timeline-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Import Project Charter &amp; Define Timeline
              </h3>
              <p className="text-xs text-slate-400">
                Upload or paste a charter to dynamically construct parallel swimlanes &amp; buffer cushions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global Timeline Parameters Bar */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="font-semibold text-slate-300 block mb-1">
              Project Kickoff / Start Date:
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-300 block mb-1">
              Project Name (Optional override):
            </label>
            <input
              type="text"
              placeholder="e.g. Next-Gen Mobile App v2"
              value={projectNameHint}
              onChange={(e) => setProjectNameHint(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Segmented Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File (.json, .csv, .md, .txt)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'paste'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Paste Charter / PRD</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('samples')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'samples'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Preloaded Charters</span>
          </button>
        </div>

        {/* Tab 1: File Upload */}
        {activeTab === 'upload' && (
          <div className="space-y-4 overflow-y-auto pr-1">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-indigo-400 bg-indigo-950/20 scale-[1.01]'
                  : 'border-slate-700 hover:border-slate-500 bg-slate-950/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.csv,.md,.txt,.pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <div className="w-12 h-12 rounded-full bg-slate-800 text-indigo-400 mx-auto flex items-center justify-center mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-200">
                Click to browse or drag and drop your project charter
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports JSON, CSV (Jira/Asana export), Markdown specs (.md), or raw text (.txt)
              </p>
            </div>

            {/* Template Download Utilities */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <span className="text-slate-400">Need a starting structure?</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadSampleJson}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Download .JSON Template</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadSampleCsv}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download .CSV Template</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Paste Charter Text */}
        {activeTab === 'paste' && (
          <div className="space-y-3 flex-1 flex flex-col min-h-0 overflow-y-auto">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Paste Project Charter, PRD Scope, or SOW Deliverables:
              </label>
              <textarea
                rows={9}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder={`# Mobile Banking Application Charter
Project Scope: Deliver customer onboarding, debit card activation, and real-time ledger settlement.

## Design & Experience
- Design System Tokens & Brand Guide (5 days)
- KYC Onboarding Flow & Biometric Auth (4 days)

## Core Platform
- Double-Entry Ledger Engine (8 days)
- Visa Direct Settlement Gateway (6 days)

## Quality Assurance
- Penetration Testing & SOC2 Audit (5 days)
- Cross-Device E2E Regression (4 days)

## Go-To-Market
- App Store Submission & Production Rollout (5 days)`}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPastedText('')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                disabled={!pastedText.trim()}
                onClick={() => processCharterContent(pastedText, 'pasted-charter.txt')}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Parse Charter &amp; Build Timeline</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Preloaded Sample Charters */}
        {activeTab === 'samples' && (
          <div className="space-y-2.5 overflow-y-auto max-h-[50vh] pr-1">
            <p className="text-xs text-slate-400 mb-2">
              Select any pre-configured industry project charter to dynamically reload the domino timeline:
            </p>
            {SAMPLE_CHARTERS.map((charter) => (
              <div
                key={charter.id}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900/50 transition-all flex items-center justify-between gap-4 group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {charter.category}
                    </span>
                    <h4 className="text-sm font-bold text-slate-100 truncate">
                      {charter.name}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {charter.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => processCharterContent(charter.content, `${charter.id}.md`, charter.name)}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1.5 shrink-0 transition-transform active:scale-95 cursor-pointer"
                >
                  <span>Load Project</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center">
            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-3" />
            <h4 className="text-sm font-bold text-white mb-1">
              Extracting Project Timeline
            </h4>
            <p className="text-xs text-indigo-300 font-medium animate-pulse">
              {loadingStep}
            </p>
            <p className="text-[11px] text-slate-500 mt-2 max-w-xs">
              Calculating domino predecessors, parallel swimlanes, and safe buffer float...
            </p>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="mt-3 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong>Import Error:</strong> {errorMessage}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
