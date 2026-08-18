/**
 * Design system: Card
 *
 * Adds CardDescription + CardFooter to the Phase 0 set, and forwards refs.
 * Existing exports (Card, CardHeader, CardTitle, CardContent) keep their
 * signatures so current call sites render unchanged.
 */
import React, { forwardRef } from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { children, className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={`bg-bg-secondary border border-bg-tertiary ${className || ''}`}
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
