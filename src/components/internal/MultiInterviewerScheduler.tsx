import React, { useState } from 'react';
import { Users, Clock, CheckCircle2 } from 'lucide-react';

interface Interviewer {
  id: string;
  name: string;
  role: string;
  availability: boolean[]; // Mon-Fri, 9am-5pm (8 slots each = 40 total)
}

const MOCK_INTERVIEWERS: Interviewer[] = [
  {
    id: 'iv1',
    name: 'Kevin Zhang',
    role: 'Managing Partner',
    availability: [
      true, true, false, true, true, false, true, true, // Mon
      true, true, true, true, false, false, true, true, // Tue
      false, true, true, true, true, true, true, false, // Wed
      true, true, true, false, false, true, true, true, // Thu
      true, false, true, true, true, true, false, true, // Fri
    ],
  },
  {
    id: 'iv2',
    name: 'Sarah Lim',
    role: 'Senior Consultant',
    availability: [
      true, true, true, false, true, true, false, true,
      false, false, true, true, true, true, true, true,
      true, true, true, true, true, true, true, true,
      true, true, false, false, true, true, true, true,
      true, true, true, true, false, false, true, true,
    ],
  },
  {
    id: 'iv3',
    name: 'David Chen',
    role: 'Consultant',
    availability: [
      true, true, true, true, true, false, false, true,
      true, true, true, true, true, true, true, true,
      true, false, true, true, true, true, true, true,
      false, true, true, true, true, true, true, true,
      true, true, true, true, true, true, true, false,
    ],
  },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const HOURS = ['9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm'];

export default function MultiInterviewerScheduler() {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [proposed, setProposed] = useState(false);

  const isOverlap = (slotIndex: number) =>
    MOCK_INTERVIEWERS.every(iv => iv.availability[slotIndex]);

  const overlapSlots = Array.from({ length: 40 }, (_, i) => i).filter(isOverlap);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <Users className="w-5 h-5 text-[#C108AB]" />
        <h3 className="font-serif font-bold text-text-primary">Interviewer Availability</h3>
      </div>

      <div className="flex gap-4 flex-wrap">
        {MOCK_INTERVIEWERS.map(iv => (
          <div key={iv.id} className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-[#C108AB]" style={{ borderRadius: 0 }} />
            <span className="font-medium text-text-primary">{iv.name}</span>
            <span className="text-text-muted">({iv.role})</span>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto border border-bg-tertiary">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-bg-secondary">
              <th className="px-2 py-2 text-text-muted font-medium text-left">
                <Clock className="w-3 h-3 inline" />
              </th>
              {DAYS.map(d => (
                <th key={d} className="px-2 py-2 text-text-muted font-medium text-center">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((hour, hourIdx) => (
              <tr key={hour} className="border-t border-bg-tertiary">
                <td className="px-2 py-2 text-text-muted font-medium">{hour}</td>
                {DAYS.map((_, dayIdx) => {
                  const slotIndex = dayIdx * 8 + hourIdx;
                  const overlap = isOverlap(slotIndex);
                  const selected = selectedSlot === slotIndex;
                  return (
                    <td key={dayIdx} className="px-1 py-1 text-center">
                      <button
                        onClick={() => {
                          if (overlap) {
                            setSelectedSlot(slotIndex);
                            setProposed(false);
                          }
                        }}
                        className={`w-full h-8 border transition-colors ${
                          selected
                            ? 'bg-[#C108AB] text-white border-[#C108AB]'
                            : overlap
                              ? 'bg-[#C108AB]/15 border-[#C108AB]/30 hover:bg-[#C108AB]/25 cursor-pointer'
                              : 'bg-bg-tertiary/40 border-bg-tertiary cursor-default'
                        }`}
                        style={{ borderRadius: 0 }}
                      >
                        {overlap && <CheckCircle2 className="w-3 h-3 mx-auto" />}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <div className="w-3 h-3 bg-[#C108AB]/15 border border-[#C108AB]/30" style={{ borderRadius: 0 }} />
          <span>Overlap ({overlapSlots.length} slots)</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <div className="w-3 h-3 bg-bg-tertiary/40 border border-bg-tertiary" style={{ borderRadius: 0 }} />
          <span>Unavailable</span>
        </div>
      </div>

      {selectedSlot !== null && (
        <div className="border border-[#C108AB]/20 bg-[#C108AB]/5 p-4 flex items-center justify-between" style={{ borderRadius: 0 }}>
          <div>
            <p className="text-sm font-medium text-text-primary">
              Selected: {DAYS[Math.floor(selectedSlot / 8)]} at {HOURS[selectedSlot % 8]}
            </p>
            <p className="text-xs text-text-muted mt-0.5">All interviewers available</p>
          </div>
          <button
            onClick={() => setProposed(true)}
            className="px-4 py-2 bg-[#C108AB] hover:bg-[#A00790] text-white text-sm font-medium transition-colors"
            style={{ borderRadius: 0 }}
          >
            Propose Time
          </button>
        </div>
      )}

      {proposed && (
        <p className="text-sm text-green-700 font-medium">Time proposed and sent to all interviewers.</p>
      )}
    </div>
  );
}
