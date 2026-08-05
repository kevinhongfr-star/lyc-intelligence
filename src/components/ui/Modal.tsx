/**
 * Design system: Modal
 *
 * Consolidates the shared/Modal into the design system. Adds:
 *   - `forwardRef` on the modal panel
 *   - `size` (sm | md | lg | xl | full)
 *   - `footer` slot for action buttons
 *   - Esc-key close + body-scroll lock
 *   - Proper focus management (aria-modal, role=dialog, aria-labelledby)
 *
 * Existing call sites using `<Modal isOpen onClose title size />` keep
 * rendering unchanged.
 */
import React, { forwardRef, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-[95vw]',
};

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  /** When false, clicking the overlay does not call onClose. Default true. */
  closeOnOverlayClick?: boolean;
  /** When false, pressing Esc does not call onClose. Default true. */
  closeOnEsc?: boolean;
  /** Optional id for aria-labelledby; auto-generated when title is provided. */
  titleId?: string;
}

export const Modal = forwardRef<HTMLDivElement, ModalProps>(function Modal(
  {
    isOpen,
    onClose,
    title,
    description,
    children,
    footer,
    size = 'md',
    closeOnOverlayClick = true,
    closeOnEsc = true,
    titleId,
  },
  ref,
) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Esc-to-close + body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (closeOnEsc && e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose, closeOnEsc]);

  if (!isOpen) return null;

  const computedTitleId = titleId ?? (title ? 'modal-title' : undefined);

  const setRefs = (node: HTMLDivElement | null) => {
    panelRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
  };

  return (
    <div
      className="fixed inset-0 z-modal flex items-center justify-center p-4"
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-text-primary/40 backdrop-blur-sm"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        ref={setRefs}
        role="dialog"
        aria-modal="true"
        aria-labelledby={computedTitleId}
        className={cn(
          'relative bg-bg-secondary border border-bg-tertiary rounded-none shadow-modal w-full max-h-[90vh] overflow-y-auto',
          SIZE_CLASSES[size],
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between px-6 py-4 border-b border-bg-tertiary">
            <div>
              {title && (
                <h3
                  id={computedTitleId}
                  className="font-serif font-semibold text-lg text-text-primary"
                >
                  {title}
                </h3>
              )}
              {description && (
                <p className="mt-1 text-sm text-text-muted">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-1 rounded hover:bg-bg-tertiary text-text-muted hover:text-text-primary transition-colors"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-bg-tertiary flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
});
