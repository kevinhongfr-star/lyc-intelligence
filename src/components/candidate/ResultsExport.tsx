import React, { useState } from 'react';
import { Download } from 'lucide-react';

type ExportOption = 'full' | 'summary';

interface ResultsExportProps {
  defaultOption?: ExportOption;
}

export function ResultsExport({ defaultOption = 'full' }: ResultsExportProps) {
  const [selectedOption, setSelectedOption] = useState<ExportOption>(defaultOption);

  return (
    <div className="bg-bg-primary border border-bg-tertiary">
      <div className="flex items-center gap-2 p-4 border-b border-bg-tertiary">
        <Download className="w-5 h-5 text-accent" />
        <h2 className="font-serif text-sm font-bold text-text-primary tracking-wider">EXPORT</h2>
      </div>
      <div className="p-5 space-y-5">
        <p className="text-text-secondary">Export your results</p>

        <div className="space-y-3">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setSelectedOption('full')}
          >
            <div className="w-5 h-5 border-2 border-bg-tertiary flex items-center justify-center">
              {selectedOption === 'full' && (
                <div className="w-2.5 h-2.5 bg-accent" />
              )}
            </div>
            <span className="text-sm text-text-primary">Full report</span>
          </div>
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setSelectedOption('summary')}
          >
            <div className="w-5 h-5 border-2 border-bg-tertiary flex items-center justify-center">
              {selectedOption === 'summary' && (
                <div className="w-2.5 h-2.5 bg-accent" />
              )}
            </div>
            <span className="text-sm text-text-primary">Summary only</span>
          </div>
        </div>

        <button className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-accent text-white text-sm hover:bg-accent-hover transition-colors">
          <Download className="w-4 h-4" />
          Download PDF
        </button>
      </div>
    </div>
  );
}
