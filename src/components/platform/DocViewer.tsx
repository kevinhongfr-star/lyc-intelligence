import React, { useState } from 'react';
import { Eye, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface DocViewerProps {
  documents?: Array<{
    id: string;
    filename: string;
    file_type: string;
    extracted_text?: string;
    parsed_content?: string;
  }>;
  activeDocumentId?: string;
}

export function DocViewer({ documents = [], activeDocumentId }: DocViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(
    activeDocumentId ? documents.findIndex(d => d.id === activeDocumentId) : 0
  );
  const [zoom, setZoom] = useState(100);

  const current = documents[currentIndex];

  if (!current) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-accent" />
            Document Viewer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-text-muted">
            <Eye className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No documents to preview</p>
            <p className="text-sm mt-2">Upload documents to view them here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const content = current.extracted_text || current.parsed_content || 'No content available';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-accent" />
          Document Viewer
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={currentIndex <= 0}
              onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium text-text-primary max-w-48 truncate">
              {current.filename}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={currentIndex >= documents.length - 1}
              onClick={() => setCurrentIndex(i => Math.min(documents.length - 1, i + 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.max(50, z - 10))}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs text-text-muted w-12 text-center">{zoom}%</span>
            <Button variant="ghost" size="sm" onClick={() => setZoom(z => Math.min(200, z + 10))}>
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div
          className="bg-bg p-6 max-h-[500px] overflow-auto border border-border"
          style={{ zoom: `${zoom}%` }}
        >
          <pre className="whitespace-pre-wrap text-sm text-text-primary font-sans leading-relaxed">
            {content}
          </pre>
        </div>

        <div className="mt-3 text-xs text-text-muted flex justify-between">
          <span>Type: {current.file_type}</span>
          <span>{currentIndex + 1} / {documents.length}</span>
        </div>
      </CardContent>
    </Card>
  );
}