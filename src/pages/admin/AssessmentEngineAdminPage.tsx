/**
 * AssessmentEngineAdminPage.tsx — Issue #20
 * Online Diagnostic Assessment Engine configuration and monitoring
 */
import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  ClipboardList,
  Brain,
  BarChart3,
  Users,
  CheckCircle2,
  AlertCircle,
  Settings,
  Play,
  Plus,
  TrendingUp,
  Clock,
} from 'lucide-react';

interface AssessmentConfig {
  id: string;
  name: string;
  type: 'trident' | 'shift' | 'diagnostic' | 'skills' | 'culture';
  status: 'active' | 'draft' | 'archived';
  questions: number;
  avgDuration: string;
  completions: number;
  passRate: number;
  lastUpdated: string;
}

const ASSESSMENTS: AssessmentConfig[] = [
  { id: 'a1', name: 'TRIDENT Executive Assessment', type: 'trident', status: 'active', questions: 45, avgDuration: '25 min', completions: 840, passRate: 72, lastUpdated: '2026-07-15' },
  { id: 'a2', name: 'SHIFT Composite Diagnostic', type: 'shift', status: 'active', questions: 32, avgDuration: '18 min', completions: 620, passRate: 68, lastUpdated: '2026-07-10' },
  { id: 'a3', name: 'Technical Skills Evaluation', type: 'skills', status: 'active', questions: 28, avgDuration: '30 min', completions: 340, passRate: 55, lastUpdated: '2026-07-05' },
  { id: 'a4', name: 'Culture Fit Assessment', type: 'culture', status: 'draft', questions: 20, avgDuration: '12 min', completions: 0, passRate: 0, lastUpdated: '2026-07-18' },
  { id: 'a5', name: 'Leadership Diagnostic', type: 'diagnostic', status: 'active', questions: 36, avgDuration: '22 min', completions: 410, passRate: 65, lastUpdated: '2026-06-28' },
];

const typeColors: Record<string, string> = {
  trident: 'bg-blue-50 text-blue-700 border-blue-200',
  shift: 'bg-purple-50 text-purple-700 border-purple-200',
  diagnostic: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  skills: 'bg-amber-50 text-amber-700 border-amber-200',
  culture: 'bg-pink-50 text-pink-700 border-pink-200',
};

export function AssessmentEngineAdminPage() {
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentConfig | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const totalCompletions = ASSESSMENTS.reduce((s, a) => s + a.completions, 0);
  const avgPassRate = Math.round(ASSESSMENTS.filter(a => a.status === 'active').reduce((s, a) => s + a.passRate, 0) / ASSESSMENTS.filter(a => a.status === 'active').length);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Assessment Engine</h1>
          <p className="text-sm text-gray-500 mt-1">Configure and monitor diagnostic assessments</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Assessment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg"><ClipboardList className="w-5 h-5 text-blue-600" /></div>
          <div>
            <div className="text-2xl font-bold">{ASSESSMENTS.length}</div>
            <div className="text-xs text-gray-500">Assessments</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-lg"><Users className="w-5 h-5 text-purple-600" /></div>
          <div>
            <div className="text-2xl font-bold">{totalCompletions.toLocaleString()}</div>
            <div className="text-xs text-gray-500">Total Completions</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-lg"><CheckCircle2 className="w-5 h-5 text-emerald-600" /></div>
          <div>
            <div className="text-2xl font-bold">{avgPassRate}%</div>
            <div className="text-xs text-gray-500">Avg Pass Rate</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="p-2 bg-amber-50 rounded-lg"><Clock className="w-5 h-5 text-amber-600" /></div>
          <div>
            <div className="text-2xl font-bold">21m</div>
            <div className="text-xs text-gray-500">Avg Duration</div>
          </div>
        </Card>
      </div>

      <div className="space-y-3">
        {ASSESSMENTS.map(a => (
          <Card
            key={a.id}
            className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${selectedAssessment?.id === a.id ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setSelectedAssessment(a)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-50 rounded-lg">
                  {a.type === 'trident' ? <Brain className="w-5 h-5 text-blue-600" /> :
                   a.type === 'shift' ? <BarChart3 className="w-5 h-5 text-purple-600" /> :
                   <ClipboardList className="w-5 h-5 text-gray-600" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{a.name}</span>
                    <Badge className={`text-[10px] ${typeColors[a.type]}`}>{a.type}</Badge>
                    <Badge className={a.status === 'active' ? 'bg-green-100 text-green-700' : a.status === 'draft' ? 'bg-gray-100 text-gray-600' : 'bg-slate-100 text-slate-600'}>
                      {a.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{a.questions} questions · {a.avgDuration} · Updated {a.lastUpdated}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {a.status === 'active' && (
                  <div className="text-right">
                    <div className="text-lg font-semibold">{a.completions}</div>
                    <div className="text-[10px] text-gray-500">completions</div>
                  </div>
                )}
                <Button size="sm" variant="outline" className="gap-1">
                  <Settings className="w-3 h-3" />
                  Config
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {selectedAssessment && (
        <Card className="p-5 border-blue-200">
          <h3 className="font-medium text-sm mb-4">{selectedAssessment.name} — Performance</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{selectedAssessment.completions}</div>
              <div className="text-xs text-gray-500">Completions</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{selectedAssessment.passRate}%</div>
              <div className="text-xs text-gray-500">Pass Rate</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{selectedAssessment.questions}</div>
              <div className="text-xs text-gray-500">Questions</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{selectedAssessment.avgDuration}</div>
              <div className="text-xs text-gray-500">Avg Time</div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Button size="sm" className="gap-1">
              <Play className="w-3 h-3" />
              Preview
            </Button>
            <Button size="sm" variant="outline" className="gap-1">
              <BarChart3 className="w-3 h-3" />
              Analytics
            </Button>
            <Button size="sm" variant="outline" className="gap-1">
              <TrendingUp className="w-3 h-3" />
              Scoring Model
            </Button>
          </div>
        </Card>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6 space-y-4">
            <h3 className="font-medium">Create Assessment</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Name</label>
                <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Assessment name" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Type</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="trident">TRIDENT</option>
                  <option value="shift">SHIFT</option>
                  <option value="diagnostic">Diagnostic</option>
                  <option value="skills">Skills</option>
                  <option value="culture">Culture Fit</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={() => setShowCreate(false)}>Create</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
