/**
 * Avatar — User avatar with fallback initials
 * Spec 17 base component
 */
import React from 'react';
import { cn } from '@/lib/utils';

const SIZE_STYLES = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

const COLOR_PALETTE = [
  'bg-[#C108AB] text-white',
  'bg-[#0891B2] text-white',
  'bg-[#059669] text-white',
  'bg-[#D97706] text-white',
  'bg-[#7C3AED] text-white',
  'bg-[#DC2626] text-white',
  'bg-[#2563EB] text-white',
  'bg-[#16A34A] text-white',
];

function getColorFromId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

interface AvatarProps {
  src?: string | null;
  name?: string;
  id?: string;
  size?: keyof typeof SIZE_STYLES;
  className?: string;
  'aria-label'?: string;
}

export function Avatar({
  src,
  name,
  id,
  size = 'md',
  className,
  'aria-label': ariaLabel,
}: AvatarProps) {
  const [imgError, setImgError] = React.useState(false);
  const initials = name ? getInitials(name) : '?';
  const colorClass = id ? getColorFromId(id) : COLOR_PALETTE[0];

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={ariaLabel || name || 'Avatar'}
        onError={() => setImgError(true)}
        className={cn(
          'rounded-full object-cover flex-shrink-0',
          SIZE_STYLES[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-medium flex-shrink-0',
        SIZE_STYLES[size],
        colorClass,
        className
      )}
      role="img"
      aria-label={ariaLabel || name || 'Avatar'}
    >
      {initials}
    </div>
  );
}

export default Avatar;