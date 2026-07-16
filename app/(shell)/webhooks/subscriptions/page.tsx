'use client';

import { useCallback } from 'react';
import { Topbar } from '@/components/shell/Topbar';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { useApi } from '@/lib/useApi';
import { webhooksApi } from '@/lib/endpoints';
import { formatDate } from '@/lib/format';

const APPLICATION_NAME = 'syncare';

function yesNo(v?: boolean): string {
  return v === undefined ? '—' : v ? 'Yes' : 'No';
}

export default function WebhookSubscriptionsPage() {
  const fetcher = useCallback(() => webhooksApi.subscriptions(APPLICATION_NAME), []);
  const { data, loading, error, refetch } = useApi(fetcher, []);
  const subscriptions = data ?? [];

  return (
    <>
      <Topbar
        title="Subscribed"
        crumbs={[{ label: 'Webhooks' }]}
        actions={
          <Button variant="secondary" onClick={refetch} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </Button>
        }
      />
      <main className="content">
        <div className="toolbar">
          <span className="sync-note" style={{ alignSelf: 'center' }}>
            applicationName = <code>{APPLICATION_NAME}</code>
          </span>
        </div>

        {loading && <div className="state">Loading subscriptions…</div>}

        {error && !loading && (
          <div className="state">
            <p style={{ margin: '0 0 var(--space-3)' }}>{error}</p>
            <Button variant="secondary" onClick={refetch}>
              Try again
            </Button>
          </div>
        )}

        {!loading && !error && subscriptions.length === 0 && (
          <div className="state">No webhook subscriptions found for “{APPLICATION_NAME}”.</div>
        )}

        {!loading &&
          !error &&
          subscriptions.map((s, i) => (
            <div
              key={s.webhookSubscriptionId ?? i}
              className="card"
              style={{ maxWidth: 760, marginBottom: 'var(--space-4)' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  marginBottom: 'var(--space-4)',
                }}
              >
                <h2 style={{ margin: 0, fontSize: 16 }}>
                  Subscription #{s.webhookSubscriptionId ?? '—'}
                </h2>
                {s.status && (
                  <Tag tone={s.status === 'APPROVED' ? 'accent' : 'neutral'}>{s.status}</Tag>
                )}
                {s.action && <Tag tone="outline">{s.action}</Tag>}
              </div>

              <dl className="def-list">
                <dt>Webhook subscription ID</dt>
                <dd>{s.webhookSubscriptionId ?? '—'}</dd>
                <dt>Action</dt>
                <dd>{s.action ?? '—'}</dd>
                <dt>Application name</dt>
                <dd>{s.applicationName ?? '—'}</dd>
                <dt>Application type</dt>
                <dd>{s.applicationType ?? '—'}</dd>
                <dt>Status</dt>
                <dd>{s.status ?? '—'}</dd>
                <dt>Username</dt>
                <dd>{s.username ?? '—'}</dd>
                <dt>End URL</dt>
                <dd style={{ wordBreak: 'break-all' }}>{s.endUrl ?? '—'}</dd>
                <dt>Include discharged</dt>
                <dd>{yesNo(s.includeDischarged)}</dd>
                <dt>Include outpatient</dt>
                <dd>{yesNo(s.includeOutpatient)}</dd>
                <dt>Room reservation cancellation</dt>
                <dd>{yesNo(s.enableRoomReservationCancellation)}</dd>
                <dt>Vendor external ID</dt>
                <dd>{s.vendorExternalId ?? '—'}</dd>
                <dt>Created</dt>
                <dd>{formatDate(s.createdDate)}</dd>
                <dt>Revised</dt>
                <dd>{formatDate(s.revisionDate)}</dd>

                <dt>Event groups</dt>
                <dd>
                  {s.eventGroupList && s.eventGroupList.length > 0 ? (
                    <span style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {s.eventGroupList.map((g) => (
                        <Tag key={g} tone="neutral">
                          {g}
                        </Tag>
                      ))}
                    </span>
                  ) : (
                    '—'
                  )}
                </dd>

                <dt>Current subscription</dt>
                <dd>
                  {s.currentSubscription && s.currentSubscription.length > 0 ? (
                    <table className="table" style={{ marginTop: 4 }}>
                      <thead>
                        <tr>
                          <th>Org UUID</th>
                          <th>Action</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {s.currentSubscription.map((c, j) => (
                          <tr key={c.orgUuid ?? j}>
                            <td className="text-muted" style={{ wordBreak: 'break-all' }}>
                              {c.orgUuid ?? '—'}
                            </td>
                            <td>{c.action ?? '—'}</td>
                            <td>
                              <Tag tone={c.status === 'SUCCESS' ? 'accent' : 'neutral'}>
                                {c.status ?? '—'}
                              </Tag>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    '—'
                  )}
                </dd>
              </dl>
            </div>
          ))}
      </main>
    </>
  );
}
