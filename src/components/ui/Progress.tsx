import React from 'react';
export function Progress({ value, className }: { value: number; className?: string }) {
  return <div className={`w-full h-2 bg-bg-tertiary rounded-full overflow-hidden ${className || ''}`}><div className="h-full bg-accent rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>;
}
