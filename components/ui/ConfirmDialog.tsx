'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';

interface Props {
  title: string;
  body: React.ReactNode;
  confirmLabel?: string;
  /** Async confirm handler; the dialog shows a pending state until it resolves. */
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}

/** Modernist confirm modal. Runs onConfirm, showing a pending/error state. */
export function ConfirmDialog({ title, body, confirmLabel = 'Confirm', onConfirm, onClose }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, busy]);

  async function confirm() {
    setError(null);
    setBusy(true);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setBusy(false);
    }
  }

  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <div className="dialog-title" id="confirm-title">
          {title}
        </div>
        <div className="dialog-body">{body}</div>
        {error && (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--color-accent-700)' }} role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirm} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
