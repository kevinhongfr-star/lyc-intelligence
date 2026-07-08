import React from 'react';
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="w-full px-3 py-2 bg-bg-tertiary border border-bg-hover rounded-none text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent" {...props} />;
}
