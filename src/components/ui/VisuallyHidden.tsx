import React from 'react';

interface VisuallyHiddenProps {
  children: React.ReactNode;
  as?: React.ElementType;
  className?: string;
}

export function VisuallyHidden({ children, as: Component = 'span', className = '' }: VisuallyHiddenProps) {
  return (
    <Component
      className={`absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0 ${className}`}
      style={{ clip: 'rect(0, 0, 0, 0)' }}
    >
      {children}
    </Component>
  );
}
