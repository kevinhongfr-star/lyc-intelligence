import { Trophy } from 'lucide-react';

interface ConsultantRow {
  rank: number;
  name: string;
  placements: number;
  revenue: string;
}

const CONSULTANTS: ConsultantRow[] = [
  { rank: 1, name: 'Kevin Hong', placements: 12, revenue: '$840K' },
  { rank: 2, name: 'Claire Jin', placements: 8, revenue: '$520K' },
  { rank: 3, name: 'Marcus / AI', placements: 3, revenue: '$210K' },
];

export function ConsultantLeaderboard() {
  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">CONSULTANT LEADERBOARD</h3>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-bg-tertiary text-left text-text-muted">
            <th className="py-2 pr-4 font-medium">Rank</th>
            <th className="py-2 pr-4 font-medium">Consultant</th>
            <th className="py-2 pr-4 font-medium text-right">Placements</th>
            <th className="py-2 pl-4 font-medium text-right">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {CONSULTANTS.map((c) => (
            <tr
              key={c.rank}
              className={`border-b border-bg-tertiary last:border-0 ${
                c.rank === 1 ? 'bg-accent-10' : ''
              }`}
            >
              <td className="py-3 pr-4">
                <span className="font-serif font-bold text-text-primary">{c.rank}</span>
              </td>
              <td className="py-3 pr-4 text-text-primary font-medium">{c.name}</td>
              <td className="py-3 pr-4 text-right text-text-secondary">{c.placements}</td>
              <td className="py-3 pl-4 text-right text-text-primary font-semibold">{c.revenue}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
