import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Target,
  FileText,
  User,
  Calendar,
  AlertCircle,
  MessageSquare,
  Briefcase,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const MOCK_APPROVAL = {
  id: '1',
  type: 'success_profile',
  title: 'Shortlist Review - VP Engineering',
  mandate: 'TechCorp VP Engineering',
  mandate_id: 'm1',
  requester: 'Alex Wang',
  requester_email: 'alex@lycintelligence.com',
  status: 'pending',
  age: '4 hours',
  requested_at: '2024-06-24T08:00:00Z',
  summary: '5 candidates shortlisted for VP Eng role at TechCorp. Requesting partner review and approval before client submission.',
  candidate_count: 5,
  candidates: [
    { name: 'Michael Chen', current_role: 'VP Engineering at ByteDance', match: 92 },
    { name: 'Sarah Zhang', current_role: 'Director of Engineering at Alibaba', match: 88 },
    { name: 'David Li', current_role: 'VP R&D at Tencent', match: 85 },
    { name: 'Emily Wang', current_role: 'Head of Platform at Meituan', match: 83 },
    { name: 'James Liu', current_role: 'Engineering Director at JD', match: 80 },
  ],
  due_at: '2024-06-25T08:00:00Z',
};

export function TL_ApprovalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reviewNotes, setReviewNotes] = useState('');
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const approval = MOCK_APPROVAL;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success_profile': return <FileText className="w-5 h-5" />;
      case 'offer_terms': return <DollarSign className="w-5 h-5" />;
      case 'sla_waiver': return <Clock className="w-5 h-5" />;
      case 'fee_adjustment': return <Target className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success_profile': return 'text-blue-500 bg-blue-500/10';
      case 'offer_terms': return 'text-green-500 bg-green-500/10';
      case 'sla_waiver': return 'text-amber-500 bg-amber-500/10';
      case 'fee_adjustment': return 'text-purple-500 bg-purple-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'success_profile': return 'Shortlist Review';
      case 'offer_terms': return 'Offer Terms';
      case 'sla_waiver': return 'SLA Waiver';
      case 'fee_adjustment': return 'Fee Adjustment';
      default: return type;
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleApprove = () => {
    setAction('approve');
    setShowConfirm(true);
  };

  const handleReject = () => {
    setAction('reject');
    setShowConfirm(true);
  };

  const confirmAction = () => {
    console.log(`${action} approval ${id}: ${reviewNotes}`);
    setShowConfirm(false);
    navigate('/team/approvals');
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Approvals
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${getTypeColor(approval.type)}`}>
                {getTypeIcon(approval.type)}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-serif font-bold text-text-primary">{approval.title}</h1>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending
                  </Badge>
                </div>
                <p className="text-text-muted">{getTypeLabel(approval.type)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-xs text-text-muted mb-1">Mandate</p>
              <Link to={`/team/mandates/${approval.mandate_id}`} className="text-sm font-medium text-accent hover:underline">
                {approval.mandate}
              </Link>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1">Requested By</p>
              <p className="text-sm font-medium text-text-primary">{approval.requester}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1">Requested</p>
              <p className="text-sm font-medium text-text-primary">{formatDate(approval.requested_at)}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1">Due By</p>
              <p className="text-sm font-medium text-amber-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {formatDate(approval.due_at)}
              </p>
            </div>
          </div>

          <div className="p-4 bg-bg-tertiary rounded-lg">
            <h3 className="font-medium text-text-primary mb-2">Summary</h3>
            <p className="text-sm text-text-secondary">{approval.summary}</p>
          </div>
        </CardContent>
      </Card>

      {approval.type === 'success_profile' && approval.candidates && (
        <Card>
          <CardHeader>
            <CardTitle>Shortlisted Candidates ({approval.candidate_count})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {approval.candidates.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">{c.name}</p>
                    <p className="text-sm text-text-muted">{c.current_role}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  {c.match}% match
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-accent" />
            Your Review
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">Review Notes</label>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Add your feedback or notes..."
              className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-sm min-h-[100px] resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 border-red-500 text-red-600 hover:bg-red-50"
              onClick={handleReject}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
            <Button className="flex-1" onClick={handleApprove}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve
            </Button>
          </div>
        </CardContent>
      </Card>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>
                Confirm {action === 'approve' ? 'Approval' : 'Rejection'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-text-secondary">
                Are you sure you want to {action} this {getTypeLabel(approval.type).toLowerCase()}?
                The requester will be notified.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowConfirm(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  variant={action === 'reject' ? 'destructive' : 'default'}
                  onClick={confirmAction}
                >
                  {action === 'approve' ? 'Confirm Approve' : 'Confirm Reject'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
