/**
 * Portal layout system — Breadcrumbs.
 *
 * Renders an ordered list of crumbs. The final crumb (no `to`) is marked
 * `aria-current="page"`; intermediate crumbs with a `to` render as links.
 * A `ChevronRight` separator sits between items. The whole nav is hidden
 * when there are no items.
 *
 * Uses `<Link>` so this component must live inside a <Router>.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from './types';

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({
  items,
  className,
}: BreadcrumbsProps): React.ReactElement | null {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn('min-w-0', className)}>
      <ol className="flex items-center gap-1 text-sm flex-wrap">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1">
            {index > 0 && (
              <ChevronRight
                aria-hidden="true"
                className="w-3 h-3 text-text-muted"
              />
            )}
            {item.to ? (
              <Link
                to={item.to}
                className="text-text-secondary hover:text-text-primary truncate"
              >
                {item.label}
              </Link>
            ) : (
              <span
                aria-current="page"
                className="text-text-primary font-medium truncate"
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;
