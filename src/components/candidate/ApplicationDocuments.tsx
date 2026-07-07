import React from 'react';
import { FileText, Download } from 'lucide-react';

export interface ApplicationDocument {
  id: string;
  name: string;
  type: string;
}

const MOCK_DOCUMENTS: ApplicationDocument[] = [
  { id: '1', name: 'Resume — James Wong', type: 'PDF' },
  { id: '2', name: 'Cover Letter — TechCorp', type: 'PDF' },
  { id: '3', name: 'Leadership Portfolio', type: 'PDF' },
  { id: '4', name: 'References', type: 'DOCX' },
];

interface ApplicationDocumentsProps {
  documents?: ApplicationDocument[];
}

export function ApplicationDocuments({ documents = MOCK_DOCUMENTS }: ApplicationDocumentsProps) {
  return (
    <div className="bg-bg-secondary border border-bg-tertiary p-6">
      <h2 className="font-serif text-lg font-bold text-text-primary mb-4">Documents</h2>
      <div className="divide-y divide-bg-tertiary">
        {documents.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between py-3 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <FileText className="w-4 h-4 text-accent shrink-0" />
              <div className="min-w-0">
                <p className="text-sm text-text-primary truncate">{doc.name}</p>
                <p className="text-xs text-text-muted">{doc.type}</p>
              </div>
            </div>
            <button
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-bg-primary border border-bg-tertiary text-text-primary text-xs font-medium hover:bg-bg-tertiary transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
