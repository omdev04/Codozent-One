import React, { useState } from 'react';
import {
  Briefcase, Plus, Clock, CheckSquare, AlertCircle,
  Calendar, CheckCircle2, ChevronRight, X, User, IndianRupee
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { WorkProject, WorkTask } from '../../types/erp';

export const WorkModule: React.FC = () => {
  const { projects, createProject, tasks, createTask, updateTask } = useERP();
  const [activeTab, setActiveTab] = useState<'tasks' | 'projects'>('tasks');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  // New Project Form
  const [projectForm, setProjectForm] = useState({
    name: '',
    clientName: '',
    budget: 150000,
    startDate: new Date().toISOString().split('T')[0],
    targetEndDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    managerName: 'Project Lead',
    milestones: [
      { id: 'm1', title: 'Design & Tooling Approval', completed: false, dueDate: '2026-03-15' },
      { id: 'm2', title: 'Batch 1 Production Run', completed: false, dueDate: '2026-03-25' }
    ]
  });

  // New Task Form
  const [taskForm, setTaskForm] = useState({
    title: '',
    projectId: '',
    description: '',
    assignedTo: 'Engineer Ramesh',
    priority: 'medium' as WorkTask['priority'],
    estimatedHours: 8,
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  });

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.name) return;
    await createProject({
      ...projectForm,
      status: 'active'
    });
    setIsProjectModalOpen(false);
    setProjectForm({
      name: '',
      clientName: '',
      budget: 150000,
      startDate: new Date().toISOString().split('T')[0],
      targetEndDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      managerName: 'Project Lead',
      milestones: []
    });
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title) return;
    const project = projects.find(p => p.id === taskForm.projectId);
    await createTask({
      ...taskForm,
      projectName: project?.name,
      status: 'todo'
    });
    setIsTaskModalOpen(false);
    setTaskForm({
      title: '',
      projectId: '',
      description: '',
      assignedTo: 'Engineer Ramesh',
      priority: 'medium',
      estimatedHours: 8,
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    });
  };

  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;

  return (
    <div className="space-y-6">
      {/* Module Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-ink-nav uppercase tracking-wider">Codozent One · Operations Engine</div>
          <h1 className="text-2xl font-bold text-ink tracking-tight mt-0.5">Work & Task Operations</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsProjectModalOpen(true)} className="btn-outline">
            <Briefcase className="w-4 h-4" />
            <span>New Project</span>
          </button>
          <button onClick={() => setIsTaskModalOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            <span>Assign Task</span>
          </button>
        </div>
      </div>

      {/* Flat Highlight Band */}
      <div className="bg-[#ebf8ff] border-y border-[#bce3fe] -mx-4 md:-mx-8 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex gap-6 text-xs">
          <div>
            <span className="text-ink-meta">Active Projects: </span>
            <strong className="text-ink font-bold">{projects.length}</strong>
          </div>
          <div>
            <span className="text-ink-meta">Total Tasks: </span>
            <strong className="text-ink font-bold">{tasks.length}</strong>
          </div>
          <div>
            <span className="text-ink-meta">In Progress: </span>
            <strong className="text-primary font-bold">{inProgressTasks}</strong>
          </div>
          <div>
            <span className="text-ink-meta">Completed: </span>
            <strong className="text-emerald-700 font-bold">{completedTasks}</strong>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-white border border-hairline rounded-md p-0.5 text-xs">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-3 py-1 rounded font-medium transition-colors ${activeTab === 'tasks' ? 'bg-primary text-white' : 'text-ink-body hover:bg-chrome'
              }`}
          >
            Tasks Board
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-3 py-1 rounded font-medium transition-colors ${activeTab === 'projects' ? 'bg-primary text-white' : 'text-ink-body hover:bg-chrome'
              }`}
          >
            Projects List
          </button>
        </div>
      </div>

      {/* Task View */}
      {activeTab === 'tasks' ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {(['todo', 'in_progress', 'review', 'done'] as const).map(statusKey => {
            const statusTasks = tasks.filter(t => t.status === statusKey);
            const statusLabels = {
              todo: 'To Do / Backlog',
              in_progress: 'In Progress',
              review: 'Quality Review',
              done: 'Completed'
            };

            return (
              <div key={statusKey} className="bg-chrome rounded-md border border-hairline p-3 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-ink border-b border-hairline pb-2">
                  <span>{statusLabels[statusKey]}</span>
                  <span className="px-1.5 py-0.5 bg-white border border-hairline rounded text-[10px]">
                    {statusTasks.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {statusTasks.length === 0 ? (
                    <div className="text-center py-6 text-xs text-ink-nav italic">
                      No tasks
                    </div>
                  ) : (
                    statusTasks.map(task => (
                      <div key={task.id} className="p-3 bg-white border border-hairline rounded-md space-y-2">
                        <div className="text-xs font-bold text-ink">{task.title}</div>
                        {task.projectName && (
                          <div className="text-[10px] text-primary font-medium">{task.projectName}</div>
                        )}
                        <div className="flex items-center justify-between text-[11px] text-ink-meta pt-1 border-t border-hairline">
                          <span>{task.assignedTo}</span>
                          <span>{task.estimatedHours}h est</span>
                        </div>

                        {/* Move task action */}
                        <div className="flex justify-between items-center pt-1">
                          <select
                            value={task.status}
                            onChange={(e) => updateTask(task.id, { status: e.target.value as any })}
                            className="text-[10px] bg-chrome border border-hairline rounded px-1.5 py-0.5 text-ink"
                          >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="review">Review</option>
                            <option value="done">Done</option>
                          </select>
                          <span className={`text-[10px] uppercase font-bold ${task.priority === 'urgent' ? 'text-red-600' : 'text-ink-nav'
                            }`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Projects View */
        <div className="bg-white border border-hairline rounded-md overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-chrome border-b border-hairline text-ink font-bold">
              <tr>
                <th className="p-3">Project Name</th>
                <th className="p-3">Client</th>
                <th className="p-3">Budget</th>
                <th className="p-3">Timeline</th>
                <th className="p-3">Lead</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-ink-nav italic">
                    No active projects. Click "New Project" to create one.
                  </td>
                </tr>
              ) : (
                projects.map(proj => (
                  <tr key={proj.id} className="hover:bg-chrome/50">
                    <td className="p-3 font-bold text-ink">{proj.name}</td>
                    <td className="p-3 text-ink-body">{proj.clientName}</td>
                    <td className="p-3 font-semibold text-ink">₹{proj.budget.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-ink-meta">{proj.startDate} to {proj.targetEndDate}</td>
                    <td className="p-3 text-ink-body">{proj.managerName}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-band-blue text-primary font-medium rounded text-[11px] capitalize">
                        {proj.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-hairline shadow-lift max-w-md w-full overflow-hidden">
            <div className="px-5 py-3 border-b border-hairline bg-chrome flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink">Assign Operational Task</h3>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-ink-nav hover:text-ink">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CNC Tool Calibration for Batch 14"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-hairline rounded-md focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Associated Project</label>
                <select
                  value={taskForm.projectId}
                  onChange={(e) => setTaskForm({ ...taskForm, projectId: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-hairline rounded-md bg-white focus:outline-none focus:border-primary"
                >
                  <option value="">General Plant Maintenance</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.clientName})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Assignee</label>
                  <input
                    type="text"
                    value={taskForm.assignedTo}
                    onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-hairline rounded-md focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Estimated Hours</label>
                  <input
                    type="number"
                    value={taskForm.estimatedHours}
                    onChange={(e) => setTaskForm({ ...taskForm, estimatedHours: Number(e.target.value) })}
                    className="w-full text-xs px-3 py-2 border border-hairline rounded-md focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-hairline">
                <button type="button" onClick={() => setIsTaskModalOpen(false)} className="btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Modal */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-hairline shadow-lift max-w-md w-full overflow-hidden">
            <div className="px-5 py-3 border-b border-hairline bg-chrome flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink">New Client Project</h3>
              <button onClick={() => setIsProjectModalOpen(false)} className="text-ink-nav hover:text-ink">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Engine Gearbox Housing Fabrication"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-hairline rounded-md focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Client Name</label>
                <input
                  type="text"
                  placeholder="e.g. Bajaj Auto Chakan"
                  value={projectForm.clientName}
                  onChange={(e) => setProjectForm({ ...projectForm, clientName: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-hairline rounded-md focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Total Contract Budget (₹)</label>
                <input
                  type="number"
                  value={projectForm.budget}
                  onChange={(e) => setProjectForm({ ...projectForm, budget: Number(e.target.value) })}
                  className="w-full text-xs px-3 py-2 border border-hairline rounded-md focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-hairline">
                <button type="button" onClick={() => setIsProjectModalOpen(false)} className="btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Launch Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

