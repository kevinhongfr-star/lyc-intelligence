/**
 * ShiftDataModelPage.tsx — Issue #18
 * SHIFT Composite Data Model visualization and management
 */
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Database,
  Layers,
  GitBranch,
  BarChart3,
  Target,
  Zap,
  ChevronRight,
  ArrowRightLeft,
  Table2,
} from 'lucide-react';

interface DataEntity {
  id: string;
  name: string;
  type: 'core' | 'composite' | 'derived' | 'external';
  description: string;
  fields: number;
  relations: number;
  records: number;
  lastSync: string;
}

interface Relation {
  from: string;
  to: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  field: string;
}

const ENTITIES: DataEntity[] = [
  { id: 'contacts', name: 'Contacts', type: 'core', description: 'Candidate and professional profiles', fields: 48, relations: 12, records: 15240, lastSync: '2026-07-20T08:00:00Z' },
  { id: 'mandates', name: 'Mandates', type: 'core', description: 'Client search assignments', fields: 32, relations: 8, records: 340, lastSync: '2026-07-20T08:00:00Z' },
  { id: 'companies', name: 'Companies', type: 'core', description: 'Client and target organizations', fields: 28, relations: 6, records: 5200, lastSync: '2026-07-20T08:00:00Z' },
  { id: 'shift_scores', name: 'SHIFT Scores', type: 'composite', description: 'Composite capability and potential scores', fields: 24, relations: 4, records: 12400, lastSync: '2026-07-20T07:30:00Z' },
  { id: 'trident_scores', name: 'TRIDENT Scores', type: 'composite', description: 'Capability × Character × Culture fit', fields: 18, relations: 3, records: 11800, lastSync: '2026-07-20T07:30:00Z' },
  { id: 'movement_signals', name: 'Movement Signals', type: 'derived', description: 'Inferred career change probability', fields: 14, relations: 2, records: 8900, lastSync: '2026-07-20T06:00:00Z' },
  { id: 'engagement_scores', name: 'Engagement Scores', type: 'derived', description: 'Interaction and responsiveness scoring', fields: 12, relations: 2, records: 15240, lastSync: '2026-07-20T06:00:00Z' },
  { id: 'market_signals', name: 'Market Signals', type: 'external', description: 'External market intelligence feeds', fields: 22, relations: 5, records: 4500, lastSync: '2026-07-20T05:00:00Z' },
];

const RELATIONS: Relation[] = [
  { from: 'contacts', to: 'shift_scores', type: 'one-to-one', field: 'contact_id' },
  { from: 'contacts', to: 'trident_scores', type: 'one-to-one', field: 'contact_id' },
  { from: 'contacts', to: 'movement_signals', type: 'one-to-many', field: 'contact_id' },
  { from: 'contacts', to: 'engagement_scores', type: 'one-to-one', field: 'contact_id' },
  { from: 'mandates', to: 'companies', type: 'many-to-many', field: 'company_id' },
  { from: 'market_signals', to: 'companies', type: 'many-to-many', field: 'companies_related' },
];

const typeColors: Record<string, string> = {
  core: 'bg-blue-50 text-blue-700 border-blue-200',
  composite: 'bg-purple-50 text-purple-700 border-purple-200',
  derived: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  external: 'bg-amber-50 text-amber-700 border-amber-200',
};

export function ShiftDataModelPage() {
  const [selectedEntity, setSelectedEntity] = useState<DataEntity | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'relations'>('grid');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-purple-600" />
            SHIFT Composite Data Model
          </h1>
          <p className="text-sm text-gray-500 mt-1">Unified talent intelligence data architecture</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="gap-1"
          >
            <Table2 className="w-3 h-3" />
            Entities
          </Button>
          <Button
            variant={viewMode === 'relations' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('relations')}
            className="gap-1"
          >
            <GitBranch className="w-3 h-3" />
            Relations
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg"><Database className="w-5 h-5 text-blue-600" /></div>
          <div>
            <div className="text-2xl font-bold">{ENTITIES.length}</div>
            <div className="text-xs text-gray-500">Data Entities</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-lg"><BarChart3 className="w-5 h-5 text-purple-600" /></div>
          <div>
            <div className="text-2xl font-bold">{ENTITIES.reduce((s, e) => s + e.records, 0).toLocaleString()}</div>
            <div className="text-xs text-gray-500">Total Records</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-lg"><Target className="w-5 h-5 text-emerald-600" /></div>
          <div>
            <div className="text-2xl font-bold">{RELATIONS.length}</div>
            <div className="text-xs text-gray-500">Relations</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-amber-50 rounded-lg"><Zap className="w-5 h-5 text-amber-600" /></div>
          <div>
            <div className="text-2xl font-bold">{ENTITIES.filter(e => e.type === 'composite' || e.type === 'derived').length}</div>
            <div className="text-xs text-gray-500">Computed Models</div>
          </div>
        </Card>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ENTITIES.map(entity => (
            <Card
              key={entity.id}
              className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${selectedEntity?.id === entity.id ? 'ring-2 ring-purple-500' : ''}`}
              onClick={() => setSelectedEntity(entity)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-sm">{entity.name}</span>
                </div>
                <Badge className={`text-[10px] ${typeColors[entity.type]}`}>{entity.type}</Badge>
              </div>
              <p className="text-xs text-gray-500 mt-2">{entity.description}</p>
              <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-sm font-semibold">{entity.fields}</div>
                  <div className="text-[10px] text-gray-500">Fields</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-sm font-semibold">{entity.relations}</div>
                  <div className="text-[10px] text-gray-500">Relations</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-sm font-semibold">{(entity.records / 1000).toFixed(1)}k</div>
                  <div className="text-[10px] text-gray-500">Records</div>
                </div>
              </div>
              <div className="text-[10px] text-gray-400 mt-2">
                Last sync: {new Date(entity.lastSync).toLocaleString()}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6">
          <h3 className="text-sm font-medium mb-4">Entity Relations</h3>
          <div className="space-y-3">
            {RELATIONS.map((rel, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Badge variant="outline" className="text-xs font-medium min-w-[100px] justify-center">{rel.from}</Badge>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <ArrowRightLeft className="w-3 h-3" />
                  {rel.type}
                </div>
                <Badge variant="outline" className="text-xs font-medium min-w-[100px] justify-center">{rel.to}</Badge>
                <div className="text-xs text-gray-400 ml-auto">via {rel.field}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {selectedEntity && (
        <Card className="p-4 border-purple-200 bg-purple-50/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" />
              <span className="font-medium text-sm">{selectedEntity.name}</span>
              <Badge className={`text-[10px] ${typeColors[selectedEntity.type]}`}>{selectedEntity.type}</Badge>
            </div>
            <button onClick={() => setSelectedEntity(null)} className="text-xs text-gray-500 hover:text-gray-700">Close</button>
          </div>
          <p className="text-xs text-gray-600 mt-2">{selectedEntity.description}</p>
          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1">
              <Database className="w-3 h-3" />
              View Schema
            </Button>
            <Button size="sm" variant="outline" className="gap-1">
              <BarChart3 className="w-3 h-3" />
              Data Quality
            </Button>
            <Button size="sm" variant="outline" className="gap-1">
              <Zap className="w-3 h-3" />
              Trigger Sync
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
