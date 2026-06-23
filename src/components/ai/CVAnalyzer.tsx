// Phase 6.4: CV Analyzer Component
// AI-Assisted Features - CV upload, extraction, and display

'use client';

import React, { useState, useCallback } from 'react';
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Edit3,
  Save,
  Sparkles,
} from 'lucide-react';
import { analyzeCV, type CVExtractedData, isAIConfigured } from '@/services/ai/aiService';
import { Button } from '@/components/ui';
import { Card } from '@/components/ui';

interface CVAnalyzerProps {
  /**
   * Callback when CV data is extracted and saved
   */
  onSave?: (data: CVExtractedData) => void;
  /**
   * Callback to cancel
   */
  onCancel?: () => void;
  /**
   * Whether to show in modal or inline
   */
  modal?: boolean;
}

type Step = 'upload' | 'analyzing' | 'review' | 'saving';

export function CVAnalyzer({ onSave, onCancel, modal = false }: CVAnalyzerProps) {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<CVExtractedData | null>(null);
  const [editedData, setEditedData] = useState<CVExtractedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const aiConfigured = isAIConfigured();

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && isValidFile(droppedFile)) {
      setFile(droppedFile);
      setError(null);
    } else {
      setError('Please upload a PDF or DOCX file');
    }
  }, []);

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && isValidFile(selectedFile)) {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please upload a PDF or DOCX file');
    }
  };

  // Validate file type
  const isValidFile = (file: File): boolean => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
    return validTypes.includes(file.type) ||
      file.name.endsWith('.pdf') ||
      file.name.endsWith('.docx') ||
      file.name.endsWith('.doc');
  };

  // Extract text from file (simplified - in production use proper PDF parsing)
  const extractTextFromFile = async (file: File): Promise<string> => {
    // For PDF files, use pdf-parse in production
    // For now, return mock text based on file name
    // In a real implementation, you would use:
    // import pdf from 'pdf-parse';
    // const data = await pdf(file);
    // return data.text;

    // Simulate extraction delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // This is a placeholder - in production, use actual PDF/DOCX parsing
    return `
      John Smith
      Chief Technology Officer
      TechCorp Inc.
      15 years of experience in technology leadership

      Education:
      - MBA, Stanford University, 2010
      - BS Computer Science, MIT, 2005

      Skills: Leadership, Strategy, Cloud Architecture, Team Building, Digital Transformation

      Career Highlights:
      - Led digital transformation at Fortune 500 company
      - Built engineering teams from 10 to 200+
      - Delivered $50M cost savings through cloud migration
    `;
  };

  // Analyze CV
  const handleAnalyze = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    if (!aiConfigured) {
      setError('AI analysis is not configured. Please set VITE_DEEPSEEK_API_KEY.');
      return;
    }

    setStep('analyzing');
    setError(null);

    try {
      const cvText = await extractTextFromFile(file);
      const result = await analyzeCV(cvText);

      if (result.success && result.data) {
        setExtractedData(result.data);
        setEditedData(result.data);
        setStep('review');
      } else {
        setError(result.error || 'Failed to analyze CV');
        setStep('upload');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze CV');
      setStep('upload');
    }
  };

  // Handle field edit
  const handleFieldEdit = (field: keyof CVExtractedData, value: any) => {
    if (!editedData) return;
    setEditedData({ ...editedData, [field]: value });
  };

  // Handle save
  const handleSave = async () => {
    if (!editedData) return;

    setStep('saving');

    try {
      // Simulate save delay
      await new Promise(resolve => setTimeout(resolve, 500));
      onSave?.(editedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setStep('review');
    }
  };

  // Render upload step
  const renderUpload = () => (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".pdf,.docx,.doc"
          onChange={handleFileChange}
          className="hidden"
          id="cv-upload"
        />
        <label
          htmlFor="cv-upload"
          className="cursor-pointer flex flex-col items-center gap-3"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            {file ? (
              <FileText className="w-8 h-8 text-primary" />
            ) : (
              <Upload className="w-8 h-8 text-primary" />
            )}
          </div>
          <div>
            <p className="text-lg font-medium text-text-primary">
              {file ? file.name : 'Drop your CV here'}
            </p>
            <p className="text-sm text-text-muted mt-1">
              {file ? 'Click to change file' : 'or click to browse'}
            </p>
          </div>
          <p className="text-xs text-text-muted">
            Supports PDF and DOCX files
          </p>
        </label>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={handleAnalyze}
          disabled={!file}
          className="flex-1"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Analyze CV
        </Button>
      </div>
    </div>
  );

  // Render analyzing step
  const renderAnalyzing = () => (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
      <div className="text-center">
        <p className="text-lg font-medium text-text-primary">Analyzing CV...</p>
        <p className="text-sm text-text-muted mt-1">
          Extracting key information using AI
        </p>
      </div>
      <p className="text-xs text-text-muted">
        This may take a few seconds
      </p>
    </div>
  );

  // Render review step
  const renderReview = () => {
    if (!editedData) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-primary">
            Review Extracted Information
          </h3>
          <button
            onClick={() => setEditedData(extractedData)}
            className="text-sm text-primary hover:underline"
          >
            Reset to original
          </button>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Name
            </label>
            <input
              type="text"
              value={editedData.name || ''}
              onChange={(e) => handleFieldEdit('name', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-bg-base text-text-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Current Title
            </label>
            <input
              type="text"
              value={editedData.currentTitle || ''}
              onChange={(e) => handleFieldEdit('currentTitle', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-bg-base text-text-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Current Company
            </label>
            <input
              type="text"
              value={editedData.currentCompany || ''}
              onChange={(e) => handleFieldEdit('currentCompany', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-bg-base text-text-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Years of Experience
            </label>
            <input
              type="number"
              value={editedData.yearsExperience || ''}
              onChange={(e) => handleFieldEdit('yearsExperience', parseInt(e.target.value) || null)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-bg-base text-text-primary"
            />
          </div>
        </div>

        {/* Key Skills */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Key Skills
          </label>
          <div className="flex flex-wrap gap-2">
            {editedData.keySkills.map((skill, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
              >
                {skill}
                <button
                  onClick={() => {
                    const newSkills = editedData.keySkills.filter((_, i) => i !== idx);
                    handleFieldEdit('keySkills', newSkills);
                  }}
                  className="hover:text-primary/70"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Career Highlights */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Career Highlights
          </label>
          <ul className="space-y-2">
            {editedData.careerHighlights.map((highlight, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <textarea
                  value={highlight}
                  onChange={(e) => {
                    const newHighlights = [...editedData.careerHighlights];
                    newHighlights[idx] = e.target.value;
                    handleFieldEdit('careerHighlights', newHighlights);
                  }}
                  className="flex-1 px-3 py-2 border border-border rounded-lg bg-bg-base text-text-primary resize-none"
                  rows={2}
                />
              </li>
            ))}
          </ul>
        </div>

        {/* Red Flags */}
        {editedData.potentialRedFlags && editedData.potentialRedFlags.length > 0 && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <h4 className="font-medium text-amber-800">Potential Red Flags</h4>
            </div>
            <ul className="space-y-1">
              {editedData.potentialRedFlags.map((flag, idx) => (
                <li key={idx} className="text-sm text-amber-700">• {flag}</li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => {
              setStep('upload');
              setFile(null);
              setExtractedData(null);
              setEditedData(null);
            }}
            className="flex-1"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Edit Upload
          </Button>
          <Button
            onClick={handleSave}
            disabled={step === 'saving'}
            className="flex-1"
          >
            {step === 'saving' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save to Profile
          </Button>
        </div>
      </div>
    );
  };

  // Main render
  return (
    <Card className={modal ? 'max-w-2xl mx-auto' : ''}>
      {modal && (
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text-primary">
            AI CV Analyzer
          </h2>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-bg-alt rounded transition-colors"
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>
      )}

      <div className="p-6">
        {step === 'upload' && renderUpload()}
        {step === 'analyzing' && renderAnalyzing()}
        {step === 'review' && renderReview()}
      </div>
    </Card>
  );
}

// Compact version for inline use
export function CVAnalyzerCompact({
  onExtracted,
}: {
  onExtracted: (data: CVExtractedData) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Sparkles className="w-4 h-4" />
        Analyze CV with AI
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <CVAnalyzer
            modal
            onSave={(data) => {
              onExtracted(data);
              setIsOpen(false);
            }}
            onCancel={() => setIsOpen(false)}
          />
        </div>
      )}
    </>
  );
}

export default CVAnalyzer;
