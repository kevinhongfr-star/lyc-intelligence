import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Loader2,
  Edit2,
  Save,
  X,
  User,
  Calendar,
  FileText,
  Laptop,
  Mail,
  Users,
  Target,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Badge, Button } from '@/components/ui';

export interface OnboardingTask {
  task: string;
  category: 'documentation' | 'verification' | 'setup' | 'communication' | 'planning';
  completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  completed_by_name?: string;
  notes: string | null;
  due_days?: number;
}

export interface OnboardingChecklistProps {
  offerId: string;
  candidateName: string;
  startDate: string;
  tasks: OnboardingTask[];
  onTaskToggle: (taskIndex: number, completed: boolean, notes?: string) => Promise<void>;
  onTaskUpdate: (taskIndex: number, updates: Partial<OnboardingTask>) => Promise<void>;
  onAddTask?: (task: Omit<OnboardingTask, 'completed' | 'completed_at' | 'completed_by'>) => void;
  readOnly?: boolean;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof FileText; color: string; bgColor: string }> = {
  documentation: { label: 'Documentation', icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  verification: { label: 'Verification', icon: CheckCircle2, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  setup: { label: 'Setup', icon: Laptop, color: 'text-green-600', bgColor: 'bg-green-100' },
  communication: { label: 'Communication', icon: Mail, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  planning: { label: 'Planning', icon: Target, color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
};

export function OnboardingChecklist({
  offerId,
  candidateName,
  startDate,
  tasks,
  onTaskToggle,
  onTaskUpdate,
  onAddTask,
  readOnly = false,
}: OnboardingChecklistProps) {
  const [loading, setLoading] = useState<number | null>(null);
  const [editingTask, setEditingTask] = useState<number | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['documentation', 'verification', 'setup', 'communication', 'planning']));

  const today = new Date();
  const start = new Date(startDate);

  const { stats, tasksByCategory, overdueTasks, upcomingTasks } = useMemo(() => {
    const completed = tasks.filter(t => t.completed).length;
    const total = tasks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    const byCategory: Record<string, OnboardingTask[]> = {};
    const overdue: number[] = [];
    const upcoming: number[] = [];

    tasks.forEach((task, idx) => {
      // Group by category
      const cat = task.category || 'planning';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(task);

      // Check if overdue
      if (!task.completed && task.due_days) {
        const dueDate = new Date(start);
        dueDate.setDate(dueDate.getDate() + task.due_days);
        if (today > dueDate) {
          overdue.push(idx);
        } else {
          const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (daysUntil <= 3) {
            upcoming.push(idx);
          }
        }
      }
    });

    return {
      stats: { completed, total, percentage },
      tasksByCategory: byCategory,
      overdueTasks: overdue,
      upcomingTasks: upcoming,
    };
  }, [tasks, startDate]);

  const handleToggle = async (index: number, currentCompleted: boolean) => {
    if (readOnly) return;
    setLoading(index);
    try {
      await onTaskToggle(index, !currentCompleted);
    } finally {
      setLoading(null);
    }
  };

  const handleSaveNotes = async (index: number) => {
    setLoading(index);
    try {
      await onTaskUpdate(index, { notes: editNotes });
      setEditingTask(null);
    } finally {
      setLoading(null);
    }
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDueDate = (dueDays: number): { date: Date; isOverdue: boolean; isUrgent: boolean } => {
    const dueDate = new Date(start);
    dueDate.setDate(dueDate.getDate() + dueDays);
    const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return {
      date: dueDate,
      isOverdue: daysUntil < 0,
      isUrgent: daysUntil >= 0 && daysUntil <= 3,
    };
  };

  return (
    <div className="bg-card border border-card-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-card-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Onboarding Checklist</h2>
              <p className="text-sm text-text-muted">{candidateName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Calendar className="w-4 h-4" />
              <span>Start: {formatDate(startDate)}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-2">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-text-muted">Progress</span>
            <span className="font-medium text-text-primary">
              {stats.completed}/{stats.total} tasks ({stats.percentage}%)
            </span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent to-accent/70 rounded-full transition-all duration-500"
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
        </div>

        {/* Alerts */}
        {(overdueTasks.length > 0 || upcomingTasks.length > 0) && !readOnly && (
          <div className="flex items-center gap-2 mt-3">
            {overdueTasks.length > 0 && (
              <Badge className="bg-red-100 text-red-700">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {overdueTasks.length} overdue
              </Badge>
            )}
            {upcomingTasks.length > 0 && (
              <Badge className="bg-orange-100 text-orange-700">
                <Clock className="w-3 h-3 mr-1" />
                {upcomingTasks.length} due soon
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Tasks by Category */}
      <div className="divide-y divide-card-border">
        {Object.entries(CATEGORY_CONFIG).map(([category, config]) => {
          const categoryTasks = tasksByCategory[category] || [];
          if (categoryTasks.length === 0) return null;

          const completedInCategory = categoryTasks.filter(t => t.completed).length;
          const isExpanded = expandedCategories.has(category);
          const Icon = config.icon;

          return (
            <div key={category}>
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full p-4 flex items-center justify-between hover:bg-bg-alt transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${config.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-text-primary">{config.label}</p>
                    <p className="text-xs text-text-muted">
                      {completedInCategory}/{categoryTasks.length} completed
                    </p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-text-muted" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-text-muted" />
                )}
              </button>

              {/* Tasks */}
              {isExpanded && (
                <div className="pb-2">
                  {categoryTasks.map((task, idx) => {
                    const globalIndex = tasks.findIndex(t => t.task === task.task && t.category === task.category);
                    const dueInfo = task.due_days ? getDueDate(task.due_days) : null;
                    const isOverdueTask = overdueTasks.includes(globalIndex);
                    const isUrgentTask = upcomingTasks.includes(globalIndex);
                    const isEditing = editingTask === globalIndex;

                    return (
                      <div
                        key={idx}
                        className={`px-4 py-3 mx-4 my-1 rounded-lg ${
                          task.completed
                            ? 'bg-green-50'
                            : isOverdueTask
                            ? 'bg-red-50'
                            : isUrgentTask
                            ? 'bg-orange-50'
                            : 'bg-bg-alt'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Checkbox */}
                          <button
                            onClick={() => handleToggle(globalIndex, task.completed)}
                            disabled={loading === globalIndex || readOnly}
                            className={`mt-0.5 flex-shrink-0 ${
                              loading === globalIndex ? 'opacity-50' : ''
                            } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                          >
                            {loading === globalIndex ? (
                              <Loader2 className="w-5 h-5 text-accent animate-spin" />
                            ) : task.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                            )}
                          </button>

                          {/* Task Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <p className={`font-medium ${
                                task.completed ? 'text-green-700 line-through' : 'text-text-primary'
                              }`}>
                                {task.task}
                              </p>
                              {!readOnly && (
                                <button
                                  onClick={() => {
                                    setEditingTask(globalIndex);
                                    setEditNotes(task.notes || '');
                                  }}
                                  className="p-1 hover:bg-white/50 rounded"
                                >
                                  <Edit2 className="w-4 h-4 text-text-muted" />
                                </button>
                              )}
                            </div>

                            {/* Due Info */}
                            {dueInfo && (
                              <div className="flex items-center gap-2 mt-1">
                                {task.completed ? (
                                  <span className="text-xs text-green-600 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Completed {task.completed_at && formatDate(task.completed_at)}
                                  </span>
                                ) : (
                                  <span className={`text-xs flex items-center gap-1 ${
                                    dueInfo.isOverdue
                                      ? 'text-red-600'
                                      : dueInfo.isUrgent
                                      ? 'text-orange-600'
                                      : 'text-text-muted'
                                  }`}>
                                    <Clock className="w-3 h-3" />
                                    Due {dueInfo.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    {dueInfo.isOverdue && ` (${Math.abs(Math.ceil((today.getTime() - dueInfo.date.getTime()) / (1000 * 60 * 60 * 24)))}d overdue)`}
                                    {dueInfo.isUrgent && !dueInfo.isOverdue && ' (soon)'}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Completed By */}
                            {task.completed && task.completed_by_name && (
                              <p className="text-xs text-green-600 mt-1">
                                By {task.completed_by_name}
                              </p>
                            )}

                            {/* Notes */}
                            {isEditing ? (
                              <div className="mt-2">
                                <textarea
                                  value={editNotes}
                                  onChange={(e) => setEditNotes(e.target.value)}
                                  placeholder="Add notes..."
                                  rows={2}
                                  className="w-full px-3 py-2 bg-white border border-card-border rounded text-sm resize-none"
                                />
                                <div className="flex gap-2 mt-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingTask(null)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveNotes(globalIndex)}
                                  >
                                    <Save className="w-3 h-3 mr-1" />
                                    Save
                                  </Button>
                                </div>
                              </div>
                            ) : task.notes ? (
                              <p className="text-sm text-text-muted mt-1 italic">
                                {task.notes}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {tasks.length === 0 && (
        <div className="p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-text-muted">No onboarding tasks yet</p>
          {!readOnly && onAddTask && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setShowAddTask(true)}
            >
              Add First Task
            </Button>
          )}
        </div>
      )}

      {/* Footer */}
      {stats.percentage === 100 && (
        <div className="p-4 bg-green-50 border-t border-green-200 text-center">
          <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto mb-2" />
          <p className="font-medium text-green-800">Onboarding Complete!</p>
        </div>
      )}
    </div>
  );
}