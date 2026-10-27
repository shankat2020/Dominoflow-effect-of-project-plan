import React, { useState } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { Swimlane, Task } from '../types';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (newTask: Omit<Task, 'id'>) => void;
  swimlanes: Swimlane[];
  existingTasks: Task[];
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  onAddTask,
  swimlanes,
  existingTasks,
}) => {
  const [name, setName] = useState('');
  const [swimlaneId, setSwimlaneId] = useState(swimlanes[0]?.id || 'design');
  const [duration, setDuration] = useState(5);
  const [dependsOn, setDependsOn] = useState<string[]>([]);
  const [ownerName, setOwnerName] = useState('Alex Taylor');
  const [ownerRole, setOwnerRole] = useState('Product Engineer');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const initials = ownerName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'AT';

    onAddTask({
      name: name.trim(),
      swimlaneId,
      duration: Math.max(1, duration),
      delay: 0,
      dependsOn,
      owner: {
        name: ownerName.trim() || 'Alex Taylor',
        role: ownerRole.trim() || 'Contributor',
        avatar: initials,
      },
      description: `New launch deliverable in ${swimlanes.find((l) => l.id === swimlaneId)?.name}`,
    });

    // Reset form
    setName('');
    setDuration(5);
    setDependsOn([]);
    onClose();
  };

  const toggleDependency = (id: string) => {
    if (dependsOn.includes(id)) {
      setDependsOn(dependsOn.filter((d) => d !== id));
    } else {
      setDependsOn([...dependsOn, id]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 text-slate-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" />
              <span>Add New Launch Task</span>
            </h3>
            <p className="text-xs text-slate-400">
              Tasks automatically position on the domino timeline with calculated buffers
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Billing Integration & Stripe Webhooks"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Swimlane
              </label>
              <select
                value={swimlaneId}
                onChange={(e) => setSwimlaneId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {swimlanes.map((lane) => (
                  <option key={lane.id} value={lane.id}>
                    {lane.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Duration (Days)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Prerequisite Tasks (Domino Block Chain)
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              Select which tasks must complete before this task can start:
            </p>
            <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 rounded-lg bg-slate-950 border border-slate-800">
              {existingTasks.map((t) => {
                const isSelected = dependsOn.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleDependency(t.id)}
                    className={`w-full px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center justify-between border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{t.name}</span>
                    <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${isSelected ? 'bg-indigo-500 text-white' : 'border border-slate-600'}`}>
                      {isSelected && <Check className="w-2.5 h-2.5" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Owner Name
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Role Title
              </label>
              <input
                type="text"
                value={ownerRole}
                onChange={(e) => setOwnerRole(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 cursor-pointer transition-colors"
            >
              Add Task to Flow
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
