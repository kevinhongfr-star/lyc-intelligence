import * as React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function Textarea({ className = '', ...props }: TextareaProps) {
  return (
    <textarea
      className={`w-full px-3 py-2 border bg-transparent text-sm font-mono resize-y min-h-[80px] focus:outline-none focus:ring-2 ${className}`}
      {...props}
    />
  );
}
