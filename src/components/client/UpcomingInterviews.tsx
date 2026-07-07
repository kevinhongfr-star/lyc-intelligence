import React from 'react';
import { Calendar, Users } from 'lucide-react';

interface Interview {
  date: string;
  title: string;
  candidates: number;
}

interface UpcomingInterviewsProps {
  interviews: Interview[];
}

export function UpcomingInterviews({ interviews }: UpcomingInterviewsProps) {
  return (
    <div className="bg-bg-secondary border border-bg-tertiary p-6">
      <h2 className="font-serif text-lg font-bold text-text-primary mb-4">Upcoming Interviews</h2>
      
      <div className="space-y-3">
        {interviews.map((interview) => (
          <div
            key={interview.date}
            className="bg-bg-primary border border-bg-tertiary p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-text-primary">{interview.date}</p>
                <p className="text-sm text-text-muted">{interview.title}</p>
              </div>
              <div className="flex items-center gap-1 text-sm text-text-muted">
                <Users className="w-4 h-4" />
                {interview.candidates}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}