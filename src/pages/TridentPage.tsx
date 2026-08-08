import { TridentScorePanel } from '@/components/trident/TridentScorePanel';
import { ScorecardView } from '@/components/trident/ScorecardView';

export default function TridentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Match Analysis 3D Scoring</h1>
        <p className="text-sm text-slate-500 mt-1">
          Three-dimensional candidate evaluation against mandate criteria.
        </p>
      </div>
      <TridentScorePanel />
      <ScorecardView />
    </div>
  );
}
