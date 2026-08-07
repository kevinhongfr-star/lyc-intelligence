import React, { useState } from 'react';
import { Highlighter, MessageSquare, X, Plus, Trash2, Pencil, Check, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui';

export type AnnotationType = 'highlight' | 'comment' | 'redline';

export interface Annotation {
  id: string;
  type: AnnotationType;
  content: string;
  sectionId: string;
  page?: number;
  color?: string;
  author?: string;
  createdAt: string;
  resolved?: boolean;
}

interface ReportAnnotationsProps {
  annotations: Annotation[];
  onAdd: (annotation: Omit<Annotation, 'id' | 'createdAt'>) => void;
  onUpdate: (id: string, updates: Partial<Annotation>) => void;
  onDelete: (id: string) => void;
}

const ANNOTATION_COLORS: Record<AnnotationType, string> = {
  highlight: '#FFFF00',
  comment: '#3B82F6',
  redline: '#EF4444',
};

const TYPE_LABELS: Record<AnnotationType, string> = {
  highlight: 'Highlight',
  comment: 'Comment',
  redline: 'Redline',
};

const TYPE_ICONS: Record<AnnotationType, React.ReactNode> = {
  highlight: <Highlighter className="w-4 h-4" />,
  comment: <MessageSquare className="w-4 h-4" />,
  redline: <Pencil className="w-4 h-4" />,
};

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function ReportAnnotations({ annotations, onAdd, onUpdate, onDelete }: ReportAnnotationsProps) {
  const [selectedType, setSelectedType] = useState<AnnotationType>('comment');
  const [newContent, setNewContent] = useState('');
  const [filter, setFilter] = useState<AnnotationType | 'all'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const filtered = annotations.filter((a) => {
    if (filter !== 'all' && a.type !== filter) return false;
    return true;
  });

  const handleAdd = () => {
    if (!newContent.trim()) return;
    onAdd({
      type: selectedType,
      content: newContent,
      sectionId: 'general',
      color: ANNOTATION_COLORS[selectedType],
      resolved: false,
    });
    setNewContent('');
  };

  const handleStartEdit = (a: Annotation) => {
    setEditingId(a.id);
    setEditContent(a.content);
  };

  const handleSaveEdit = (id: string) => {
    if (!editContent.trim()) return;
    onUpdate(id, { content: editContent });
    setEditingId(null);
  };

  const toggleResolved = (id: string, resolved: boolean) => {
    onUpdate(id, { resolved });
  };

  const counts = {
    all: annotations.length,
    highlight: annotations.filter((a) => a.type === 'highlight').length,
    comment: annotations.filter((a) => a.type === 'comment').length,
    redline: annotations.filter((a) => a.type === 'redline').length,
  };

  return (
    <div className="bg-bg rounded-none border border-border flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Highlighter className="w-5 h-5 text-[#C108AB]" />
            Annotations
          </h2>
          <span className="text-sm text-text-muted">{annotations.length} total</span>
        </div>

        <div className="flex items-center gap-2">
          {(['all', 'highlight', 'comment', 'redline'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1 text-xs font-medium border transition-colors ${
                filter === t
                  ? 'border-[#C108AB] bg-[#C108AB]/10 text-[#C108AB]'
                  : 'border-border text-text-muted hover:text-text-primary'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)} ({counts[t]})
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 border-b border-border bg-bg-alt">
        <div className="flex items-center gap-2 mb-3">
          {(['highlight', 'comment', 'redline'] as AnnotationType[]).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`flex items-center gap-1 px-2 py-1 text-xs border transition-colors ${
                selectedType === type
                  ? 'border-[#C108AB] bg-[#C108AB]/10 text-[#C108AB]'
                  : 'border-border text-text-muted hover:text-text-primary'
              }`}
            >
              {TYPE_ICONS[type]}
              {TYPE_LABELS[type]}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 bg-bg border border-border p-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-[#C108AB] rounded-none"
            placeholder={`Add ${TYPE_LABELS[selectedType].toLowerCase()}...`}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <Button onClick={handleAdd} size="sm">
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-text-muted">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No annotations</p>
            <p className="text-xs mt-1">Add a highlight, comment, or redline</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((a) => (
              <div
                key={a.id}
                className={`p-3 flex gap-3 transition-colors ${
                  a.resolved ? 'opacity-50' : ''
                }`}
                style={{ borderLeft: `3px solid ${a.color || ANNOTATION_COLORS[a.type]}` }}
              >
                <div className="cursor-grab text-text-muted pt-1">
                  <GripVertical className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium uppercase tracking-wide" style={{ color: a.color || ANNOTATION_COLORS[a.type] }}>
                      {TYPE_LABELS[a.type]}
                    </span>
                    {a.resolved && (
                      <span className="text-xs text-text-muted bg-bg-alt px-1 py-0.5">Resolved</span>
                    )}
                  </div>
                  {editingId === a.id ? (
                    <div className="flex gap-2">
                      <input
                        className="flex-1 bg-bg-alt border border-border p-1 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-[#C108AB] rounded-none"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(a.id)}
                        autoFocus
                      />
                      <button onClick={() => handleSaveEdit(a.id)} className="p-1 hover:bg-bg rounded-none">
                        <Check className="w-4 h-4 text-green-500" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-1 hover:bg-bg rounded-none">
                        <X className="w-4 h-4 text-text-muted" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className={`text-sm text-text-primary ${a.type === 'highlight' ? 'italic' : ''}`}>
                        {a.type === 'redline' ? <span className="line-through">{a.content}</span> : a.content}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-text-muted">
                          {new Date(a.createdAt).toLocaleDateString()}
                        </span>
                        {a.sectionId !== 'general' && (
                          <span className="text-xs text-text-muted">Section: {a.sectionId}</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-start gap-1">
                  {editingId !== a.id && (
                    <>
                      <button
                        onClick={() => toggleResolved(a.id, !a.resolved)}
                        className="p-1 hover:bg-bg rounded-none"
                        title={a.resolved ? 'Mark unresolved' : 'Mark resolved'}
                      >
                        <Check className={`w-4 h-4 ${a.resolved ? 'text-green-500' : 'text-text-muted'}`} />
                      </button>
                      <button
                        onClick={() => handleStartEdit(a)}
                        className="p-1 hover:bg-bg rounded-none"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4 text-text-muted" />
                      </button>
                      <button
                        onClick={() => onDelete(a.id)}
                        className="p-1 hover:bg-red-500/10 rounded-none"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
