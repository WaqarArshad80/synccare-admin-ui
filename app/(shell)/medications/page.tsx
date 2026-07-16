'use client';

import { useState } from 'react';
import { Topbar } from '@/components/shell/Topbar';
import { SyncButton } from '@/components/pcc/SyncButton';
import { useOrg } from '@/lib/orgContext';
import { medicationsApi } from '@/lib/endpoints';

// Values the sync-all endpoint accepts for its ?patientStatus filter.
const PATIENT_STATUSES = ['Current', 'New', 'Discharged'];

export default function MedicationsPage() {
  const { orgs, org, orgUuid, loading: orgsLoading, selectOrg } = useOrg();
  // patientStatus filters which patients get their medications synced. Sent as
  // the ?patientStatus query param on POST /medications/sync-all.
  const [patientStatus, setPatientStatus] = useState('Current');

  return (
    <>
      <Topbar
        title="Medications"
        crumbs={[{ label: 'PCC' }]}
        actions={
          orgUuid && (
            <SyncButton
              label="Sync all from PCC"
              variant="primary"
              run={() => medicationsApi.syncAll(orgUuid, { patientStatus })}
            />
          )
        }
      />
      <main className="content">
        {/* Organization picker — its pccOrgUuid is mapped into {orgUuid} for
            POST /syncare/pcc/{orgUuid}/medications/sync-all. */}
        <div className="toolbar">
          <div className="field" style={{ minWidth: 260 }}>
            <label htmlFor="med-org">Organization</label>
            <select
              id="med-org"
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
            <label htmlFor="med-status">Patient status (for sync)</label>
            <select
              id="med-status"
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

          {orgUuid && (
            <span className="sync-note" style={{ alignSelf: 'end', paddingBottom: 8 }}>
              orgUuid = <code>{orgUuid}</code>
            </span>
          )}
        </div>

        {!orgUuid ? (
          <div className="state">Select an organization to sync its medications.</div>
        ) : (
          <div className="state">
            Use “Sync all from PCC” to pull every facility&apos;s medications for this
            organization (patient status <code>{patientStatus}</code>).
          </div>
        )}
      </main>
    </>
  );
}
