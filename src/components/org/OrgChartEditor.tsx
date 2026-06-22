import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronDown, ChevronRight, Plus, Trash2, Edit2, Save, X,
  Building2, MapPin, User, Star, AlertCircle, Loader2
} from 'lucide-react';
import { Button, Input, Badge } from '@/components/ui';
import { OrgChartVisualization } from './OrgChartVisualization';
import type { OrgNode, OrgChartData } from '@/services/supabaseApi';

interface OrgChartEditorProps {
  companyId: string;
  companyName: string;
  initialData?: OrgChartData;
  onSave: (data: OrgChartData) => Promise<void>;
}

export function OrgChartEditor({ companyId, companyName, initialData, onSave }: OrgChartEditorProps) {
  const [nodes, setNodes] = useState<OrgNode[]>(initialData?.nodes || []);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [editingNode, setEditingNode] = useState<OrgNode | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'visualize'>('edit');

  // Auto-save on changes
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (nodes.length > 0 && JSON.stringify(nodes) !== JSON.stringify(initialData?.nodes || [])) {
        handleAutoSave();
      }
    }, 2000);
    return () => clearTimeout(timeout);
  }, [nodes]);

  const handleAutoSave = async () => {
    setSaving(true);
    try {
      await onSave({ nodes });
      setError(null);
    } catch (err) {
      console.error('Auto-save error:', err);
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const generateId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addNode = (parentId: string | null = null) => {
    const newNode: OrgNode = {
      id: generateId(),
      name: 'New Position',
      title: '',
      department: '',
      location: '',
      reports_to: parentId,
      talent_relevance: 3,
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
    setEditingNode(newNode);
    if (parentId) {
      setExpandedNodes(prev => new Set([...prev, parentId]));
    }
  };

  const updateNode = (nodeId: string, updates: Partial<OrgNode>) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, ...updates } : node
    ));
    if (editingNode?.id === nodeId) {
      setEditingNode(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const deleteNode = (nodeId: string) => {
    // Also delete all children
    const nodesToDelete = new Set<string>();
    const collectChildren = (parentId: string) => {
      nodesToDelete.add(parentId);
      nodes.forEach(node => {
        if (node.reports_to === parentId) {
          collectChildren(node.id);
        }
      });
    };
    collectChildren(nodeId);

    setNodes(prev => prev.filter(node => !nodesToDelete.has(node.id)));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
      setEditingNode(null);
    }
  };

  const moveNode = (nodeId: string, newParentId: string | null) => {
    // Prevent moving to self or descendant
    const descendants = new Set<string>();
    const collectDescendants = (parentId: string) => {
      nodes.forEach(node => {
        if (node.reports_to === parentId) {
          descendants.add(node.id);
          collectDescendants(node.id);
        }
      });
    };
    collectDescendants(nodeId);

    if (newParentId === nodeId || descendants.has(newParentId || '')) {
      setError('Cannot move node to itself or its descendant');
      return;
    }

    updateNode(nodeId, { reports_to: newParentId });
  };

  const getRootNodes = () => nodes.filter(node => !node.reports_to);
  
  const getChildNodes = (parentId: string) => nodes.filter(node => node.reports_to === parentId);

  const toggleExpanded = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const getNodePath = (nodeId: string): OrgNode[] => {
    const path: OrgNode[] = [];
    let current = nodes.find(n => n.id === nodeId);
    while (current) {
      path.unshift(current);
      const parentId = current.reports_to;
      current = parentId ? nodes.find(n => n.id === parentId) : undefined;
    }
    return path;
  };

  const getRelevanceColor = (relevance: number | undefined) => {
    const r = relevance ?? 3;
    if (r >= 4) return '#22C55E';
    if (r === 3) return '#EAB308';
    return '#9CA3AF';
  };

  const getRelevanceLabel = (relevance: number | undefined) => {
    const r = relevance ?? 3;
    if (r >= 5) return 'Critical';
    if (r === 4) return 'High';
    if (r === 3) return 'Moderate';
    if (r === 2) return 'Low';
    return 'Minimal';
  };

  const TreeNode = ({ node, depth = 0 }: { node: OrgNode; depth?: number }) => {
    const children = getChildNodes(node.id);
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNodeId === node.id;

    return (
      <div className="select-none">
        <div
          className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-all ${
            isSelected 
              ? 'bg-accent/10 border border-accent/30' 
              : 'hover:bg-bg-alt'
          }`}
          style={{ marginLeft: depth * 24 }}
          onClick={() => {
            setSelectedNodeId(node.id);
            if (!editingNode) {
              setEditingNode(node);
            }
          }}
        >
          {children.length > 0 ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(node.id);
              }}
              className="p-0.5 hover:bg-bg-alt rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-text-muted" />
              ) : (
                <ChevronRight className="w-4 h-4 text-text-muted" />
              )}
            </button>
          ) : (
            <div className="w-5 h-5" />
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-text-primary truncate">
                {node.name || 'Unnamed'}
              </span>
              {node.title && (
                <span className="text-sm text-text-muted truncate">
                  — {node.title}
                </span>
              )}
            </div>
            {node.department && (
              <div className="text-xs text-text-muted">{node.department}</div>
            )}
          </div>

          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: getRelevanceColor(node.talent_relevance) }}
          />

          <button
            onClick={(e) => {
              e.stopPropagation();
              addNode(node.id);
            }}
            className="p-1 hover:bg-accent/10 rounded text-text-muted hover:text-accent"
          >
            <Plus className="w-4 h-4" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteNode(node.id);
            }}
            className="p-1 hover:bg-red-500/10 rounded text-text-muted hover:text-red-500"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {isExpanded && children.length > 0 && (
          <div className="mt-1">
            {children.map(child => (
              <TreeNode key={child.id} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const NodeForm = () => {
    if (!editingNode) return null;

    const potentialParents = nodes.filter(n => n.id !== editingNode.id);
    const path = getNodePath(editingNode.id);

    return (
      <div className="bg-card rounded-xl border border-card-border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-text-primary">
            Edit Position
          </h3>
          <button
            onClick={() => setEditingNode(null)}
            className="p-2 hover:bg-bg-alt rounded-lg"
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        {/* Path breadcrumb */}
        {path.length > 1 && (
          <div className="flex items-center gap-1 mb-4 text-sm text-text-muted overflow-x-auto">
            {path.slice(0, -1).map((p, i) => (
              <React.Fragment key={p.id}>
                <span>{p.name}</span>
                {i < path.length - 2 && <ChevronRight className="w-4 h-4" />}
              </React.Fragment>
            ))}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Name *
            </label>
            <Input
              value={editingNode.name}
              onChange={(e) => updateNode(editingNode.id, { name: e.target.value })}
              placeholder="Person's name"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Title *
            </label>
            <Input
              value={editingNode.title}
              onChange={(e) => updateNode(editingNode.id, { title: e.target.value })}
              placeholder="Job title"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              <Building2 className="w-4 h-4 inline mr-1" />
              Department
            </label>
            <Input
              value={editingNode.department}
              onChange={(e) => updateNode(editingNode.id, { department: e.target.value })}
              placeholder="e.g., Engineering, Sales"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Location
            </label>
            <Input
              value={editingNode.location}
              onChange={(e) => updateNode(editingNode.id, { location: e.target.value })}
              placeholder="e.g., New York, London"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Reports To
            </label>
            <select
              value={editingNode.reports_to || ''}
              onChange={(e) => updateNode(editingNode.id, { reports_to: e.target.value || null })}
              className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">None (Root/CEO)</option>
              {potentialParents.map(parent => (
                <option key={parent.id} value={parent.id}>
                  {parent.name} — {parent.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              <Star className="w-4 h-4 inline mr-1" />
              Talent Relevance (1-5)
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map(level => (
                <button
                  key={level}
                  onClick={() => updateNode(editingNode.id, { talent_relevance: level })}
                  className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center font-medium transition-all ${
                    editingNode.talent_relevance === level
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border hover:border-accent/50 text-text-muted'
                  }`}
                  style={{
                    borderColor: editingNode.talent_relevance === level 
                      ? getRelevanceColor(level) 
                      : undefined
                  }}
                >
                  {level}
                </button>
              ))}
            </div>
            <p className="mt-2 text-sm text-text-muted">
              {getRelevanceLabel(editingNode.talent_relevance)} relevance to mandate
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-bg rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">
            Org Chart: {companyName}
          </h2>
          <p className="text-sm text-text-muted mt-1">
            {nodes.length} positions • {getRootNodes().length} root level
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saving && (
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-500">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="flex bg-bg-alt rounded-lg p-1">
            <button
              onClick={() => setViewMode('edit')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'edit'
                  ? 'bg-accent text-white'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Edit
            </button>
            <button
              onClick={() => setViewMode('visualize')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'visualize'
                  ? 'bg-accent text-white'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Visualize
            </button>
          </div>

          <Button onClick={() => addNode()}>
            <Plus className="w-4 h-4 mr-1" />
            Add Root
          </Button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'edit' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          {/* Tree View */}
          <div className="bg-card rounded-xl border border-card-border p-4">
            <h3 className="text-sm font-medium text-text-muted mb-4">
              Organization Tree
            </h3>
            <div className="max-h-[600px] overflow-y-auto">
              {getRootNodes().length === 0 ? (
                <div className="text-center py-8 text-text-muted">
                  <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No positions added yet</p>
                  <p className="text-sm mt-1">Click "Add Root" to start building the org chart</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {getRootNodes().map(root => (
                    <TreeNode key={root.id} node={root} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Node Form */}
          <div>
            {editingNode ? (
              <NodeForm />
            ) : (
              <div className="bg-card rounded-xl border border-card-border p-8 text-center">
                <User className="w-12 h-12 mx-auto mb-3 text-text-muted opacity-50" />
                <p className="text-text-muted">Select a position to edit</p>
                <p className="text-sm mt-1">Or add a new position from the tree</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-6">
          <OrgChartVisualization
            nodes={nodes}
            onNodeClick={(node) => {
              setSelectedNodeId(node.id);
              setEditingNode(node);
              setViewMode('edit');
            }}
            highlightPath={selectedNodeId ? getNodePath(selectedNodeId) : undefined}
          />
        </div>
      )}
    </div>
  );
}