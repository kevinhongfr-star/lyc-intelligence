/**
 * Phase 5: ECHO v6.0 Accessible Modal
 *
 * Fully accessible modal dialog with:
 *   - Focus trap (Tab / Shift+Tab cycling)
 *   - Focus restoration on close
 *   - Escape key handling
 *   - Body scroll lock
 *   - ARIA compliance (role="dialog", aria-modal, aria-labelledby)
 *   - ECHO v6.0 design: zero border-radius, #C108AB accent
 *   - Smooth enter/exit animations from motion.css
 *
 * @example
 * ```tsx * function ConfirmDialog({ open, onClose }) { * return ( * <Modal isOpen={open} onClose={onClose} title="Confirm"> * <p>Are you sure?</p> * <button onClick={onClose}>Cancel</button> * </Modal> * ); * } *```
 */
import React, { forwardRef, useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFocusTrap } from '@/hooks/useAccessibleFocus';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-[95vw]',
};

export interface ModalProps {
  /** Controls visibility of the modal. */
  isOpen: boolean;
  /** Called when the user requests to close (Esc, overlay, or X button). */
  onClose: () => void;
  /** Optional title rendered in the modal header. */
  title?: React.ReactNode;
  /** Optional description rendered below the title. */
  description?: React.ReactNode;
  /** Modal body content. */
  children?: React.ReactNode;
  /** Optional footer slot for action buttons. */
  footer?: React.ReactNode;
  /** Size preset. Default: 'md'. */
  size?: ModalSize;
  /** When false, clicking the overlay does not call onClose. Default: true. */
  closeOnOverlayClick?: boolean;
  /** When false, pressing Esc does not call onClose. Default: true. */
  closeOnEsc?: boolean;
  /** Optional id for aria-labelledby; auto-generated when title is provided. */
  titleId?: string;
  /** When false, the focus trap is disabled. Default: true. */
  trapFocus?: boolean;
  /** Additional class names for the panel. */
  className?: string;
}

/**
 * ECHO v6.0 Accessible Modal Dialog.
 *
 * Uses useFocusTrap internally to manage keyboard focus.
 * Applies motion.css animations for open/close transitions.
 */
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
    trapFocus = true,
    className,
  },
  ref,
) {
  const { ref: trapRef } = useFocusTrap({
    active: isOpen && trapFocus,
    autoFocus: true,
    onEscape: closeOnEsc ? onClose : undefined,
    restoreFocus: true,
  });

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const computedTitleId = titleId ?? (title ? 'echo-modal-title' : undefined);

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      // Set the trap ref
      (trapRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      // Set the forwarded ref
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    },
    [ref, trapRef],
  );

  return (
    <div
      className="fixed inset-0 z-[1050] flex items-center justify-center p-4"
      role="presentation"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-[var(--echo-text-primary)]/40 backdrop-blur-sm animate-[echo-fade-in_150ms_ease-out_forwards]"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Dialog Panel */}
      <div
        ref={setRefs}
        role="dialog"
        aria-modal="true"
        aria-labelledby={computedTitleId}
        aria-describedby={description ? 'echo-modal-description' : undefined}
        className={cn(
          'relative w-full max-h-[90vh] overflow-y-auto',
          'bg-[var(--echo-surface)] border border-[var(--echo-border)]',
          'shadow-[var(--echo-shadow-xl)]',
          'animate-[echo-modal-in_200ms_cubic-bezier(0.16,1,0.3,1)_forwards]',
          SIZE_CLASSES[size],
          className,
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 border-b border-[var(--echo-border)] px-6 py-4">
            <div className="min-w-0 flex-1">
              {title && (
                <h3
                  id={computedTitleId}
                  className="font-serif text-lg font-semibold text-[var(--echo-text-primary)]"
                >
                  {title}
                </h3>
              )}
              {description && (
                <p
                  id="echo-modal-description"
                  className="mt-1 text-sm text-[var(--echo-text-muted)]"
                >
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className={cn(
                'shrink-0 p-1 text-[var(--echo-text-muted)]',
                'hover:bg-[var(--echo-surface-hover)] hover:text-[var(--echo-text-primary)]',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--echo-accent)]',
                'transition-colors',
              )}
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        )}

        <div className="px-6 py-5 text-[var(--echo-text-primary)]">
          {children}
        </div>

        {footer && (
          <div className="flex justify-end gap-2 border-t border-[var(--echo-border)] px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
});
