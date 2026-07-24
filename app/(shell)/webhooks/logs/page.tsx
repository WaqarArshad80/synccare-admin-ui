'use client';

import { useCallback, useState } from 'react';
import { Topbar } from '@/components/shell/Topbar';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { useApi } from '@/lib/useApi';
import { organizationsApi, webhooksApi } from '@/lib/endpoints';
import type { WebhookLog } from '@/lib/pccTypes';

// The filter form's raw string state — converted to typed query params on search.
interface Filters {
  orgUuid: string;
  eventType: string;
  status: string;
  patientId: string;
  facId: string;
}

const EMPTY: Filters = { orgUuid: '', eventType: '', status: '', patientId: '', facId: '' };

// Dates arrive as ISO strings or Mongo `{ $date }` wrappers; ids as strings or
// `{ $oid }`. Normalize both.
function mongoDate(v?: { $date?: string } | string): string | undefined {
  if (!v) return undefined;
  return typeof v === 'string' ? v : v.$date;
}
function mongoId(v?: { $oid?: string } | string): string | undefined {
  if (!v) return undefined;
  return typeof v === 'string' ? v : v.$oid;
}
function formatDateTime(value?: string): string {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

// Pretty-print the stored JSON payload; fall back to the raw string.
function prettyPayload(payload?: string): string {
  if (!payload) return '—';
  try {
    return JSON.stringify(JSON.parse(payload), null, 2);
  } catch {
    return payload;
  }
}

function statusTone(status?: string): 'accent' | 'neutral' | 'outline' {
  switch (status?.toUpperCase()) {
    case 'PROCESSED':
      return 'accent';
    case 'FAILED':
    case 'ERROR':
      return 'outline';
    default:
      return 'neutral';
  }
}

function toParams(f: Filters) {
  const patientId = f.patientId.trim() ? Number(f.patientId.trim()) : undefined;
  const facId = f.facId.trim() ? Number(f.facId.trim()) : undefined;
  return {
    orgUuid: f.orgUuid.trim() || undefined,
    eventType: f.eventType.trim() || undefined,
    status: f.status.trim() || undefined,
    patientId: Number.isNaN(patientId) ? undefined : patientId,
    facId: Number.isNaN(facId) ? undefined : facId,
  };
}

export default function WebhookLogsPage() {
  const [filters, setFilters] = useState<Filters>(EMPTY);
  // `applied` is what actually drives the fetch — updated only on Search/Clear so
  // typing doesn't fire a request per keystroke.
  const [applied, setApplied] = useState<Filters>(EMPTY);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Organizations for the orgUuid picker (value = pccOrgUuid).
  const orgFetcher = useCallback(() => organizationsApi.list(), []);
  const { data: orgs } = useApi(orgFetcher, []);

  const fetcher = useCallback(() => webhooksApi.logs(toParams(applied)), [applied]);
  const { data, loading, error, refetch } = useApi(fetcher, [applied]);
  const logs = data ?? [];

  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
  const search = (e: React.FormEvent) => {
    e.preventDefault();
    setApplied(filters);
  };
  const clear = () => {
    setFilters(EMPTY);
    setApplied(EMPTY);
  };

  return (
    <>
      <Topbar
        title="Logs"
        crumbs={[{ label: 'Webhooks' }]}
        actions={
          <Button variant="secondary" onClick={refetch} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </Button>
        }
      />
      <main className="content">
        {/* All filters optional and combinable → GET /syncare/webhook-logs?… */}
        <form className="toolbar" onSubmit={search}>
          <div className="field" style={{ minWidth: 220 }}>
            <label htmlFor="wl-org">Organization</label>
            <select
              id="wl-org"
              className="input"
              value={filters.orgUuid}
              onChange={(e) => set({ orgUuid: e.target.value })}
            >
              <option value="">All organizations</option>
              {(orgs ?? []).map((o) => (
                <option key={o.id} value={o.pccOrgUuid}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field" style={{ minWidth: 220 }}>
            <label htmlFor="wl-event">Event type</label>
            <input
              id="wl-event"
              className="input"
              placeholder="e.g. patient.updateResidentInfo"
              value={filters.eventType}
              onChange={(e) => set({ eventType: e.target.value })}
            />
          </div>

          <div className="field" style={{ minWidth: 140 }}>
            <label htmlFor="wl-status">Status</label>
            <input
              id="wl-status"
              className="input"
              placeholder="e.g. PROCESSED"
              value={filters.status}
              onChange={(e) => set({ status: e.target.value })}
            />
          </div>

          <div className="field" style={{ minWidth: 120 }}>
            <label htmlFor="wl-patient">Patient ID</label>
            <input
              id="wl-patient"
              type="number"
              className="input"
              value={filters.patientId}
              onChange={(e) => set({ patientId: e.target.value })}
            />
          </div>

          <div className="field" style={{ minWidth: 100 }}>
            <label htmlFor="wl-fac">Facility ID</label>
            <input
              id="wl-fac"
              type="number"
              className="input"
              value={filters.facId}
              onChange={(e) => set({ facId: e.target.value })}
            />
          </div>

          <div className="field" style={{ alignSelf: 'end' }}>
            <span style={{ display: 'inline-flex', gap: 'var(--space-2)' }}>
              <Button type="submit" variant="primary">
                Search
              </Button>
              <Button type="button" variant="ghost" onClick={clear}>
                Clear
              </Button>
            </span>
          </div>
        </form>

        {loading && <div className="state">Loading webhook logs…</div>}

        {error && !loading && (
          <div className="state">
            <p style={{ margin: '0 0 var(--space-3)' }}>{error}</p>
            <Button variant="secondary" onClick={refetch}>
              Try again
            </Button>
          </div>
        )}

        {!loading && !error && logs.length === 0 && (
          <div className="state">No webhook logs match these filters.</div>
        )}

        {!loading && !error && logs.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Received</th>
                <th>Event type</th>
                <th>Status</th>
                <th>Patient</th>
                <th>Facility</th>
                <th>Message ID</th>
                <th style={{ textAlign: 'right' }}>Payload</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log: WebhookLog, i) => {
                const id = mongoId(log._id) ?? log.messageId ?? String(i);
                const isOpen = expanded === id;
                return (
                  <FragmentRow
                    key={id}
                    log={log}
                    open={isOpen}
                    onToggle={() => setExpanded(isOpen ? null : id)}
                  />
                );
              })}
            </tbody>
          </table>
        )}
      </main>
    </>
  );
}

function FragmentRow({
  log,
  open,
  onToggle,
}: {
  log: WebhookLog;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr>
        <td className="text-muted">{formatDateTime(mongoDate(log.receivedAt))}</td>
        <td>
          {log.eventType ?? '—'}
          {log.eventSubType ? <span className="text-muted"> · {log.eventSubType}</span> : null}
        </td>
        <td>
          <Tag tone={statusTone(log.status)}>{log.status ?? '—'}</Tag>
        </td>
        <td className="text-muted">{log.patientId ?? '—'}</td>
        <td className="text-muted">{log.facId ?? '—'}</td>
        <td className="text-muted" style={{ wordBreak: 'break-all' }}>
          {log.messageId ?? '—'}
        </td>
        <td style={{ textAlign: 'right' }}>
          <Button variant="ghost" onClick={onToggle}>
            {open ? 'Hide' : 'View'}
          </Button>
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={7}>
            <dl className="def-list">
              <dt>Org UUID</dt>
              <dd style={{ wordBreak: 'break-all' }}>{log.orgUuid ?? '—'}</dd>
              <dt>Org ID</dt>
              <dd>{log.orgId ?? '—'}</dd>
              <dt>Resource ID</dt>
              <dd>{log.resourceId ?? '—'}</dd>
              <dt>Processing details</dt>
              <dd>{log.processingDetails ?? '—'}</dd>
              <dt>Event date</dt>
              <dd>{formatDateTime(mongoDate(log.eventDate))}</dd>
              <dt>Message date</dt>
              <dd>{formatDateTime(mongoDate(log.messageDate))}</dd>
              <dt>Processed at</dt>
              <dd>{formatDateTime(mongoDate(log.processedAt))}</dd>
              <dt>Source IP</dt>
              <dd>{log.sourceIp ?? '—'}</dd>
              <dt>Payload</dt>
              <dd>
                <pre
                  style={{
                    margin: 0,
                    overflowX: 'auto',
                    background: 'var(--color-surface-2, rgba(0,0,0,0.04))',
                    padding: 'var(--space-3)',
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                >
                  {prettyPayload(log.payload)}
                </pre>
              </dd>
            </dl>
          </td>
        </tr>
      )}
    </>
  );
}
