import React, { useState, useRef } from 'react';
import {
  CreditCard,
  Search,
  TrendingUp,
  TrendingDown,
  ArrowUpCircle,
  ArrowDownCircle,
  Download,
  Upload,
  DollarSign,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCcw,
  Gift,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const MOCK_STATS = {
  totalIssued: 125000,
  totalConsumed: 87340,
  totalRemaining: 37660,
  totalUsers: 847,
  activeWithCredits: 312,
};

const MOCK_CREDITS = [
  { id: '1', name: 'Alex Wang', email: 'alex@lycintelligence.com', balance: 450, granted: 1000, consumed: 550, lastActivity: '2h ago' },
  { id: '2', name: 'Sarah Li', email: 'sarah@lycintelligence.com', balance: 320, granted: 800, consumed: 480, lastActivity: '1d ago' },
  { id: '3', name: 'Emily Zhang', email: 'emily@lycintelligence.com', balance: 275, granted: 500, consumed: 225, lastActivity: '3h ago' },
  { id: '4', name: 'Mike Chen', email: 'mike@lycintelligence.com', balance: 180, granted: 400, consumed: 220, lastActivity: '1d ago' },
  { id: '5', name: 'BD Manager', email: 'bd@lycintelligence.com', balance: 500, granted: 500, consumed: 0, lastActivity: '30m ago' },
  { id: '6', name: 'Jane Smith', email: 'jane@candidate.com', balance: 120, granted: 200, consumed: 80, lastActivity: '5h ago' },
];

const MOCK_TRANSACTIONS = [
  { id: '1', type: 'grant', user: 'alex@lycintelligence.com', amount: 500, balanceAfter: 950, reason: 'Monthly allocation', created_by: 'kevin@lycintelligence.com', time: '5m ago' },
  { id: '2', type: 'consumption', user: 'alex@lycintelligence.com', amount: -50, balanceAfter: 450, reason: 'Profile export', created_by: null, time: '2h ago' },
  { id: '3', type: 'adjustment', user: 'sarah@lycintelligence.com', amount: -30, balanceAfter: 320, reason: 'Correction - duplicate charge', created_by: 'kevin@lycintelligence.com', time: '4h ago' },
  { id: '4', type: 'refund', user: 'emily@lycintelligence.com', amount: 75, balanceAfter: 275, reason: 'Refund for cancelled report', created_by: 'kevin@lycintelligence.com', time: '1d ago' },
  { id: '5', type: 'grant', user: 'bd@lycintelligence.com', amount: 500, balanceAfter: 500, reason: 'BD Portal setup', created_by: 'kevin@lycintelligence.com', time: '2d ago' },
  { id: '6', type: 'consumption', user: 'jane@candidate.com', amount: -80, balanceAfter: 120, reason: 'Assessment credits', created_by: null, time: '1d ago' },
  { id: '7', type: 'expiry', user: 'old@lycintelligence.com', amount: -200, balanceAfter: 0, reason: 'Credits expired (90 days)', created_by: null, time: '3d ago' },
];

const TYPE_FILTERS = ['all', 'grant', 'consumption', 'adjustment', 'refund', 'expiry'];

export function CreditManagement() {
  const [view, setView] = useState<'overview' | 'transactions' | 'bulk'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [grantTarget, setGrantTarget] = useState({ email: '', amount: '', reason: '' });
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatCurrency = (val: number) => {
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return String(val);
  };

  const consumptionPercent = Math.round((MOCK_STATS.totalConsumed / MOCK_STATS.totalIssued) * 100);

  const filteredTransactions = MOCK_TRANSACTIONS.filter((t) => {
    const matchesSearch = !searchQuery || t.user.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const filteredCredits = MOCK_CREDITS.filter((c) =>
    !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'grant': return <ArrowUpCircle className="w-4 h-4 text-green-500" />;
      case 'consumption': return <ArrowDownCircle className="w-4 h-4 text-red-500" />;
      case 'adjustment': return <RefreshCcw className="w-4 h-4 text-blue-500" />;
      case 'refund': return <Gift className="w-4 h-4 text-purple-500" />;
      case 'expiry': return <Clock className="w-4 h-4 text-amber-500" />;
      default: return <CreditCard className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'grant': return 'bg-green-500/10';
      case 'consumption': return 'bg-red-500/10';
      case 'adjustment': return 'bg-blue-500/10';
      case 'refund': return 'bg-purple-500/10';
      case 'expiry': return 'bg-amber-500/10';
      default: return 'bg-bg-tertiary';
    }
  };

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      grant: 'Grant',
      consumption: 'Used',
      adjustment: 'Adjust',
      refund: 'Refund',
      expiry: 'Expiry',
    };
    const colors: Record<string, string> = {
      grant: 'bg-green-100 text-green-700',
      consumption: 'bg-red-100 text-red-700',
      adjustment: 'bg-blue-100 text-blue-700',
      refund: 'bg-purple-100 text-purple-700',
      expiry: 'bg-amber-100 text-amber-700',
    };
    return (
      <Badge variant="secondary" className={colors[type] || 'bg-gray-100 text-gray-700'}>
        {getTypeIcon(type)}
        <span className="ml-1">{labels[type] || type}</span>
      </Badge>
    );
  };

  const handleGrant = () => {
    console.log('Grant credits:', grantTarget);
    setShowGrantModal(false);
    setGrantTarget({ email: '', amount: '', reason: '' });
  };

  const handleBulkUpload = () => {
    console.log('Bulk upload:', bulkFile?.name);
    setBulkFile(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-text-primary">Credit Management</h1>
          <p className="text-text-muted">Manage platform credits across all users</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">Total Issued</span>
              <ArrowUpCircle className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-text-primary">{formatCurrency(MOCK_STATS.totalIssued)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">Consumed</span>
              <ArrowDownCircle className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-text-primary">{formatCurrency(MOCK_STATS.totalConsumed)}</p>
            <p className="text-xs text-text-muted">{consumptionPercent}% of issued</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">Remaining</span>
              <CreditCard className="w-4 h-4 text-accent" />
            </div>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(MOCK_STATS.totalRemaining)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">Active Users</span>
              <DollarSign className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-text-primary">{MOCK_STATS.activeWithCredits}</p>
            <p className="text-xs text-text-muted">of {MOCK_STATS.totalUsers} total</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex bg-bg-tertiary rounded-lg p-0.5 w-fit">
        {(['overview', 'transactions', 'bulk'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-2 text-sm rounded-md capitalize transition-colors ${
              view === v
                ? 'bg-bg-secondary text-text-primary font-medium'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {v === 'overview' ? 'Per-User' : v === 'transactions' ? 'Transactions' : 'Bulk Grant'}
          </button>
        ))}
      </div>

      {view === 'overview' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Per-User Credits</CardTitle>
            <Button size="sm" onClick={() => setShowGrantModal(true)}>
              <ArrowUpCircle className="w-4 h-4 mr-2" />
              Grant Credits
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-4 border-b border-border">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg-tertiary">
                  <th className="text-left text-xs text-text-muted font-medium px-4 py-3">User</th>
                  <th className="text-right text-xs text-text-muted font-medium px-4 py-3">Balance</th>
                  <th className="text-right text-xs text-text-muted font-medium px-4 py-3">Granted</th>
                  <th className="text-right text-xs text-text-muted font-medium px-4 py-3">Used</th>
                  <th className="text-right text-xs text-text-muted font-medium px-4 py-3">Usage %</th>
                  <th className="text-right text-xs text-text-muted font-medium px-4 py-3">Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {filteredCredits.map((c) => {
                  const usage = c.granted > 0 ? Math.round((c.consumed / c.granted) * 100) : 0;
                  return (
                    <tr key={c.id} className="border-b border-border hover:bg-bg-tertiary transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-text-primary text-sm">{c.name}</p>
                        <p className="text-xs text-text-muted">{c.email}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-text-primary">{c.balance}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-text-muted">{c.granted}</td>
                      <td className="px-4 py-3 text-right text-sm text-text-muted">{c.consumed}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                            <div className="h-full bg-accent rounded-full" style={{ width: `${usage}%` }} />
                          </div>
                          <span className="text-xs text-text-muted w-8">{usage}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-text-muted">{c.lastActivity}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {view === 'transactions' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Transaction Log</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <Input
                  placeholder="Search by email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex bg-bg-tertiary rounded-lg p-0.5">
                {TYPE_FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setTypeFilter(f)}
                    className={`px-3 py-1.5 text-xs rounded-md capitalize transition-colors ${
                      typeFilter === f
                        ? 'bg-bg-secondary text-text-primary font-medium'
                        : 'text-text-muted hover:text-text-secondary'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {filteredTransactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${getTypeColor(t.type)}`}>
                      {getTypeIcon(t.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        {getTypeBadge(t.type)}
                        <span className="font-semibold text-sm" style={{ color: t.amount >= 0 ? '#22c55e' : '#ef4444' }}>
                          {t.amount >= 0 ? '+' : ''}{t.amount}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">
                        {t.user} · Balance: {t.balanceAfter} · {t.reason}
                        {t.created_by && <span> · by {t.created_by}</span>}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-text-muted">{t.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {view === 'bulk' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-accent" />
                CSV Upload
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-text-secondary">
                Upload a CSV file to grant credits to multiple users at once. Format: <code className="text-xs bg-bg-tertiary px-1 py-0.5 rounded">email,amount,reason</code>
              </p>
              <div className="p-6 border-2 border-dashed border-border rounded-lg text-center">
                <Upload className="w-8 h-8 text-text-muted mx-auto mb-2" />
                <p className="text-sm text-text-primary mb-1">Drop CSV file here or click to browse</p>
                <p className="text-xs text-text-muted mb-4">Required columns: email, amount, reason</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  Browse Files
                </Button>
                {bulkFile && (
                  <p className="mt-2 text-sm text-accent font-medium">{bulkFile.name}</p>
                )}
              </div>
              <Button className="w-full" disabled={!bulkFile} onClick={handleBulkUpload}>
                Process Bulk Grant
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sample CSV Format</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-bg-tertiary rounded-lg p-4">
                <pre className="text-xs text-text-secondary overflow-x-auto">
{`email,amount,reason
alex@lycintelligence.com,200,Monthly top-up
sarah@lycintelligence.com,300,Q2 allocation
mike@lycintelligence.com,150,Performance bonus
emily@lycintelligence.com,250,New project credits`}
                </pre>
              </div>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => {}}>
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {showGrantModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpCircle className="w-5 h-5 text-green-500" />
                Grant Credits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">User Email</label>
                <Input
                  placeholder="user@example.com"
                  value={grantTarget.email}
                  onChange={(e) => setGrantTarget({ ...grantTarget, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">Amount</label>
                <Input
                  type="number"
                  placeholder="100"
                  value={grantTarget.amount}
                  onChange={(e) => setGrantTarget({ ...grantTarget, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">Reason (required)</label>
                <Input
                  placeholder="Monthly allocation, bonus, correction..."
                  value={grantTarget.reason}
                  onChange={(e) => setGrantTarget({ ...grantTarget, reason: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowGrantModal(false)}>Cancel</Button>
                <Button
                  className="flex-1"
                  disabled={!grantTarget.email || !grantTarget.amount || !grantTarget.reason}
                  onClick={handleGrant}
                >
                  Grant +{grantTarget.amount || 0}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
