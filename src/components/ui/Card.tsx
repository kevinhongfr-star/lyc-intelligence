import React from 'react';

/**
 * Premium Card — shadow-based elevation, no borders
 * Hover lift effect for interactive cards
 */
export function Card({ children, className, interactive = false }: { 
  children: React.ReactNode; 
  className?: string;
  interactive?: boolean;
}) {
  return (
    <div 
      className={`
        bg-[var(--color-card)] 
        ${interactive ? '' : ''}
        transition-all duration-300 ease-out
        ${interactive ? 'hover:-translate-y-0.5 cursor-pointer' : ''}
        ${className || ''}
      `}
      style={{ 
        boxShadow: interactive 
          ? '0 1px 3px rgba(26,23,20,0.04), 0 1px 2px rgba(26,23,20,0.06)' 
          : '0 1px 3px rgba(26,23,20,0.04), 0 1px 2px rgba(26,23,20,0.06)',
      }}
      onMouseEnter={(e) => {
        if (interactive) {
          (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 24px rgba(26,23,20,0.08), 0 4px 8px rgba(26,23,20,0.04)';
        }
      }}
      onMouseLeave={(e) => {
        if (interactive) {
          (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(26,23,20,0.04), 0 1px 2px rgba(26,23,20,0.06)';
        }
      }}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-6 py-5 border-b border-[#E8E5E0] ${className || ''}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={`font-serif font-bold text-base tracking-tight text-[var(--color-text)] ${className || ''}`}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-6 py-5 ${className || ''}`}>
      {children}
    </div>
  );
}
