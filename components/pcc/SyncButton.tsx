'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ApiError } from '@/lib/api';
import type { SyncResult } from '@/lib/pccTypes';

interface Props {
  label: string;
  /** POSTs a sync and returns the backend's result (message or counts map). */
  run: () => Promise<SyncResult | unknown>;
  /** Called after a successful sync (e.g. to refetch the list). */
  onDone?: () => void;
  variant?: 'primary' | 'secondary';
}

function describe(result: unknown): string {
  if (typeof result === 'string') return result || 'Sync complete.';
  if (result && typeof result === 'object') {
    const entries = Object.entries(result as Record<string, unknown>);
    if (entries.length === 0) return 'Sync complete.';
    return 'Synced ' + entries.map(([k, v]) => `${k}: ${v}`).join(', ');
  }
  return 'Sync complete.';
}

/** Button + inline status for a PCC sync action. */
export function SyncButton({ label, run, onDone, variant = 'secondary' }: Props) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  async function handle() {
    setBusy(true);
    setNote(null);
    try {
      const result = await run();
      setNote({ ok: true, text: describe(result) });
      onDone?.();
    } catch (err) {
      setNote({
        ok: false,
        text: err instanceof ApiError ? err.message : 'Sync failed.',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
      <Button variant={variant} onClick={handle} disabled={busy}>
        {busy ? 'Syncing…' : label}
      </Button>
      {note && <span className={`sync-note ${note.ok ? 'ok' : 'err'}`}>{note.text}</span>}
    </span>
  );
}
