/**
 * V1 Design System — Modal / Dialog
 *
 * V4.5.9a — re-skinned to V1 brand rules:
 *   - Zero border radius everywhere (no rounded corners).
 *   - No box shadows. Bordered (1px ink-200) only.
 *   - Backdrop: semi-transparent cream with blur (no dark overlay).
 *   - Close: text "×" symbol (not Lucide icon).
 *   - Title: serif display (Crimson Pro). Body: Inter.
 *   - Focus: teal-600 outline (visible, keyboard-only).
 *   - Animations: subtle fade + 4px Y shift (V1 motion).
 *
 * Accessibility preserved:
 *   - Focus trap (Tab / Shift+Tab cycling)
 *   - Focus restoration on close
 *   - Escape key handling
 *   - Body scroll lock
 *   - ARIA compliance (role="dialog", aria-modal, aria-labelledby)
 *
 * @example
 * ```tsx
 * function ConfirmDialog({ open, onClose }) {
 *   return (
 *     <Modal isOpen={open} onClose={onClose} title="Confirm">
 *       <p>Are you sure?</p>
 *       <button onClick={onClose}>Cancel</button>
 *     </Modal>
 *   );
 * }
 * ```
 */
import React, { forwardRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useFocusTrap } from '@/hooks/useAccessibleFocus';
import { V1 } from '@/styles/v1-tokens';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

const SIZE_WIDTH: Record<ModalSize, number> = {
  sm: 384,
  md: 448,
  lg: 512,
  xl: 576,
  full: 0, // 95vw
};

export interface ModalProps {
  /** Controls visibility of the modal. */
  isOpen: boolean;
  /** Called when the user requests to close (Esc, overlay, or close button). */
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
 * V1 Modal Dialog.
 *
 * Uses useFocusTrap internally to manage keyboard focus.
 * V1 motion: fade-in + 4px Y shift (200ms ease).
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

  const computedTitleId = titleId ?? (title ? 'v1-modal-title' : undefined);
  const panelWidth = SIZE_WIDTH[size];

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

  // V1 backdrop: semi-transparent cream with blur (no dark overlay)
  const backdropStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: `rgba(250, 250, 250, 0.82)`,
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    animation: `v1-modal-backdrop-in ${V1.durNormal}ms ease-out forwards`,
  };

  // V1 panel: bordered, no shadow, zero radius
  const panelStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    maxWidth: size === 'full' ? '95vw' : `${panelWidth}px`,
    maxHeight: '90vh',
    overflowY: 'auto',
    background: V1.surface,
    border: `1px solid ${V1.border}`,
    borderRadius: V1.radius,
    boxShadow: 'none',
    animation: `v1-modal-in ${V1.durNormal}ms ${V1.ease} forwards`,
  };

  // Header style — bordered bottom rule
  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    borderBottom: `1px solid ${V1.border}`,
    padding: '20px 24px',
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: V1.displayFont,
    fontSize: 22,
    fontWeight: V1.fwSemibold,
    color: V1.text,
    letterSpacing: V1.trackingTight,
    lineHeight: V1.leadingHeading,
    margin: 0,
  };

  const descriptionStyle: React.CSSProperties = {
    marginTop: 4,
    fontFamily: V1.bodyFont,
    fontSize: V1.textBodySm,
    color: V1.textMuted,
    lineHeight: V1.leadingBody,
  };

  // Close button — text "×", V1 focus ring (teal)
  const closeButtonStyle: React.CSSProperties = {
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    padding: 0,
    background: 'transparent',
    border: 'none',
    color: V1.textMuted,
    fontFamily: V1.bodyFont,
    fontSize: 24,
    lineHeight: 1,
    cursor: 'pointer',
    borderRadius: V1.radius,
    transition: `color ${V1.durFast}ms ease`,
  };

  const bodyStyle: React.CSSProperties = {
    padding: '20px 24px',
    color: V1.text,
    fontFamily: V1.bodyFont,
    fontSize: V1.textBodySm,
    lineHeight: V1.leadingBody,
  };

  const footerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    borderTop: `1px solid ${V1.border}`,
    padding: '16px 24px',
  };

  return (
    <div
      className={cn('v1-scope fixed inset-0 z-[1050] flex items-center justify-center p-4', className)}
      role="presentation"
    >
      {/* Inline V1 modal motion styles */}
      <style>{`
        @keyframes v1-modal-backdrop-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes v1-modal-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .v1-modal-close:focus-visible {
          outline: 2px solid ${V1.teal600};
          outline-offset: 2px;
        }
        .v1-modal-close:hover {
          color: ${V1.text};
        }
      `}</style>

      {/* Backdrop */}
      <div
        style={backdropStyle}
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Dialog Panel */}
      <div
        ref={setRefs}
        role="dialog"
        aria-modal="true"
        aria-labelledby={computedTitleId}
        aria-describedby={description ? 'v1-modal-description' : undefined}
        style={panelStyle}
      >
        {(title || description) && (
          <div style={headerStyle}>
            <div style={{ minWidth: 0, flex: 1 }}>
              {title && (
                <h3 id={computedTitleId} style={titleStyle}>
                  {title}
                </h3>
              )}
              {description && (
                <p id="v1-modal-description" style={descriptionStyle}>
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="v1-modal-close"
              style={closeButtonStyle}
            >
              ×
            </button>
          </div>
        )}

        <div style={bodyStyle}>{children}</div>

        {footer && <div style={footerStyle}>{footer}</div>}
      </div>
    </div>
  );
});
