import React from 'react';

/**
 * Premium Card — shadow-based elevation, no borders
 * Hover lift effect for interactive cards
 */
export function Card({ children, className, interactive = false, ...props }: { 
  children: React.ReactNode; 
  className?: string;
  interactive?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={`
        bg-[var(--color-card)] 
        transition-all duration-300 ease-out
        ${interactive ? 'hover:-translate-y-0.5 cursor-pointer' : ''}
        ${className || ''}
      `}
      style={{ 
        boxShadow: interactive 
          ? '0 1px 3px rgba(26,23,20,0.04), 0 1px 2px rgba(26,23,20,0.06)' 
          : '0 1px 3px rgba(26,23,20,0.04), 0 1px 2px rgba(26,23,20,0.06)',
        ...props.style,
      }}
      onMouseEnter={(e) => {
        if (interactive) {
          (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 24px rgba(26,23,20,0.08), 0 4px 8px rgba(26,23,20,0.04)';
        }
        props.onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        if (interactive) {
          (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(26,23,20,0.04), 0 1px 2px rgba(26,23,20,0.06)';
        }
        props.onMouseLeave?.(e);
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, ...props }: { children: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`px-6 py-5 border-b border-[#E5E5E5] ${className || ''}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className, ...props }: { children: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`font-serif font-bold text-base tracking-tight text-[var(--color-text)] ${className || ''}`} {...props}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className, ...props }: { children: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`px-6 py-5 ${className || ''}`} {...props}>
      {children}
    </div>
  );
}
