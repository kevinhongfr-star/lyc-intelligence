'use client';

import React, { useState } from 'react';
import {
  MessageSquarePlus,
  X,
  Send,
  MessageCircle,
  Phone,
  Video,
  UserPlus,
  CheckSquare,
  FileText,
  ThumbsUp,
  Minus,
  ThumbsDown,
  Clock,
  Calendar,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui';

interface WeChatQuickLogProps {
  contactId: string;
  contactName?: string;
  onLogged?: () => void;
}

const INTERACTION_TYPES = [
  { value: 'message_sent', label: 'Message Sent', icon: Send },
  { value: 'message_received', label: 'Message Received', icon: MessageCircle },
  { value: 'voice_call', label: 'Voice Call', icon: Phone },
  { value: 'video_call', label: 'Video Call', icon: Video },
  { value: 'friend_request_sent', label: 'Friend Request Sent', icon: UserPlus },
  { value: 'friend_request_accepted', label: 'Friend Request Accepted', icon: UserPlus },
  { value: 'moment_interaction', label: 'Moment Interaction', icon: ThumbsUp },
  { value: 'group_mention', label: 'Group Mention', icon: MessageCircle },
  { value: 'file_shared', label: 'File Shared', icon: FileText },
];

const OUTCOMES = [
  { value: 'positive', label: 'Positive', icon: ThumbsUp, color: 'text-emerald-600' },
  { value: 'neutral', label: 'Neutral', icon: Minus, color: 'text-gray-500' },
  { value: 'negative', label: 'Negative', icon: ThumbsDown, color: 'text-red-600' },
  { value: 'follow_up_needed', label: 'Follow-up Needed', icon: Clock, color: 'text-blue-600' },
  { value: 'scheduled', label: 'Scheduled', icon: Calendar, color: 'text-purple-600' },
];

const STAGE_OPTIONS = [
  { value: 'S5_Responded', label: 'S5 — Responded' },
  { value: 'S6_WeChat_Added', label: 'S6 — WeChat Added' },
  { value: 'S7_Interested', label: 'S7 — Interested' },
  { value: 'S9_Call_Positive', label: 'S9 — Call Positive' },
  { value: 'S10_Call_Negative', label: 'S10 — Call Negative' },
];

export function WeChatQuickLog({ contactId, contactName = '', onLogged }: WeChatQuickLogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [interactionType, setInteractionType] = useState('message_sent');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [wechatId, setWechatId] = useState('');
  const [outcome, setOutcome] = useState('neutral');
  const [triggersStageChange, setTriggersStageChange] = useState(false);
  const [suggestedStage, setSuggestedStage] = useState('S5_Responded');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setInteractionType('message_sent');
    setSummary('');
    setContent('');
    setWechatId('');
    setOutcome('neutral');
    setTriggersStageChange(false);
    setSuggestedStage('S5_Responded');
    setError(null);
  };

  const handleSubmit = async () => {
    if (!summary.trim()) {
      setError('Please enter a summary');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/wechat/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_id: contactId,
          interaction_type: interactionType,
          summary,
          content: content || undefined,
          wechat_id: wechatId || undefined,
          outcome,
          triggers_stage_change: triggersStageChange,
          suggested_stage: triggersStageChange ? suggestedStage : undefined,
          occurred_at: new Date().toISOString(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        onLogged?.();
        setIsOpen(false);
        resetForm();
      } else {
        setError(data.error || 'Failed to log interaction');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to log interaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpen = () => {
    resetForm();
    setIsOpen(true);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg flex items-center justify-center transition-all hover:scale-105 z-40"
        title="Log WeChat Interaction"
      >
        <MessageSquarePlus className="w-6 h-6" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-none w-full max-w-lg max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-green-500" />
                <h2 className="text-lg font-semibold text-text-primary">
                  Log WeChat Interaction
                </h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-bg-alt rounded-none"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-none text-sm">
                  {error}
                </div>
              )}

              {/* Interaction Type */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Interaction Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {INTERACTION_TYPES.map(type => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        onClick={() => setInteractionType(type.value)}
                        className={`p-2 rounded-none border text-xs font-medium transition-all flex flex-col items-center gap-1 ${
                          interactionType === type.value
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-border text-text-muted hover:border-green-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {type.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Summary */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Summary <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={summary}
                  onChange={e => setSummary(e.target.value)}
                  className="w-full px-3 py-2 rounded-none bg-bg-base border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Brief description of the interaction"
                />
              </div>

              {/* Content / Notes */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Content / Notes <span className="text-text-muted font-normal">(optional)</span>
                </label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full h-24 px-3 py-2 rounded-none bg-bg-base border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  placeholder="Message content or call notes..."
                />
              </div>

              {/* WeChat ID */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  WeChat ID <span className="text-text-muted font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={wechatId}
                  onChange={e => setWechatId(e.target.value)}
                  className="w-full px-3 py-2 rounded-none bg-bg-base border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="candidate_wechat_id"
                />
              </div>

              {/* Outcome */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Outcome
                </label>
                <div className="flex gap-1 flex-wrap">
                  {OUTCOMES.map(o => {
                    const Icon = o.icon;
                    return (
                      <button
                        key={o.value}
                        onClick={() => setOutcome(o.value)}
                        className={`px-3 py-1.5 rounded-none border text-xs font-medium transition-all flex items-center gap-1 ${
                          outcome === o.value
                            ? `${o.color} bg-bg-alt border-current`
                            : 'border-border text-text-muted hover:border-gray-400'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pipeline Stage Change */}
              <div className="pt-3 border-t border-border">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={triggersStageChange}
                    onChange={e => setTriggersStageChange(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-border text-green-500 focus:ring-green-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-text-primary">
                      Trigger pipeline stage change
                    </span>
                    <p className="text-xs text-text-muted mt-0.5">
                      Update the candidate's pipeline stage based on this interaction
                    </p>
                  </div>
                </label>

                {triggersStageChange && (
                  <div className="mt-3 pl-7">
                    <label className="block text-sm text-text-secondary mb-1">
                      Suggested Stage
                    </label>
                    <select
                      value={suggestedStage}
                      onChange={e => setSuggestedStage(e.target.value)}
                      className="w-full px-3 py-2 rounded-none bg-bg-base border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    >
                      {STAGE_OPTIONS.map(stage => (
                        <option key={stage.value} value={stage.value}>
                          {stage.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !summary.trim()}
                className="bg-green-600 hover:bg-green-700 gap-2"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckSquare className="w-4 h-4" />}
                {isSubmitting ? 'Logging...' : 'Log Interaction'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default WeChatQuickLog;
