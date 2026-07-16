'use client';

import { useState } from 'react';
import { Topbar } from '@/components/shell/Topbar';
import { SyncButton } from '@/components/pcc/SyncButton';
import { useOrg } from '@/lib/orgContext';
import { observationsApi } from '@/lib/endpoints';

// Values the sync-all endpoint accepts for its ?patientStatus filter.
const PATIENT_STATUSES = ['Current', 'New', 'Discharged'];

export default function ObservationsPage() {
  const { orgs, org, orgUuid, loading: orgsLoading, selectOrg } = useOrg();
  // patientStatus filters which patients get their observations synced; latest
  // limits the sync to each patient's most recent observations. Both are sent as
  // query params on POST /observations/sync-all.
  const [patientStatus, setPatientStatus] = useState('Current');
  const [latest, setLatest] = useState(false);

  return (
    <>
      <Topbar
        title="Observations"
        crumbs={[{ label: 'PCC' }]}
        actions={
          orgUuid && (
            <SyncButton
              label="Sync all from PCC"
              variant="primary"
              run={() => observationsApi.syncAll(orgUuid, { patientStatus, latest })}
            />
          )
        }
      />
      <main className="content">
        {/* Organization picker — its pccOrgUuid is mapped into {orgUuid} for
            POST /syncare/pcc/{orgUuid}/observations/sync-all. */}
        <div className="toolbar">
          <div className="field" style={{ minWidth: 260 }}>
            <label htmlFor="obs-org">Organization</label>
            <select
              id="obs-org"
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

          <div className="field" style={{ minWidth: 160 }}>
            <label htmlFor="obs-status">Patient status (for sync)</label>
            <select
              id="obs-status"
              className="input"
              value={patientStatus}
              onChange={(e) => setPatientStatus(e.target.value)}
            >
              {PATIENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="obs-latest">Latest only</label>
            <label className="checkbox" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 38 }}>
              <input
                id="obs-latest"
                type="checkbox"
                checked={latest}
                onChange={(e) => setLatest(e.target.checked)}
              />
              <span className="text-muted">Most recent observations only</span>
            </label>
          </div>

          {orgUuid && (
            <span className="sync-note" style={{ alignSelf: 'end', paddingBottom: 8 }}>
              orgUuid = <code>{orgUuid}</code>
            </span>
          )}
        </div>

        {!orgUuid ? (
          <div className="state">Select an organization to sync its observations.</div>
        ) : (
          <div className="state">
            Use “Sync all from PCC” to pull every facility&apos;s observations for this
            organization (patient status <code>{patientStatus}</code>, latest{' '}
            <code>{String(latest)}</code>).
          </div>
        )}
      </main>
    </>
  );
}
