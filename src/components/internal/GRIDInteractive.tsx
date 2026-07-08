import React, { useState } from 'react';
import { Building2, User, X } from 'lucide-react';
import { MOCK_ORG_NODES } from '@/mocks/internalPortal';

export default function GRIDInteractive() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const companyNodes = MOCK_ORG_NODES.filter(n => n.type === 'company');
  const personNodes = MOCK_ORG_NODES.filter(n => n.type === 'person');
  const selectedNode = MOCK_ORG_NODES.find(n => n.id === selectedNodeId);

  // Connections: person -> company via company field
  const getConnectedCompany = (person: typeof MOCK_ORG_NODES[0]) =>
    companyNodes.find(c => c.name === person.company);

  return (
    <div className="space-y-4">
      <div className="flex gap-6">
        <div className="flex-1 relative">
          <div className="border border-bg-tertiary bg-bg-primary p-6 min-h-[400px]" style={{ borderRadius: 0 }}>
            {/* Company nodes row */}
            <div className="flex gap-4 mb-12 justify-center flex-wrap">
              {companyNodes.map(node => (
                <button
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`border-2 p-4 transition-colors text-center min-w-[160px] ${
                    selectedNodeId === node.id
                      ? 'border-[#C108AB] bg-[#C108AB]/5'
                      : 'border-bg-tertiary hover:border-[#C108AB]/40'
                  }`}
                  style={{ borderRadius: 0 }}
                >
                  <Building2 className="w-6 h-6 mx-auto mb-2 text-[#C108AB]" />
                  <div className="font-medium text-sm text-text-primary">{node.name}</div>
                  <div className="text-xs text-text-muted mt-1">{node.industry}</div>
                </button>
              ))}
            </div>

            {/* Connection lines (CSS borders) */}
            <div className="flex justify-center mb-4">
              <div className="w-px h-8 bg-bg-tertiary" />
            </div>

            {/* Person nodes row */}
            <div className="flex gap-4 justify-center flex-wrap">
              {personNodes.map(node => {
                const connected = getConnectedCompany(node);
                return (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`border p-3 transition-colors text-center min-w-[140px] ${
                      selectedNodeId === node.id
                        ? 'border-[#C108AB] bg-[#C108AB]/5'
                        : 'border-bg-tertiary hover:border-[#C108AB]/40'
                    }`}
                    style={{ borderRadius: 0 }}
                  >
                    <User className="w-4 h-4 mx-auto mb-1 text-text-muted" />
                    <div className="font-medium text-xs text-text-primary">{node.name}</div>
                    <div className="text-[10px] text-text-muted mt-0.5">{node.role}</div>
                    {connected && (
                      <div className="w-px h-4 bg-bg-tertiary mx-auto mt-2" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Details panel */}
        {selectedNode && (
          <div className="w-72 flex-shrink-0 border border-bg-tertiary bg-bg-primary p-4 self-start" style={{ borderRadius: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Details</span>
              <button onClick={() => setSelectedNodeId(null)} className="text-text-muted hover:text-text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-xs text-text-muted">Name</span>
                <p className="text-sm font-medium text-text-primary">{selectedNode.name}</p>
              </div>
              <div>
                <span className="text-xs text-text-muted">Type</span>
                <p className="text-sm text-text-primary capitalize">{selectedNode.type}</p>
              </div>
              {selectedNode.type === 'company' ? (
                <div>
                  <span className="text-xs text-text-muted">Industry</span>
                  <p className="text-sm text-text-primary">{selectedNode.industry}</p>
                </div>
              ) : (
                <>
                  <div>
                    <span className="text-xs text-text-muted">Role</span>
                    <p className="text-sm text-text-primary">{selectedNode.role}</p>
                  </div>
                  <div>
                    <span className="text-xs text-text-muted">Company</span>
                    <p className="text-sm text-text-primary">{selectedNode.company}</p>
                  </div>
                </>
              )}
              <div>
                <span className="text-xs text-text-muted">Relationships</span>
                <p className="text-sm text-text-primary">{selectedNode.relationships}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
