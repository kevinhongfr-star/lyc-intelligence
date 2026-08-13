/**
 * Design system: Card (#1390).
 *
 * Single shared Card component with 3 ECHO v1.2 variants:
 *  - `flat`     : 1px gray border, no shadow; hover → border turns accent.
 *  - `elevated` : subtle shadow, no border; hover → lift + shadow increase.
 *  - `accent`   : 2px left accent border, white bg (no hover lift).
 *
 * Brand rules:
 *  - Zero border radius (#1349).
 *  - 24–32px padding via CardContent (#1389).
 *  - 200ms ease-out hover transitions (#1367).
 *
 * Also exposes CardHeader (eyebrow + title), CardTitle, CardDescription,
 * CardContent, CardFooter. Existing call sites render unchanged (default
 * variant = `flat`, matching the prior bg/border treatment).
 */
import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type CardVariant = 'flat' | 'elevated' | 'accent';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: CardVariant;
  /** Hover affordance for the `flat` variant (border → accent). Default true. */
  interactive?: boolean;
}

const VARIANT_BASE: Record<CardVariant, string> = {
  flat: 'bg-white border border-bg-tertiary',
  elevated: 'bg-white border border-transparent shadow-sm',
  accent: 'bg-white border border-bg-tertiary border-l-2 border-l-accent',
};

const VARIANT_HOVER: Record<CardVariant, string> = {
  flat: 'hover:border-accent hover:shadow-card-hover',
  elevated: 'hover:-translate-y-0.5 hover:shadow-card-hover',
  accent: '',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { children, className, variant = 'flat', interactive = true, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-none transition-colors duration-200 ease-out',
        VARIANT_BASE[variant],
        interactive && VARIANT_HOVER[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardHeader({ children, className, ...rest }: CardHeaderProps) {
  return (
    <div
      className={`p-4 border-b border-bg-tertiary ${className || ''}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

export function CardTitle({ children, className, ...rest }: CardTitleProps) {
  return (
    <h3
      className={`font-serif font-semibold text-lg text-text-primary ${className || ''}`}
      {...rest}
    >
      {children}
    </h3>
  );
}

/** New: secondary line under CardTitle — used for descriptions / metadata. */
export interface CardDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export function CardDescription({ children, className, ...rest }: CardDescriptionProps) {
  return (
    <p
      className={`text-sm text-text-muted mt-1 ${className || ''}`}
      {...rest}
    >
      {children}
    </p>
  );
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardContent({ children, className, ...rest }: CardContentProps) {
  return (
    <div className={`p-4 ${className || ''}`} {...rest}>
      {children}
    </div>
  );
}

/** New: bottom region for actions (buttons, links, etc.). */
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardFooter({ children, className, ...rest }: CardFooterProps) {
  return (
    <div
      className={`p-4 border-t border-bg-tertiary ${className || ''}`}
      {...rest}
    >
      {children}
    </div>
  );
}
