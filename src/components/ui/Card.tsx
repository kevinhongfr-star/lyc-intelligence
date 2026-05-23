import React from 'react';
export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-bg-secondary border border-bg-tertiary rounded-lg ${className || ''}`}>{children}</div>;
}
export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-4 border-b border-bg-tertiary ${className || ''}`}>{children}</div>;
}
export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`font-serif font-semibold text-lg text-text-primary ${className || ''}`}>{children}</h3>;
}
export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-4 ${className || ''}`}>{children}</div>;
}
