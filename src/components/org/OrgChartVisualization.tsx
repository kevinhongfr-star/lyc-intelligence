import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, MapPin, Building2, Star, Filter, X } from 'lucide-react';
import { Badge, Button, Input } from '@/components/ui';
import type { OrgNode } from '@/services/supabaseApi';

interface OrgChartVisualizationProps {
  nodes: OrgNode[];
  onNodeClick?: (node: OrgNode) => void;
  highlightPath?: OrgNode[];
  filters?: {
    department?: string;
    location?: string;
    minRelevance?: number;
    maxRelevance?: number;
  };
}

interface TreeNode {
  node: OrgNode;
  children: TreeNode[];
  x: number;
  y: number;
  width: number;
}

const NODE_WIDTH = 180;
const NODE_HEIGHT = 80;
const HORIZONTAL_GAP = 40;
const VERTICAL_GAP = 60;

export function OrgChartVisualization({
  nodes,
  onNodeClick,
  highlightPath = [],
  filters = {},
}: OrgChartVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [hoveredNode, setHoveredNode] = useState<OrgNode | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<{
    department: string;
    location: string;
    minRelevance: number;
    maxRelevance: number;
  }>({
    department: '',
    location: '',
    minRelevance: 1,
    maxRelevance: 5,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Get unique departments and locations for filters
  const departments = useMemo(() => {
    const set = new Set<string>();
    nodes.forEach(n => n.department && set.add(n.department));
    return Array.from(set).sort();
  }, [nodes]);

  const locations = useMemo(() => {
    const set = new Set<string>();
    nodes.forEach(n => n.location && set.add(n.location));
    return Array.from(set).sort();
  }, [nodes]);

  // Filter nodes
  const filteredNodes = useMemo(() => {
    return nodes.filter(node => {
      if (selectedFilters.department && node.department !== selectedFilters.department) return false;
      if (selectedFilters.location && node.location !== selectedFilters.location) return false;
      const relevance = node.talent_relevance ?? 3;
      if (relevance < selectedFilters.minRelevance || relevance > selectedFilters.maxRelevance) return false;
      return true;
    });
  }, [nodes, selectedFilters]);

  // Build tree structure
  const buildTree = useMemo(() => {
    const nodeMap = new Map<string, OrgNode>();
    filteredNodes.forEach(n => nodeMap.set(n.id, n));

    const getChildren = (parentId: string): TreeNode[] => {
      return filteredNodes
        .filter(n => n.reports_to === parentId)
        .map(n => ({
          node: n,
          children: getChildren(n.id),
          x: 0,
          y: 0,
          width: NODE_WIDTH,
        }));
    };

    const rootNodes = filteredNodes
      .filter(n => !n.reports_to || !nodeMap.has(n.reports_to))
      .map(n => ({
        node: n,
        children: getChildren(n.id),
        x: 0,
        y: 0,
        width: NODE_WIDTH,
      }));

    return rootNodes;
  }, [filteredNodes]);

  // Calculate positions for tree layout
  const layoutTree = (trees: TreeNode[]): { width: number; height: number } => {
    let maxWidth = 0;
    let maxHeight = 0;

    const calculatePositions = (tree: TreeNode, startX: number, depth: number): number => {
      tree.y = depth * (NODE_HEIGHT + VERTICAL_GAP);

      if (!expandedNodes.has(tree.node.id) || tree.children.length === 0) {
        tree.x = startX;
        tree.width = NODE_WIDTH;
        maxWidth = Math.max(maxWidth, startX + NODE_WIDTH);
        maxHeight = Math.max(maxHeight, tree.y + NODE_HEIGHT);
        return startX + NODE_WIDTH + HORIZONTAL_GAP;
      }

      let currentX = startX;
      tree.children.forEach(child => {
        currentX = calculatePositions(child, currentX, depth + 1);
      });

      const totalWidth = currentX - startX - HORIZONTAL_GAP;
      tree.x = startX + (totalWidth - NODE_WIDTH) / 2;
      tree.width = totalWidth;
      maxWidth = Math.max(maxWidth, currentX);
      maxHeight = Math.max(maxHeight, tree.y + NODE_HEIGHT);

      return currentX;
    };

    let currentX = 0;
    trees.forEach(tree => {
      currentX = calculatePositions(tree, currentX, 0);
    });

    return { width: maxWidth, height: maxHeight };
  };

  const { width, height } = useMemo(() => layoutTree(buildTree), [buildTree, expandedNodes]);

  // Initialize expanded nodes (expand root level)
  useEffect(() => {
    if (buildTree.length > 0 && expandedNodes.size === 0) {
      const initialExpanded = new Set<string>();
      buildTree.forEach(t => initialExpanded.add(t.node.id));
      setExpandedNodes(initialExpanded);
    }
  }, [buildTree]);

  const toggleExpand = (nodeId: string) => {
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

  const getRelevanceColor = (relevance: number | undefined) => {
    const r = relevance ?? 3;
    if (r >= 4) return '#22C55E';
    if (r === 3) return '#EAB308';
    return '#9CA3AF';
  };

  const isInHighlightPath = (node: OrgNode) => {
    return highlightPath.some(p => p.id === node.id);
  };

  const renderNode = (tree: TreeNode) => {
    const { node, children, x, y } = tree;
    const isExpanded = expandedNodes.has(node.id);
    const isInPath = isInHighlightPath(node);

    return (
      <g key={node.id}>
        {/* Connection lines to children */}
        {isExpanded && children.length > 0 && (
          <>
            {/* Vertical line from parent */}
            <line
              x1={x + NODE_WIDTH / 2}
              y1={y + NODE_HEIGHT}
              x2={x + NODE_WIDTH / 2}
              y2={y + NODE_HEIGHT + VERTICAL_GAP / 2}
              stroke="#E5E7EB"
              strokeWidth={2}
            />
            {/* Horizontal line connecting children */}
            {children.length > 1 && (
              <line
                x1={children[0].x + NODE_WIDTH / 2}
                y1={y + NODE_HEIGHT + VERTICAL_GAP / 2}
                x2={children[children.length - 1].x + NODE_WIDTH / 2}
                y2={y + NODE_HEIGHT + VERTICAL_GAP / 2}
                stroke="#E5E7EB"
                strokeWidth={2}
              />
            )}
            {/* Vertical lines to each child */}
            {children.map(child => (
              <line
                key={`line-${child.node.id}`}
                x1={child.x + NODE_WIDTH / 2}
                y1={y + NODE_HEIGHT + VERTICAL_GAP / 2}
                x2={child.x + NODE_WIDTH / 2}
                y2={child.y}
                stroke="#E5E7EB"
                strokeWidth={2}
              />
            ))}
          </>
        )}

        {/* Node rectangle */}
        <g
          transform={`translate(${x}, ${y})`}
          onClick={() => onNodeClick?.(node)}
          onMouseEnter={() => setHoveredNode(node)}
          onMouseLeave={() => setHoveredNode(null)}
          style={{ cursor: onNodeClick ? 'pointer' : 'default' }}
        >
          <rect
            width={NODE_WIDTH}
            height={NODE_HEIGHT}
            rx={8}
            fill={isInPath ? '#F0FDF4' : '#FFFFFF'}
            stroke={isInPath ? '#22C55E' : '#E5E7EB'}
            strokeWidth={isInPath ? 2 : 1}
            className="transition-all duration-200"
            style={{
              filter: hoveredNode?.id === node.id ? 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' : 'none',
            }}
          />

          {/* Relevance indicator */}
          <rect
            x={NODE_WIDTH - 12}
            y={8}
            width={8}
            height={8}
            rx={4}
            fill={getRelevanceColor(node.talent_relevance)}
          />

          {/* Name */}
          <text
            x={12}
            y={24}
            fontSize={14}
            fontWeight={600}
            fill="#1F2937"
            className="truncate"
          >
            {node.name || 'Unnamed'}
          </text>

          {/* Title */}
          <text
            x={12}
            y={42}
            fontSize={12}
            fill="#6B7280"
          >
            {node.title || 'No title'}
          </text>

          {/* Department/Location */}
          {(node.department || node.location) && (
            <text
              x={12}
              y={60}
              fontSize={10}
              fill="#9CA3AF"
            >
              {node.department && node.location 
                ? `${node.department} • ${node.location}`
                : node.department || node.location}
            </text>
          )}

          {/* Expand/collapse button */}
          {children.length > 0 && (
            <g
              transform={`translate(${NODE_WIDTH / 2 - 12}, ${NODE_HEIGHT - 8})`}
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node.id);
              }}
              style={{ cursor: 'pointer' }}
            >
              <circle
                r={12}
                fill="#F3F4F6"
                stroke="#E5E7EB"
              />
              {isExpanded ? (
                <ChevronUp
                  x={-6}
                  y={-6}
                  width={12}
                  height={12}
                  color="#6B7280"
                />
              ) : (
                <ChevronDown
                  x={-6}
                  y={-6}
                  width={12}
                  height={12}
                  color="#6B7280"
                />
              )}
            </g>
          )}
        </g>

        {/* Render children */}
        {isExpanded && children.map(child => renderNode(child))}
      </g>
    );
  };

  // Tooltip for hovered node
  const Tooltip = () => {
    if (!hoveredNode) return null;

    return (
      <div
        className="absolute bg-card rounded-none border border-card-border p-4 shadow-lg z-10"
        style={{
          left: '50%',
          top: '20px',
          transform: 'translateX(-50%)',
          maxWidth: '300px',
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: getRelevanceColor(hoveredNode.talent_relevance) }}
          />
          <span className="font-semibold text-text-primary">{hoveredNode.name}</span>
        </div>
        <div className="text-sm text-text-muted space-y-1">
          <div><strong>Title:</strong> {hoveredNode.title || 'N/A'}</div>
          <div><strong>Department:</strong> {hoveredNode.department || 'N/A'}</div>
          <div><strong>Location:</strong> {hoveredNode.location || 'N/A'}</div>
          <div>
            <strong>Relevance:</strong> 
            <Badge 
              variant={(hoveredNode.talent_relevance ?? 3) >= 4 ? 'success' : hoveredNode.talent_relevance === 3 ? 'warning' : 'default'}
              className="ml-2"
            >
              {hoveredNode.talent_relevance ?? 3}/5
            </Badge>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-card rounded-none border border-card-border overflow-hidden">
      {/* Header with filters */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-text-primary">
            Organization Structure
          </h3>
          <Badge variant="default">
            {filteredNodes.length} positions
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          {/* Zoom controls */}
          <div className="flex items-center gap-2 bg-bg-alt rounded-none px-2 py-1">
            <button
              onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
              className="p-1 hover:bg-bg rounded text-text-muted"
            >
              −
            </button>
            <span className="text-sm text-text-muted w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(z => Math.min(2, z + 0.1))}
              className="p-1 hover:bg-bg rounded text-text-muted"
            >
              +
            </button>
          </div>

          {/* Filter toggle */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-1" />
            Filters
            {(selectedFilters.department || selectedFilters.location || 
              selectedFilters.minRelevance !== 1 || selectedFilters.maxRelevance !== 5) && (
              <Badge variant="default" className="ml-2">Active</Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="p-4 bg-bg-alt border-b border-border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                <Building2 className="w-4 h-4 inline mr-1" />
                Department
              </label>
              <select
                value={selectedFilters.department}
                onChange={(e) => setSelectedFilters(prev => ({ ...prev, department: e.target.value }))}
                className="w-full px-3 py-2 bg-bg border border-border rounded-none text-text-primary"
              >
                <option value="">All Departments</option>
                {departments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Location
              </label>
              <select
                value={selectedFilters.location}
                onChange={(e) => setSelectedFilters(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 bg-bg border border-border rounded-none text-text-primary"
              >
                <option value="">All Locations</option>
                {locations.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                <Star className="w-4 h-4 inline mr-1" />
                Min Relevance
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(level => (
                  <button
                    key={level}
                    onClick={() => setSelectedFilters(prev => ({ ...prev, minRelevance: level }))}
                    className={`w-8 h-8 rounded border flex items-center justify-center ${
                      selectedFilters.minRelevance === level
                        ? 'border-accent bg-accent/10'
                        : 'border-border'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Max Relevance
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(level => (
                  <button
                    key={level}
                    onClick={() => setSelectedFilters(prev => ({ ...prev, maxRelevance: level }))}
                    className={`w-8 h-8 rounded border flex items-center justify-center ${
                      selectedFilters.maxRelevance === level
                        ? 'border-accent bg-accent/10'
                        : 'border-border'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Clear filters */}
          {(selectedFilters.department || selectedFilters.location || 
            selectedFilters.minRelevance !== 1 || selectedFilters.maxRelevance !== 5) && (
            <button
              onClick={() => setSelectedFilters({
                department: '',
                location: '',
                minRelevance: 1,
                maxRelevance: 5,
              })}
              className="mt-4 text-sm text-accent hover:text-accent-hover flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* SVG visualization */}
      <div 
        ref={containerRef}
        className="relative overflow-auto bg-bg"
        style={{ minHeight: '400px', maxHeight: '600px' }}
      >
        <Tooltip />
        
        {filteredNodes.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-text-muted">
            <Building2 className="w-12 h-12 mr-3 opacity-50" />
            <div>
              <p className="font-medium">No positions to display</p>
              <p className="text-sm">Adjust filters or add positions to the org chart</p>
            </div>
          </div>
        ) : (
          <svg
            width={Math.max(width * zoom, containerRef.current?.clientWidth || 800)}
            height={Math.max(height * zoom + 100, 400)}
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
            }}
          >
            <g transform={`translate(${HORIZONTAL_GAP}, ${HORIZONTAL_GAP})`}>
              {buildTree.map(tree => renderNode(tree))}
            </g>
          </svg>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 p-4 bg-bg-alt border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm text-text-muted">High relevance (4-5)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-sm text-text-muted">Moderate (3)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-400" />
          <span className="text-sm text-text-muted">Low (1-2)</span>
        </div>
      </div>
    </div>
  );
}