/**
 * Design system: Avatar + AvatarGroup (#33)
 *
 * Zero border radius. Monospace initials fallback when no image provided.
 * Follows ECHO v6.0 tokens for size, color, border.
 */
import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZES: Record<AvatarSize, string> = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-lg',
};

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  name?: string | null;
  size?: AvatarSize;
  status?: 'online' | 'away' | 'offline' | 'dnd';
  fallback?: string;
}

/** Extract up to two uppercase initials from a name. */
function getInitials(name: string | null | undefined, fallback?: string): string {
  if (fallback) return fallback.slice(0, 2).toUpperCase();
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Seeded color from name so avatars are consistent across renders. */
function pickAccentFromName(name: string | null | undefined): string {
  if (!name) return 'var(--color-accent)';
  const palette = [
    'var(--color-accent)',
    'var(--color-teal)',
    'var(--color-sky)',
    'var(--color-lavender)',
    'var(--color-warning)',
    'var(--color-mist)',
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return palette[Math.abs(h) % palette.length];
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(function Avatar(
  {
    src,
    alt,
    name,
    size = 'md',
    status,
    fallback,
    className,
    style,
    ...rest
  },
  ref,
) {
  const accent = pickAccentFromName(name);
  const initials = getInitials(name, fallback);
  return (
    <div
      ref={ref}
      className={cn(
        'relative inline-flex items-center justify-center shrink-0 border border-[var(--color-border-subtle)] overflow-hidden select-none',
        SIZES[size],
        className,
      )}
      style={{
        background: !src ? accent : undefined,
        ...style,
      }}
      {...rest}
    >
      {src ? (
        <img
          src={src}
          alt={alt ?? name ?? ''}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <span
          className="font-[var(--font-mono)] font-medium tracking-[var(--tracking-tight)]"
          style={{ color: 'var(--color-on-accent)' }}
          aria-hidden={!name && !fallback}
        >
          {initials}
        </span>
      )}
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 h-2 w-2 border-2 border-[var(--color-bg)]',
            status === 'online' && 'bg-[var(--color-success)]',
            status === 'away' && 'bg-[var(--color-warning)]',
            status === 'dnd' && 'bg-[var(--color-error)]',
            status === 'offline' && 'bg-[var(--color-muted)]',
          )}
          aria-label={`status: ${status}`}
        />
      )}
    </div>
  );
});

/* ── AvatarGroup (stacked, with "+N" overflow) ──────────────────── */

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  avatars: Array<Pick<AvatarProps, 'src' | 'name' | 'alt'>>;
  size?: AvatarSize;
  max?: number;
}

export function AvatarGroup({
  avatars,
  size = 'md',
  max = 4,
  className,
  ...rest
}: AvatarGroupProps) {
  const visible = avatars.slice(0, max);
  const overflow = avatars.length - max;
  return (
    <div
      className={cn('flex -space-x-3', className)}
      role="group"
      aria-label={`${avatars.length} members`}
      {...rest}
    >
      {visible.map((a, i) => (
        <Avatar
          key={`${a.name ?? i}-${i}`}
          {...a}
          size={size}
          className="ring-2 ring-[var(--color-bg)]"
        />
      ))}
      {overflow > 0 && (
        <div
          className={cn(
            'relative inline-flex items-center justify-center shrink-0 border-2 border-[var(--color-bg)] bg-[var(--color-bg-alt)] text-[var(--color-text-secondary)] font-[var(--font-mono)]',
            SIZES[size],
          )}
          aria-hidden="false"
          aria-label={`plus ${overflow} more`}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
