'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { Topbar } from '@/components/shell/Topbar';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { SyncButton } from '@/components/pcc/SyncButton';
import { useOrg } from '@/lib/orgContext';
import { useApi } from '@/lib/useApi';
import { facilitiesApi } from '@/lib/endpoints';

export default function FacilitiesPage() {
  const { orgs, org, orgUuid, loading: orgsLoading, selectOrg } = useOrg();
  // Both facility endpoints are keyed by the selected org's pccOrgUuid.
  const fetcher = useCallback(
    () => (orgUuid ? facilitiesApi.list(orgUuid) : Promise.resolve([])),
    [orgUuid],
  );
  const { data, loading, error, refetch } = useApi(fetcher, [orgUuid]);
  const facilities = data ?? [];

  return (
    <>
      <Topbar
        title="Facilities"
        crumbs={[{ label: 'PCC' }]}
        actions={
          orgUuid && (
            <SyncButton
              label="Sync from PCC"
              variant="primary"
              run={() => facilitiesApi.syncAll(orgUuid)}
              onDone={refetch}
            />
          )
        }
      />
      <main className="content">
        {/* Organization picker — its pccOrgUuid is mapped into {orgUuid} for
            GET /syncare/pcc/{orgUuid}/facility and the sync POST. */}
        <div className="toolbar">
          <div className="field" style={{ minWidth: 260 }}>
            <label htmlFor="fac-org">Organization</label>
            <select
              id="fac-org"
              className="input"
              value={org?.id ?? ''}
              disabled={orgsLoading || orgs.length === 0}
              onChange={(e) => selectOrg(e.target.value)}
            >
              <option value="" disabled>
                {orgsLoading ? 'Loading…' : 'Select an organization…'}
              </option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
          {orgUuid && (
            <span className="sync-note" style={{ alignSelf: 'end', paddingBottom: 8 }}>
              orgUuid = <code>{orgUuid}</code>
            </span>
          )}
        </div>

        {!orgUuid ? (
          <div className="state">Select an organization to view its facilities.</div>
        ) : (
          <>
            {loading && <div className="state">Loading facilities…</div>}
            {error && !loading && (
              <div className="state">
                <p style={{ margin: '0 0 var(--space-3)' }}>{error}</p>
                <Button variant="secondary" onClick={refetch}>
                  Try again
                </Button>
              </div>
            )}
            {!loading && !error && facilities.length === 0 && (
              <div className="state">No facilities found. Try syncing from PCC.</div>
            )}
            {!loading && !error && facilities.length > 0 && (
              <table className="table">
                <thead>
                  <tr>
                    <th>Facility</th>
                    <th>Fac ID</th>
                    <th>Location</th>
                    <th>Beds</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Patients</th>
                  </tr>
                </thead>
                <tbody>
                  {facilities.map((f) => (
                    <tr key={f.facId}>
                      <td>{f.facilityName}</td>
                      <td className="text-muted">{f.facId}</td>
                      <td className="text-muted">
                        {[f.city, f.state].filter(Boolean).join(', ') || '—'}
                      </td>
                      <td className="text-muted">{f.bedCount ?? '—'}</td>
                      <td className="text-muted">{f.lineOfBusiness?.shortDesc ?? f.healthType ?? '—'}</td>
                      <td>
                        <Tag tone={f.active ? 'accent' : 'neutral'}>
                          {f.facilityStatus ?? (f.active ? 'Active' : 'Inactive')}
                        </Tag>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link href={`/patients?facId=${f.facId}`}>View patients</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </main>
    </>
  );
}
