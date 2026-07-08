// Phase 7.4: Background Check Result Component
'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, XCircle, Save, X } from 'lucide-react';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';
import { Textarea } from '@/components/ui';
import { Select } from '@/components/ui';

interface BackgroundCheck {
  id: string;
  check_type: string;
  provider: string;
}

interface BackgroundCheckResultProps {
  check: BackgroundCheck;
  onSave: (data: ResultFormData) => void;
  onCancel: () => void;
}

export interface ResultFormData {
  check_id: string;
  result: 'clear' | 'discrepancy' | 'unresolved';
  result_summary: string;
  report_url: string;
}

const RESULT_OPTIONS = [
  { value: 'clear', label: 'Clear', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  { value: 'discrepancy', label: 'Discrepancy', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100' },
  { value: 'unresolved', label: 'Unresolved', icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
];

export function BackgroundCheckResult({ check, onSave, onCancel }: BackgroundCheckResultProps) {
  const [formData, setFormData] = useState({
    check_id: check.id,
    result: 'clear' as const,
    result_summary: '',
    report_url: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      // Simulate file upload via existing upload.ts
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', 'background-check');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success && result.url) {
        setFormData(prev => ({ ...prev, report_url: result.url }));
      }
    } catch (err) {
      console.error('Failed to upload file:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.result || !formData.report_url) {
      return;
    }

    onSave(formData);
  };

  const currentResultConfig = RESULT_OPTIONS.find(r => r.value === formData.result)!;
  const CurrentResultIcon = currentResultConfig.icon;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Upload className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-text-primary">Upload Background Check Results</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Check Info */}
      <div className="p-4 bg-bg-alt rounded-none mb-6">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-text-muted" />
          <span className="font-medium text-text-primary">{check.check_type}</span>
          <span className="text-text-muted">|</span>
          <span className="text-text-muted">{check.provider}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Upload Report */}
        <div>
          <label className="text-sm font-medium text-text-muted">Upload Report PDF *</label>
          <div
            className={`mt-2 p-4 border-2 border-dashed rounded-none text-center cursor-pointer transition-colors ${
              selectedFile ? 'border-primary bg-primary/5' : 'border-border hover:border-primary'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            {selectedFile ? (
              <div className="flex items-center justify-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <span className="text-sm text-text-primary">{selectedFile.name}</span>
              </div>
            ) : (
              <div>
                <Upload className="w-8 h-8 text-text-muted mx-auto" />
                <p className="text-sm text-text-muted mt-2">Click to upload PDF report</p>
                <p className="text-xs text-text-muted mt-1">Max file size: 10MB</p>
              </div>
            )}
          </div>
          {selectedFile && !formData.report_url && (
            <Button
              type="button"
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full mt-2 gap-2"
            >
              {isUploading ? 'Uploading...' : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload File
                </>
              )}
            </Button>
          )}
          {formData.report_url && (
            <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              File uploaded successfully
            </div>
          )}
        </div>

        {/* Result */}
        <div>
          <label className="text-sm font-medium text-text-muted">Check Result *</label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {RESULT_OPTIONS.map(option => {
              const OptionIcon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, result: option.value as 'clear' | 'discrepancy' | 'unresolved' }))}
                  className={`flex flex-col items-center gap-2 p-3 rounded-none border-2 transition-colors ${
                    formData.result === option.value
                      ? `${option.bg} border-current ${option.color}`
                      : 'border-border hover:border-text-muted'
                  }`}
                >
                  <OptionIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div>
          <label className="text-sm font-medium text-text-muted">Result Summary</label>
          <Textarea
            value={formData.result_summary}
            onChange={(e) => setFormData(prev => ({ ...prev, result_summary: e.target.value }))}
            placeholder="Enter summary of the background check results..."
            rows={3}
            className="mt-1"
          />
        </div>

        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={!formData.report_url}
            className="flex-1 gap-2"
          >
            <Save className="w-4 h-4" />
            Save Results
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default BackgroundCheckResult;