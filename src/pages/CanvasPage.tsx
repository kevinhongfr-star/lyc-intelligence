import { CanvasNarrativeEditor } from '@/components/canvas/CanvasNarrativeEditor';
import { CanvasProfileView } from '@/components/canvas/CanvasProfileView';

export default function CanvasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">CANVAS Executive Narrative</h1>
        <p className="text-sm text-slate-500 mt-1">
          Behavioral scoring + AI-generated executive profiles for stakeholder review.
        </p>
      </div>
      <CanvasNarrativeEditor />
      <CanvasProfileView />
    </div>
  );
}
