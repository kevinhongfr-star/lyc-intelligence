/**
 * PlaceholderPage — Temporary page for routes not yet implemented
 * Shows title and "Coming Soon" message
 */
import React from 'react';
import { Construction } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Construction className="w-12 h-12 text-fuchsia mb-4" />
      <h1 className="font-serif font-bold text-2xl text-text-primary mb-2">{title}</h1>
      <p className="text-text-secondary">This page is coming soon.</p>
    </div>
  );
}

export default PlaceholderPage;
