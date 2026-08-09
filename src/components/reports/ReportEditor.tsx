import React, { useState, useCallback } from 'react';
import { Save, X, Plus, Trash2, MoveUp, MoveDown, Edit3, Type, Table, BarChart3, Loader2 } from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import type { ReportData, ReportSection, ReportTable } from '@/services/reportService';

interface ReportEditorProps {
  report: ReportData;
  onSave: (updates: Partial<ReportData>) => Promise<void>;
  onClose: () => void;
  onAutoSave?: () => void;
}

type InsertType = 'section' | 'table' | 'chart';

export function ReportEditor({ report, onSave, onClose, onAutoSave }: ReportEditorProps) {
  const [draft, setDraft] = useState<ReportData>(report);
  const [activeTab, setActiveTab] = useState<'content' | 'header' | 'footer'>('content');
  const [saving, setSaving] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingTable, setEditingTable] = useState<string | null>(null);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await onSave({
        sections: draft.sections,
        tables: draft.tables,
        charts: draft.charts,
        title: draft.title,
        header: draft.header,
        footer: draft.footer,
      });
    } finally {
      setSaving(false);
    }
  }, [draft, onSave]);

  const updateSection = (id: string, updates: Partial<ReportSection>) => {
    setDraft((d) => ({
      ...d,
      sections: d.sections.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
  };

  const updateTable = (id: string, updates: Partial<ReportTable>) => {
    setDraft((d) => ({
      ...d,
      tables: d.tables.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  };

  const deleteSection = (id: string) => {
    setDraft((d) => ({ ...d, sections: d.sections.filter((s) => s.id !== id) }));
  };

  const deleteTable = (id: string) => {
    setDraft((d) => ({ ...d, tables: d.tables.filter((t) => t.id !== id) }));
  };

  const moveSection = (id: string, direction: 'up' | 'down') => {
    setDraft((d) => {
      const sections = [...d.sections].sort((a, b) => a.order - b.order);
      const idx = sections.findIndex((s) => s.id === id);
      if (idx < 0) return d;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= sections.length) return d;
      const [item] = sections.splice(idx, 1);
      sections.splice(newIdx, 0, item);
      sections.forEach((s, i) => (s.order = i));
      return { ...d, sections };
    });
  };

  const addSection = () => {
    const id = `s_${Date.now()}`;
    setDraft((d) => ({
      ...d,
      sections: [...d.sections, { id, title: 'New Section', content: 'Add content here...', order: d.sections.length }],
    }));
    setEditingSection(id);
  };

  const addTable = () => {
    const id = `t_${Date.now()}`;
    setDraft((d) => ({
      ...d,
      tables: [
        ...d.tables,
        {
          id,
          title: 'New Table',
          headers: ['Column 1', 'Column 2'],
          rows: [['Value 1', 'Value 2']],
        },
      ],
    }));
    setEditingTable(id);
  };

  const renderContent = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="outline" size="sm" onClick={addSection}>
          <Plus className="w-4 h-4 mr-1" />
          Add Section
        </Button>
        <Button variant="outline" size="sm" onClick={addTable}>
          <Table className="w-4 h-4 mr-1" />
          Add Table
        </Button>
      </div>

      {draft.sections.map((section) => (
        <div key={section.id} className="bg-bg border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-[#C108AB]" />
              <input
                className="text-lg font-semibold bg-transparent border-none text-text-primary focus:outline-none focus:ring-1 focus:ring-[#C108AB] px-1"
                value={section.title}
                onChange={(e) => updateSection(section.id, { title: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => moveSection(section.id, 'up')} className="p-1 hover:bg-bg-alt" title="Move up">
                <MoveUp className="w-4 h-4 text-text-muted" />
              </button>
              <button onClick={() => moveSection(section.id, 'down')} className="p-1 hover:bg-bg-alt" title="Move down">
                <MoveDown className="w-4 h-4 text-text-muted" />
              </button>
              <button onClick={() => setEditingSection(editingSection === section.id ? null : section.id)} className="p-1 hover:bg-bg-alt" title="Edit">
                <Edit3 className="w-4 h-4 text-text-muted" />
              </button>
              <button onClick={() => deleteSection(section.id)} className="p-1 hover:bg-red-500/10" title="Delete">
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          </div>
          {editingSection === section.id ? (
            <textarea
              className="w-full bg-bg-alt border border-border p-3 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-[#C108AB] resize-y min-h-[120px]"
              value={section.content}
              onChange={(e) => updateSection(section.id, { content: e.target.value })}
            />
          ) : (
            <p className="text-sm text-text-muted whitespace-pre-wrap">{section.content}</p>
          )}
        </div>
      ))}

      {draft.tables.map((table) => (
        <div key={table.id} className="bg-bg border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-[#C108AB]" />
              <input
                className="text-lg font-semibold bg-transparent border-none text-text-primary focus:outline-none focus:ring-1 focus:ring-[#C108AB] px-1"
                value={table.title}
                onChange={(e) => updateTable(table.id, { title: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setEditingTable(editingTable === table.id ? null : table.id)} className="p-1 hover:bg-bg-alt">
                <Edit3 className="w-4 h-4 text-text-muted" />
              </button>
              <button onClick={() => deleteTable(table.id)} className="p-1 hover:bg-red-500/10">
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          </div>
          {editingTable === table.id ? (
            <div className="space-y-2">
              <div className="flex gap-2 mb-2">
                <input
                  className="flex-1 bg-bg-alt border border-border p-2 text-sm text-text-primary"
                  value={table.headers.join(',')}
                  onChange={(e) => updateTable(table.id, { headers: e.target.value.split(',').map((h) => h.trim()) })}
                  placeholder="Headers (comma separated)"
                />
              </div>
              <textarea
                className="w-full bg-bg-alt border border-border p-2 text-sm text-text-primary font-mono"
                value={table.rows.map((r) => r.join('|')).join('\n')}
                onChange={(e) => {
                  const rows = e.target.value.split('\n').map((line) => line.split('|'));
                  updateTable(table.id, { rows });
                }}
                rows={table.rows.length}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {table.headers.map((h, i) => (
                      <th key={i} className="bg-[#1E1E1E] text-[#C108AB] text-left px-3 py-2 text-xs font-semibold border border-[#C108AB]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row, ri) => (
                    <tr key={ri} className={ri % 2 === 0 ? 'bg-[#141414]' : 'bg-[#191919]'}>
                      {row.map((cell, ci) => (
                        <td key={ci} className="text-text-primary px-3 py-2 text-xs border border-[#333]">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderHeaderEditor = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">Report Title</label>
        <input
          className="w-full bg-bg border border-border p-3 text-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-[#C108AB]"
          value={draft.header.title}
          onChange={(e) => setDraft({ ...draft, header: { ...draft.header, title: e.target.value } })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">Subtitle</label>
        <input
          className="w-full bg-bg border border-border p-3 text-text-primary focus:outline-none focus:ring-1 focus:ring-[#C108AB]"
          value={draft.header.subtitle || ''}
          onChange={(e) => setDraft({ ...draft, header: { ...draft.header, subtitle: e.target.value } })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">Report Date</label>
        <input
          type="date"
          className="w-full bg-bg border border-border p-3 text-text-primary focus:outline-none focus:ring-1 focus:ring-[#C108AB]"
          value={draft.header.reportDate || ''}
          onChange={(e) => setDraft({ ...draft, header: { ...draft.header, reportDate: e.target.value } })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">Classification</label>
        <select
          className="w-full bg-bg border border-border p-3 text-text-primary focus:outline-none focus:ring-1 focus:ring-[#C108AB]"
          value={draft.header.classification || 'confidential'}
          onChange={(e) => setDraft({ ...draft, header: { ...draft.header, classification: e.target.value as any } })}
        >
          <option value="confidential">Confidential</option>
          <option value="internal">Internal</option>
          <option value="public">Public</option>
        </select>
      </div>
    </div>
  );

  const renderFooterEditor = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">Footer Text</label>
        <input
          className="w-full bg-bg border border-border p-3 text-text-primary focus:outline-none focus:ring-1 focus:ring-[#C108AB]"
          value={draft.footer.text || ''}
          onChange={(e) => setDraft({ ...draft, footer: { ...draft.footer, text: e.target.value } })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">Company Name</label>
        <input
          className="w-full bg-bg border border-border p-3 text-text-primary focus:outline-none focus:ring-1 focus:ring-[#C108AB]"
          value={draft.footer.companyName || ''}
          onChange={(e) => setDraft({ ...draft, footer: { ...draft.footer, companyName: e.target.value } })}
        />
      </div>
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="pageNumbers"
          checked={draft.footer.pageNumbers || false}
          onChange={(e) => setDraft({ ...draft, footer: { ...draft.footer, pageNumbers: e.target.checked } })}
        />
        <label htmlFor="pageNumbers" className="text-sm text-text-primary">Show page numbers</label>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-bg">
      <div className="flex items-center justify-between p-4 border-b border-border bg-bg-alt">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 hover:bg-bg">
            <X className="w-5 h-5 text-text-muted" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-text-primary">Edit Report</h1>
            <p className="text-sm text-text-muted">{report.templateName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onAutoSave && (
            <Button variant="outline" size="sm" onClick={onAutoSave}>
              Auto-save
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="flex border-b border-border">
        {(['content', 'header', 'footer'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab ? 'text-[#C108AB] border-b-2 border-[#C108AB]' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'content' && renderContent()}
        {activeTab === 'header' && renderHeaderEditor()}
        {activeTab === 'footer' && renderFooterEditor()}
      </div>
    </div>
  );
}
