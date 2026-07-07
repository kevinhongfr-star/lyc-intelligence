import React from 'react';
import { Calendar, Video, Clock, Edit, FileText, Send } from 'lucide-react';

type InterviewStatus = 'Confirmed' | 'Pending confirmation';

interface Interview {
  id: string;
  date: string;
  time: string;
  candidate: string;
  role: string;
  panel: string[];
  room: { ready: boolean; label: string };
  status: InterviewStatus;
  scorecardReady?: boolean;
}

const INTERVIEWS: Interview[] = [
  {
    id: 'iv-1',
    date: 'Jul 8',
    time: '14:00',
    candidate: 'David Tan',
    role: 'VP Risk',
    panel: ['Claire Jin', 'Robert Tan', 'Lisa Chen'],
    room: { ready: true, label: 'Zoom (auto-generated)' },
    status: 'Confirmed',
    scorecardReady: true,
  },
  {
    id: 'iv-2',
    date: 'Jul 10',
    time: '10:00',
    candidate: 'Sophie Lau',
    role: 'VP Risk',
    panel: ['Claire Jin', 'Michael Wong'],
    room: { ready: false, label: 'Pending' },
    status: 'Pending confirmation',
  },
];

const STATUS_STYLE: Record<InterviewStatus, React.CSSProperties> = {
  Confirmed: { backgroundColor: 'rgba(0,137,123,0.15)', color: '#00897B' },
  'Pending confirmation': { backgroundColor: 'rgba(245,158,11,0.15)', color: '#F59E0B' },
};

export function InterviewCoordinator() {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">UPCOMING INTERVIEWS THIS WEEK</h3>
      </div>

      <div className="space-y-3">
        {INTERVIEWS.map((iv) => {
          const confirmed = iv.status === 'Confirmed';
          return (
            <div key={iv.id} className="border border-bg-tertiary p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-text-primary font-medium">
                    <span className="text-text-muted">{iv.date}, {iv.time}</span>
                    {' — '}
                    {iv.candidate} / {iv.role}
                  </p>
                  <p className="text-sm text-text-muted mt-1">
                    Panel: {iv.panel.join(', ')}
                  </p>
                  <p className="text-sm text-text-muted mt-1 flex items-center gap-1">
                    {iv.room.ready ? (
                      <Video className="w-3.5 h-3.5 flex-shrink-0" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                    )}
                    <span>{iv.room.label}</span>
                  </p>
                  {confirmed && iv.scorecardReady && (
                    <p className="text-xs text-teal mt-2">Scorecard: Ready</p>
                  )}
                </div>
                <span
                  className="px-2 py-0.5 text-xs font-medium whitespace-nowrap flex-shrink-0"
                  style={STATUS_STYLE[iv.status]}
                >
                  {iv.status}
                </span>
              </div>

              <div className="flex gap-4 mt-3">
                <button className="text-sm text-text-muted hover:text-text-primary flex items-center gap-1">
                  <Edit className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button className="text-sm text-text-muted hover:text-text-primary flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Reschedule
                </button>
                {confirmed ? (
                  <button className="text-sm text-text-muted hover:text-text-primary flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    Scorecard
                  </button>
                ) : (
                  <button className="text-sm text-text-muted hover:text-text-primary flex items-center gap-1">
                    <Send className="w-3.5 h-3.5" />
                    Send Reminder
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
