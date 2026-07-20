/**
 * Data Export Tool — Issue #40: GDPR Data Portability
 *
 * User data export and download interface.
 */
import React, { useState } from 'react';
import { Download, FileText, User, Shield, Clock, CheckCircle2, Database } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';

interface ExportItem {
  id: string;
  name: string;
  description: string;
  size: string;
  icon: React.ReactNode;
}

const EXPORT_ITEMS: ExportItem[] = [
  { id: 'profile', name: 'Profile Data', description: 'Your personal information and preferences', size: '~12 KB', icon: <User className="h-5 w-5" /> },
  { id: 'candidates', name: 'Candidate Data', description: 'Candidates you\'ve added or managed', size: '~1.2 MB', icon: <Database className="h-5 w-5" /> },
  { id: 'mandates', name: 'Mandate Data', description: 'Mandates you\'re associated with', size: '~256 KB', icon: <FileText className="h-5 w-5" /> },
  { id: 'activity', name: 'Activity Log', description: 'Your platform activity history', size: '~45 KB', icon: <Clock className="h-5 w-5" /> },
  { id: 'messages', name: 'Messages', description: 'Your conversations and messages', size: '~89 KB', icon: <FileText className="h-5 w-5" /> },
];

export function DataExportPage() {
  const [selected, setSelected] = useState<string[]>(['profile']);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [complete, setComplete] = useState(false);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleExport = async () => {
    setExporting(true);
    setProgress(0);
    setComplete(false);

    // Simulate export
    for (let i = 0; i <= 100; i += 10) {
      setProgress(i);
      await new Promise((r) => setTimeout(r, 200));
    }

    setExporting(false);
    setComplete(true);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="bg-white border-b border-[#E5E5E5]">
        <div className="max-w-4xl mx-auto px-6 py-5">
          <div className="flex items-center gap-2 text-[13px] text-[#6B6B6B] mb-1">
            <Shield className="h-4 w-4" />
            Privacy
          </div>
          <h1 className="text-[24px] font-serif text-[#1A1A1A]">Data Export</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-6">
        <Card className="mb-6">
          <CardContent className="p-6">
            <p className="text-[14px] text-[#4A4A4A] leading-relaxed">
              You can export a copy of your personal data at any time. 
              Select the data categories you want to export below. 
              The export will be generated as a ZIP file containing JSON and CSV files.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Data to Export</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {EXPORT_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => toggle(item.id)}
                  className={`w-full flex items-center gap-4 p-3 rounded-lg border-2 text-left transition-all ${
                    selected.includes(item.id)
                      ? 'border-[#1A1A1A] bg-[#FAFAFA]'
                      : 'border-[#E5E5E5] bg-white hover:border-[#C0C0C0]'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    selected.includes(item.id) ? 'bg-[#1A1A1A] text-white' : 'bg-[#F0F0F0] text-[#6B6B6B]'
                  }`}>
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] font-medium text-[#1A1A1A]">{item.name}</p>
                    <p className="text-[12px] text-[#6B6B6B]">{item.description}</p>
                  </div>
                  <span className="text-[12px] text-[#9B9B9B]">{item.size}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {exporting && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <p className="text-[13px] text-[#6B6B6B] mb-2">Generating export...</p>
              <Progress value={progress} className="h-2" />
            </CardContent>
          </Card>
        )}

        {complete && (
          <Card className="mb-6 border-emerald-200 bg-emerald-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                <div>
                  <p className="text-[14px] font-medium text-[#1A1A1A]">Export Complete</p>
                  <p className="text-[13px] text-[#6B6B6B]">Your data has been exported and is ready for download.</p>
                </div>
                <Button className="ml-auto">
                  <Download className="h-4 w-4 mr-1.5" />
                  Download ZIP
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Button
          className="w-full"
          onClick={handleExport}
          disabled={exporting || selected.length === 0}
        >
          {exporting ? 'Exporting...' : `Export ${selected.length} Category(s)`}
        </Button>
      </div>
    </div>
  );
}
