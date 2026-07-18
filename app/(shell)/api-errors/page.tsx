'use client';

import { useCallback } from 'react';
import { Topbar } from '@/components/shell/Topbar';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { useApi } from '@/lib/useApi';
import { pendingApiCallsApi } from '@/lib/endpoints';
import { formatDate } from '@/lib/format';

// Tone the HTTP method chip like the PCC screens tone their status tags.
function methodTone(method?: string): 'accent' | 'neutral' | 'outline' {
  switch (method) {
    case 'GET':
      return 'neutral';
    case 'POST':
    case 'PUT':
    case 'DELETE':
      return 'accent';
    default:
      return 'outline';
  }
}

export default function ApiErrorsPage() {
  const fetcher = useCallback(() => pendingApiCallsApi.list(), []);
  const { data, loading, error, refetch } = useApi(fetcher, []);
  const calls = data ?? [];

  return (
    <>
      <Topbar
        title="API Errors"
        crumbs={[{ label: 'System' }]}
        actions={
          <Button variant="secondary" onClick={refetch} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </Button>
        }
      />
      <main className="content">
        <div className="toolbar">
          <span className="sync-note" style={{ alignSelf: 'center' }}>
            PCC calls that failed and are queued for retry.
          </span>
        </div>

        {loading && <div className="state">Loading pending API calls…</div>}

        {error && !loading && (
          <div className="state">
            <p style={{ margin: '0 0 var(--space-3)' }}>{error}</p>
            <Button variant="secondary" onClick={refetch}>
              Try again
            </Button>
          </div>
        )}

        {!loading && !error && calls.length === 0 && (
          <div className="state">No pending API calls. 🎉</div>
        )}

        {!loading && !error && calls.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Method</th>
                <th>URL</th>
                <th>Reason</th>
                <th>Org UUID</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {calls.map((c, i) => (
                <tr key={c.id ?? i}>
                  <td>
                    <Tag tone={methodTone(c.method)}>{c.method ?? '—'}</Tag>
                  </td>
                  <td
                    className="text-muted"
                    style={{ wordBreak: 'break-all', maxWidth: 360 }}
                    title={c.url}
                  >
                    {c.url ?? '—'}
                  </td>
                  <td>{c.reason ?? '—'}</td>
                  <td className="text-muted" style={{ wordBreak: 'break-all' }}>
                    {c.orgUuid ?? '—'}
                  </td>
                  <td className="text-muted">{formatDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </>
  );
}
