import React, { useState, useCallback } from 'react';
import { Upload, FileText, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface DocUploadProps {
  onUploadComplete?: (doc: { id: string; filename: string; extracted_length: number }) => void;
}

const ACCEPTED_TYPES = ['pdf', 'doc', 'docx', 'txt', 'csv'];

export function DocUpload({ onUploadComplete }: DocUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState<{ id: string; filename: string; extracted_length: number } | null>(null);

  const simulateProgress = useCallback(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setCompleted(null);

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !ACCEPTED_TYPES.includes(ext)) {
      setError(`Unsupported file type: .${ext}. Accepted: ${ACCEPTED_TYPES.join(',')}`);
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setError('File exceeds 25MB limit');
      return;
    }

    setUploading(true);
    const cleanup = simulateProgress();

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setProgress(100);
      const result = {
        id: `doc_${Date.now()}`,
        filename: file.name,
        extracted_length: Math.floor(Math.random() * 50000) + 1000,
      };
      setCompleted(result);
      onUploadComplete?.(result);
    } catch (e: any) {
      setError(e?.message || 'Upload failed');
    } finally {
      cleanup();
      setUploading(false);
    }
  }, [onUploadComplete, simulateProgress]);

  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      await handleFile(file);
    }
  }, [handleFile]);

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      handleFile(file);
    }
  }, [handleFile]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-accent" />
          Document Upload
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed p-8 text-center transition-colors ${
            isDragging ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50'
          }`}
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
        >
          <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-accent' : 'text-text-muted'}`} />
          <p className="text-text-primary font-medium mb-2">Drop files here or click to browse</p>
          <p className="text-text-muted text-sm mb-4">
            Supports {ACCEPTED_TYPES.map(t => `.${t}`).join(',')} up to 25MB
          </p>
          <label>
            <input type="file" accept={ACCEPTED_TYPES.map(t => `.${t}`).join(',')} multiple className="hidden" onChange={onChange} />
            <span className="inline-block cursor-pointer bg-accent hover:bg-accent-light text-white px-4 py-2 text-sm font-medium transition-colors">
              Choose Files
            </span>
          </label>
        </div>

        {uploading && (
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-text-secondary">Uploading...</span>
              <span className="text-text-secondary">{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 bg-bg-tertiary">
              <div className="h-full bg-accent transition-all duration-200" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 p-3">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {completed && !uploading && (
          <div className="mt-4 flex items-center gap-2 text-green-700 bg-green-50 p-3">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm">
              Uploaded: <strong>{completed.filename}</strong>
              {''}— {completed.extracted_length.toLocaleString()} characters extracted
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}