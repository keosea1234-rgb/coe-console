import type { ReactNode } from 'react';
import { theme } from '../../styles/theme';

// --- Modal -----------------------------------------------------------------
export function Modal({
  open,
  onClose,
  children,
  maxWidth = 840,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: number;
}) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,.42)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '40px 16px',
        overflowY: 'auto',
        animation: 'fadeBg .2s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: theme.surface,
          borderRadius: 12,
          width: '100%',
          maxWidth,
          border: `1px solid ${theme.border}`,
          boxShadow: '0 24px 48px rgba(15,23,42,.18)',
          animation: 'popIn .22s cubic-bezier(.16,1,.3,1)',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// --- SlideOver -------------------------------------------------------------
export function SlideOver({
  open,
  onClose,
  children,
  width = 420,
  title,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: number;
  title?: ReactNode;
  footer?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,.38)',
        backdropFilter: 'blur(2px)',
        zIndex: 60,
        display: 'flex',
        justifyContent: 'flex-end',
        animation: 'fadeBg .2s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width,
          maxWidth: '92vw',
          height: '100%',
          background: theme.surface,
          borderLeft: `1px solid ${theme.border}`,
          boxShadow: '-12px 0 40px rgba(15,23,42,.12)',
          animation: 'slideIn .24s cubic-bezier(.16,1,.3,1)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {title && (
          <div
            style={{
              padding: '14px 18px',
              borderBottom: `1px solid ${theme.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            {title}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="ui-btn ui-btn--ghost"
              style={{ width: 32, height: 32, padding: 0 }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}
        <div style={{ overflowY: 'auto', flex: 1 }}>{children}</div>
        {footer}
      </div>
    </div>
  );
}
