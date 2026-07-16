'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';

interface Props {
  loading: boolean;
  error: string | null;
  empty: boolean;
  emptyText?: string;
  onRetry?: () => void;
  children: ReactNode;
}

/** Renders loading / error / empty states, else the children (the data view). */
export function AsyncState({ loading, error, empty, emptyText = 'Nothing to show.', onRetry, children }: Props) {
  if (loading) return <div className="state">Loading…</div>;
  if (error)
    return (
      <div className="state">
        <p style={{ margin: '0 0 var(--space-3)' }}>{error}</p>
        {onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    );
  if (empty) return <div className="state">{emptyText}</div>;
  return <>{children}</>;
}
